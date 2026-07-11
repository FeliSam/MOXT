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
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { parseEnvFile } from './lib/env.mjs'
import { purgeCdnCache, findCdnResource } from './lib/yandex-cdn.mjs'
import { ycJson } from './lib/yandex.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'moxt-react', 'dist')
const bucket = process.env.MOXT_YC_BUCKET || 'moxtapp-web'
const domain = (process.env.MOXT_DOMAIN || 'moxtapp.ru').replace(/\.$/, '')
const initMode = process.argv.includes('--init')
const spaOnly = process.argv.includes('--spa')
const skipBuild = process.argv.includes('--skip-build')
const purgeCdn = process.argv.includes('--purge-cdn')

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

function walkFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...walkFiles(full))
    } else {
      files.push(full)
    }
  }
  return files
}

/** Upload fichier par fichier — évite les backslashes Windows dans les clés S3. */
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

function uploadCacheControl(key) {
  if (key === 'index.html' || key === 'sw.js' || key === 'offline.html') {
    return 'no-cache, must-revalidate'
  }
  if (/^assets\/[^/]+-[A-Za-z0-9_-]+\.(js|css)$/.test(key)) {
    return 'public, max-age=31536000, immutable'
  }
  return 'public, max-age=3600'
}

function uploadDist(bin, bucketName, sourceDir) {
  const files = walkFiles(sourceDir)
  log('Upload', `${files.length} fichiers → s3://${bucketName}/`)
  for (const file of files) {
    const key = path.relative(sourceDir, file).split(path.sep).join('/')
    const code = run(bin, [
      'storage',
      's3',
      'cp',
      file,
      `s3://${bucketName}/${key}`,
      '--acl',
      'public-read',
      '--cache-control',
      uploadCacheControl(key),
    ])
    if (code !== 0) process.exit(code)
  }
}

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

uploadDist(ycPath(), bucket, distDir)

if (purgeCdn) {
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
