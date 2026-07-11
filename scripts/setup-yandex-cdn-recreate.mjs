#!/usr/bin/env node
/**
 * Recrée proprement le CDN Yandex + synchronise DNS REG.RU (API 2).
 *
 * Prérequis :
 *   yc init
 *   npm run web:deploy:yandex:init
 *   MOXT_REGRU_USERNAME + MOXT_REGRU_PASSWORD dans scripts/phase2.env
 *     (IP autorisée : https://www.reg.ru/user/account/#/settings/api/)
 *
 * Usage :
 *   npm run setup:yandex-cdn:recreate
 *   npm run setup:yandex-cdn:recreate -- --skip-deploy
 *   npm run setup:yandex-cdn:recreate -- --skip-regru
 *   npm run setup:yandex-cdn:recreate -- --fix-only
 *   npm run setup:yandex-cdn:recreate -- --dns-only
 */
import { spawnSync } from 'node:child_process'
import { loadPhase2Env, root, upsertPhase2Env } from './lib/env.mjs'
import { ensureYc, ycJson } from './lib/yandex.mjs'
import {
  attachCertificate,
  createCleanCdnResource,
  deleteCdnResource,
  finalizeSpaCdn,
  findCdnResource,
  findCertificate,
  listCdnResources,
  purgeCdnCache,
  waitForHttpOk,
} from './lib/yandex-cdn.mjs'
import { ensureCdnDns, loadRegruCredentials } from './lib/regru.mjs'

