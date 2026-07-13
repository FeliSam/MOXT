#!/usr/bin/env node
/**
 * Build MOXT + publication sur Yandex Object Storage.
 *
 * Prérequis :
 *   yc init   (CLI configurée)
 *   Bucket créé une fois : npm run web:deploy:yandex -- --init
 *
 * Variables optionnelles :
 *   MOXT_YC_BUCKET   nom du bucket (défaut : moxtapp-web)
 *   MOXT_SITE_URL    https://moxtapp.ru
 *   YC_BIN           chemin vers yc (auto sur Windows)
 *
 * Options :
 *   --full           envoie tous les fichiers (ignore la comparaison distante)
 *   --dry-run        affiche ce qui serait envoyé sans upload
 *   --transport=yc   force l'upload via yc storage s3 cp (sinon S3 natif si clés dispo)
 */
import { existsSync, writeFileSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { parseEnvFile } from './lib/env.mjs'
import { purgeCdnCache, findCdnResource } from './lib/yandex-cdn.mjs'
import { writeDeployManifest } from './lib/deploy-manifest.mjs'
import { syncDist } from './lib/yandex-upload.mjs'
import { resolveWritableS3Client } from './lib/yandex-s3.mjs'
import { ycJson } from './lib/yandex.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'moxt-react', 'dist')
const bucket = process.env.MOXT_YC_BUCKET || 'moxtapp-web'
const domain = (process.env.MOXT_DOMAIN || 'moxtapp.ru').replace(/\.$/, '')
const initMode = process.argv.includes('--init')
const spaOnly = process.argv.includes('--spa')
const skipBuild = process.argv.includes('--skip-build')
const purgeCdn = process.argv.includes('--purge-cdn')
const fullUpload = process.argv.includes('--full')
const dryRun = process.argv.includes('--dry-run')
const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const transportArg = process.argv.find((arg) => arg.startsWith('--transport='))
const forceTransport = transportArg ? transportArg.split('=')[1] : ''
const deployStatePath = process.env.MOXT_DEPLOY_STATE_PATH || path.join(root, 'scripts', '.deploy-state.json')

function ycPath() {
  if (process.env.YC_BIN) return process.env.YC_BIN
  if (process.platform === 'win32') {
    const candidate = path.join(process.env.USERPROFILE || '', 'yandex-cloud', 'bin', 'yc.exe')
    if (existsSync(candidate)) return candidate
  }
  return 'yc'
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    ...options,
  })
  return result.status ?? 1
}

function runShell(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  return result.status ?? 1
}

function setWebsiteSettings(bin, bucketName) {
  const settingsPath = path.join(tmpdir(), `moxt-website-${bucketName}.json`)
  writeFileSync(
    settingsPath,
    JSON.stringify({ index: 'index.html', error: 'index.html' }),
    'utf8',
  )
  try {
    const code = run(bin, [
      'storage',
      'bucket',
      'update',
      '--name',
      bucketName,
      '--website-settings-from-file',
      settingsPath,
    ])
    if (code !== 0) process.exit(code)
  } finally {
    try {
      unlinkSync(settingsPath)
    } catch {
      // ignore
    }
  }
}

function yc(...args) {
  const bin = ycPath()
  if (bin !== 'yc' && !existsSync(bin)) {
    console.error('\n✗ Yandex CLI introuvable. Installez :')
    console.error('  iex (New-Object System.Net.WebClient).DownloadString(\'https://storage.yandexcloud.net/yandexcloud-yc/install.ps1\')')
    console.error('  yc init')
    process.exit(1)
  }
  const code = run(bin, args)
  if (code !== 0) process.exit(code)
}

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function resolveCdnResourceId() {
  const phase2 = parseEnvFile(path.join(root, 'scripts', 'phase2.env'))
  const configured = process.env.MOXT_CDN_RESOURCE_ID || phase2.MOXT_CDN_RESOURCE_ID
  if (configured) {
    try {
      ycJson('cdn', 'resource', 'get', configured)
      return configured
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('not found') || msg.includes('NOT_FOUND')) {
        console.warn(`\n  ⚠ MOXT_CDN_RESOURCE_ID obsolète (${configured}) — auto-détection…`)
      } else {
        console.warn(`\n  ⚠ CDN resource get : ${msg}`)
      }
    }
  }
  const found = findCdnResource(domain, `www.${domain}`)
  return found?.id || null
}

