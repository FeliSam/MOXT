#!/usr/bin/env node
/**
 * Mise en ligne complète MOXT — déploiement + CDN + DNS REG.RU + checks.
 *
 *   npm run setup:site-online
 *   npm run setup:site-online -- --skip-build
 *   npm run setup:site-online -- --check-only
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPhase2Env, root, upsertPhase2Env } from './lib/env.mjs'
import { ensureYc, ycJson } from './lib/yandex.mjs'
import { finalizeSpaCdn, purgeCdnCache } from './lib/yandex-cdn.mjs'
import { ensureCdnDns, loadRegruCredentials } from './lib/regru.mjs'
import { syncSiteDns } from './sync-site-dns.mjs'

const domain = (process.env.MOXT_DOMAIN || 'moxtapp.ru').replace(/\.$/, '')
const wwwDomain = `www.${domain}`
const skipBuild = process.argv.includes('--skip-build')
const checkOnly = process.argv.includes('--check-only')
const dnsOnly = process.argv.includes('--dns-only')

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function runNpm(script, extraArgs = []) {
  const result = spawnSync('npm', ['run', script, '--', ...extraArgs], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if ((result.status ?? 1) !== 0) process.exit(result.status || 1)
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — mise en ligne complète')
  console.log('══════════════════════════════════════')

  if (checkOnly) {
    await runChecks()
    return
  }

  if (dnsOnly) {
    await syncSiteDns()
    await runChecks()
    return
  }

  ensureYc()
  const env = loadPhase2Env()
  const regruCreds = loadRegruCredentials(env)

  log('Étape 1/5', skipBuild ? 'Upload bucket (--skip-build)' : 'Build + upload bucket')
  runNpm('web:deploy:yandex', skipBuild ? ['--skip-build'] : [])

  const resourceId = env.MOXT_CDN_RESOURCE_ID
  if (!resourceId) {
    console.error('\n✗ MOXT_CDN_RESOURCE_ID manquant — lancez npm run setup:yandex-cdn:recreate une fois')
    process.exit(1)
  }

  log('Étape 2/5', `Configuration SPA CDN (${resourceId})`)
  finalizeSpaCdn(resourceId, process.env.MOXT_YC_BUCKET || 'moxtapp-web')

  log('Étape 3/5', 'Purge cache CDN')
  const purge = purgeCdnCache(resourceId)
  if (!purge.ok) {
    console.warn(`  ⚠ Purge : ${purge.reason}`)
  }

  if (!regruCreds.username || !regruCreds.password) {
    console.warn('\n  ⚠ REG.RU ignoré — MOXT_REGRU_USERNAME/PASSWORD dans scripts/phase2.env')
  } else {
    log('Étape 4/5', 'DNS REG.RU (API 2)')
    const resource = ycJson('cdn', 'resource', 'get', resourceId)
    const providerCname = resource.provider_cname
    if (!providerCname) throw new Error('CDN sans provider_cname')
    await ensureCdnDns({
      domain,
      wwwDomain,
      providerCname,
      credentials: regruCreds,
    })
    upsertPhase2Env({ MOXT_CDN_RESOURCE_ID: resourceId })
    log('DNS REG.RU', 'synchronisé (www CNAME + apex A)')
  }

  log('Étape 5/5', 'Vérifications finales')
  await runChecks()
}

async function runChecks() {
  const checkScript = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-site.mjs')
  const result = spawnSync(process.execPath, [checkScript], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  })
  if ((result.status ?? 1) !== 0) process.exit(result.status || 1)
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