const domain = (process.env.MOXT_DOMAIN || 'moxtapp.ru').replace(/\.$/, '')
const wwwDomain = `www.${domain}`
const bucket = process.env.MOXT_YC_BUCKET || 'moxtapp-web'
const skipDeploy = process.argv.includes('--skip-deploy')
const skipRegru = process.argv.includes('--skip-regru') || process.env.MOXT_SKIP_REGRU === '1'
const fixOnly = process.argv.includes('--fix-only')
const dnsOnly = process.argv.includes('--dns-only')

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function runDeploy() {
  log('Déploiement bucket', 'npm run web:deploy:yandex -- --skip-build')
  const result = spawnSync('npm', ['run', 'web:deploy:yandex', '--', '--skip-build'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if ((result.status ?? 1) !== 0) process.exit(result.status || 1)
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  Recréation CDN + DNS REG.RU')
  console.log('══════════════════════════════════════')

  ensureYc()
  const env = loadPhase2Env()
  const regruCreds = loadRegruCredentials(env)

  if (dnsOnly) {
    const resourceId = env.MOXT_CDN_RESOURCE_ID
    if (!resourceId) throw new Error('MOXT_CDN_RESOURCE_ID manquant')
    const resource = ycJson('cdn', 'resource', 'get', resourceId)
    const providerCname = resource?.provider_cname
    if (!providerCname) throw new Error('CDN sans provider_cname')
    if (!regruCreds.username || !regruCreds.password) {
      throw new Error('MOXT_REGRU_USERNAME / MOXT_REGRU_PASSWORD manquants dans scripts/phase2.env')
    }
    log('DNS REG.RU (API 2)', `CNAME → ${providerCname}`)
    await ensureCdnDns({
      domain,
      wwwDomain,
      providerCname,
      credentials: regruCreds,
    })
    log('DNS REG.RU', 'synchronisé')
    return
  }

  if (fixOnly) {
    const resourceId = env.MOXT_CDN_RESOURCE_ID
    if (!resourceId) throw new Error('MOXT_CDN_RESOURCE_ID manquant — lancez sans --fix-only')
    log('Correction SPA CDN', resourceId)
    finalizeSpaCdn(resourceId, bucket)
    const purge = purgeCdnCache(resourceId)
    if (purge.ok) log('Purge cache CDN', 'OK')
    const checks = [
      `https://${domain}/`,
      `https://${wwwDomain}/`,
      `https://${domain}/login`,
      `https://${wwwDomain}/login`,
      `https://${domain}/index.html`,
      `https://${wwwDomain}/index.html`,
    ]
    for (const url of checks) {
      const result = await waitForHttpOk(url, { attempts: 6, delayMs: 10000, allowRedirect: true })
      console.log(`  ${result.ok ? `✓ ${result.status}` : '✗ échec'}  ${url}`)
    }
    return
  }

  if (!skipDeploy) {
    log('Build + upload', 'npm run web:deploy:yandex')
    const result = spawnSync('npm', ['run', 'web:deploy:yandex'], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    if ((result.status ?? 1) !== 0) process.exit(result.status || 1)
  } else {
    runDeploy()
  }

  const existing = findCdnResource(domain, wwwDomain)
  if (existing?.id) {
    log('Suppression CDN cassé', existing.id)
    deleteCdnResource(existing.id)
    await new Promise((r) => setTimeout(r, 5000))
  }

  const orphans = listCdnResources().filter(
    (r) =>
      r.cname === domain ||
      r.cname === wwwDomain ||
      r.secondary_hostnames?.includes(wwwDomain),
  )
  for (const resource of orphans) {
    if (resource.id === existing?.id) continue
    log('Suppression CDN doublon', `${resource.id} (${resource.cname})`)
    deleteCdnResource(resource.id)
  }

  const cert = findCertificate(domain, wwwDomain)
  if (cert) {
    log('Certificat SSL', `${cert.name} — ${cert.status}`)
  } else {
    console.warn('\n  ⚠ Certificat Let\'s Encrypt introuvable — CDN créé sans HTTPS custom')
  }

  log('Création CDN propre', `${bucket} → ${domain}`)
  const created = createCleanCdnResource({
    domain,
    wwwDomain,
    bucket,
    certId: cert?.status === 'ISSUED' ? cert.id : null,
  })

  const resourceId = created.id
  const providerCname = created.provider_cname
  if (!resourceId || !providerCname) {
    throw new Error('CDN créé sans id ou provider_cname — vérifiez la console Yandex')
  }

  log('CDN créé', `${resourceId} → ${providerCname}`)

  if (cert?.status === 'ISSUED' && cert.id) {
    attachCertificate(resourceId, cert.id)
  }

  finalizeSpaCdn(resourceId, bucket)

  upsertPhase2Env({ MOXT_CDN_RESOURCE_ID: resourceId })

  if (!skipRegru) {
    if (!regruCreds.username || !regruCreds.password) {
      console.warn('\n  ⚠ REG.RU ignoré — ajoutez dans scripts/phase2.env :')
      console.warn('    MOXT_REGRU_USERNAME=votre_login')
      console.warn('    MOXT_REGRU_PASSWORD=votre_mot_de_passe_api')
      console.warn('    Puis relancez : npm run setup:yandex-cdn:recreate -- --skip-deploy')
    } else {
      log('DNS REG.RU (API 2)', `CNAME → ${providerCname}`)
      try {
        await ensureCdnDns({
          domain,
          wwwDomain,
          providerCname,
          credentials: regruCreds,
        })
        log('DNS REG.RU', 'synchronisé')
      } catch (err) {
        console.warn(`\n  ⚠ REG.RU : ${err.message}`)
        console.warn('    Mettez à jour manuellement :')
        console.warn(`    www.${domain}  CNAME  ${providerCname}`)
        console.warn(`    @  CNAME  ${providerCname}  (ou redirection vers https://${wwwDomain}/)`)
      }
    }
  }

  const purge = purgeCdnCache(resourceId)
  if (!purge.ok) {
    console.warn(`\n  ⚠ Purge CDN : ${purge.reason === 'rate_limit' ? 'attendez 1 min' : purge.reason}`)
  } else {
    log('Purge cache CDN', 'OK')
  }

  log('Vérification HTTP', 'propagation CDN (jusqu\'à 2 min)')
  const checks = [
    `https://${domain}/index.html`,
    `https://${wwwDomain}/index.html`,
    `https://${bucket}.website.yandexcloud.net/`,
  ]

  for (const url of checks) {
    const result = await waitForHttpOk(url, { attempts: 8, delayMs: 15000, allowRedirect: true })
    const status = result.ok ? `✓ ${result.status}` : '✗ échec'
    console.log(`  ${status}  ${url}`)
  }

  console.log('\n══════════════════════════════════════')
  console.log('  Recréation terminée')
  console.log('══════════════════════════════════════')
  console.log(`  Domaine     : https://${domain}`)
  console.log(`  CDN ID      : ${resourceId}`)
  console.log(`  CNAME CDN   : ${providerCname}`)
  console.log(`  Bucket test : https://${bucket}.website.yandexcloud.net/`)
  console.log('\n  MOXT_CDN_RESOURCE_ID enregistré dans scripts/phase2.env')
  console.log('  Si https://moxtapp.ru/ renvoie 403 : REG.RU redirige @ → https://www.moxtapp.ru/')
  console.log('    (automatique avec MOXT_REGRU_USERNAME/PASSWORD + npm run setup:yandex-cdn:recreate -- --skip-deploy)')
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