async function main() {
  if (!skipBuild) {
    log('Build production', 'npm run build -w moxt')
    if (runShell('npm', ['run', 'build', '-w', 'moxt']) !== 0) {
      process.exit(1)
    }
  }

  if (!existsSync(path.join(distDir, 'index.html'))) {
    console.error(`\n✗ Build incomplet : ${distDir}/index.html manquant`)
    process.exit(1)
  }

  if (initMode) {
    log('Création bucket', bucket)
    const create = spawnSync(
      ycPath(),
      ['storage', 'bucket', 'create', '--name', bucket, '--default-storage-class', 'standard'],
      { stdio: 'pipe', encoding: 'utf8', shell: false },
    )
    if (create.status !== 0 && !String(create.stderr || create.stdout).includes('already exists')) {
      console.error(create.stderr || create.stdout)
      process.exit(create.status || 1)
    }

    log('Accès public lecture')
    yc('storage', 'bucket', 'update', '--name', bucket, '--public-read')

    log('Hébergement statique SPA', 'index.html + error → index.html')
    setWebsiteSettings(ycPath(), bucket)

    console.log(`\n✓ Bucket prêt : https://${bucket}.website.yandexcloud.net`)
    console.log('  Prochaine étape : Cloud CDN + DNS moxtapp.ru (console Yandex)')
  }

  if (spaOnly) {
    log('Hébergement statique SPA', bucket)
    yc('storage', 'bucket', 'update', '--name', bucket, '--public-read', '--public-list=false')
    setWebsiteSettings(ycPath(), bucket)
  }

  const mode = fullUpload ? 'upload complet' : 'sync manifest (diff md5)'
  const forceYc = forceTransport === 'yc'
  const writableS3 = forceYc
    ? { client: null, source: null, reason: 'forced-yc' }
    : await resolveWritableS3Client(bucket)
  const s3Client = writableS3.client
  const uploadTransport = forceYc || !s3Client ? 'yc' : 's3'

  if (writableS3.reason === 'env-readonly') {
    console.warn(
      '\n  ⚠ Clés S3 (phase2.env) : lecture OK mais écriture refusée',
    )
    if (writableS3.source === 'ephemeral') {
      console.warn('    → clés S3 éphémères utilisées pour l’upload')
    } else {
      console.warn('    → bascule sur yc CLI')
      console.warn('    Mettez à jour MOXT_YC_S3_* avec un compte storage.editor ou utilisez --transport=yc')
    }
  } else if (writableS3.reason === 'no-s3-credentials' && !forceYc) {
    console.warn('\n  ℹ Pas de clés S3 inscriptibles — upload via yc CLI')
  } else if (writableS3.source === 'ephemeral') {
    console.log(`\n  ℹ Clés S3 éphémères (${writableS3.source})`)
  }

  const uploadConcurrency = concurrencyArg
    ? Number(concurrencyArg.split('=')[1]) || 12
    : uploadTransport === 's3'
      ? 32
      : 12

  log(
    dryRun ? 'Simulation upload' : 'Upload',
    `${mode} → s3://${bucket}/ · transport ${uploadTransport} · concurrence ${uploadConcurrency}`,
  )

  const plan = await syncDist(ycPath(), bucket, distDir, {
    full: fullUpload,
    dryRun,
    concurrency: uploadConcurrency,
    deployStatePath,
    transport: uploadTransport,
    s3Client,
  })
  console.log(`  mode ${plan.mode} — ${plan.total} fichiers — ${plan.skipped} inchangés — ${plan.toUpload.length} à envoyer`)

  if (dryRun) {
    for (const item of plan.toUpload.slice(0, 20)) {
      console.log(`    + ${item.key}`)
    }
    if (plan.toUpload.length > 20) {
      console.log(`    … et ${plan.toUpload.length - 20} autres`)
    }
  } else {
    const { uploaded, failed } = await plan.runUpload()
    console.log(`  ✓ ${uploaded} envoyés${failed ? ` — ✗ ${failed} échecs` : ''}`)
    if (failed > 0) {
      if (uploadTransport === 's3') {
        console.error('\n  ✗ Échec upload S3 — relancez avec : npm run deploy:yandex -- --transport=yc')
      }
      process.exit(1)
    }

    if (plan.currentManifest) {
      writeDeployManifest(deployStatePath, plan.currentManifest)
      console.log(`  ✓ État déploiement enregistré (${deployStatePath})`)
    }
  }

  if (purgeCdn && !dryRun) {
    const resourceId = resolveCdnResourceId()
    if (!resourceId) {
      console.log('\n  (purge CDN ignoré — ressource CDN introuvable)')
    } else {
      log('Purge cache CDN', resourceId)
      const result = purgeCdnCache(resourceId)
      if (!result.ok) {
        if (result.reason === 'rate_limit') {
          console.warn('\n  ⚠ Purge CDN limitée (rate limit) — déploiement OK')
        } else {
          console.warn(`\n  ⚠ Purge CDN échouée : ${result.reason}`)
          console.warn('    Upload terminé ; purge manuelle dans Cloud CDN si besoin.')
        }
      }
    }
  }

  const siteUrl = process.env.MOXT_SITE_URL || 'https://moxtapp.ru'
  console.log('\n══════════════════════════════════════')
  console.log('  Déploiement Yandex terminé')
  console.log('══════════════════════════════════════')
  console.log(`  Bucket : ${bucket}`)
  console.log(`  Test   : https://${bucket}.website.yandexcloud.net`)
  console.log(`  Prod   : ${siteUrl} (après CDN + DNS)`)
  console.log('\n  Si le cache CDN garde l’ancienne version : purge cache dans Cloud CDN')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
