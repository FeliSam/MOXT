#!/usr/bin/env node
/**
 * Synchronise DNS REG.RU → Yandex CDN (www CNAME + apex).
 * À lancer en local (IP autorisée dans REG.RU).
 *
 *   npm run setup:site-dns
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPhase2Env, upsertPhase2Env } from './lib/env.mjs'
import { ensureYc, ycJson } from './lib/yandex.mjs'
import { findCdnResource } from './lib/yandex-cdn.mjs'
import { ensureCdnDns, loadRegruCredentials } from './lib/regru.mjs'
import { purgeCdnCache } from './lib/yandex-cdn.mjs'

const domain = (process.env.MOXT_DOMAIN || 'moxtapp.ru').replace(/\.$/, '')
const wwwDomain = `www.${domain}`

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function resolveCdnResourceId(env) {
  if (env.MOXT_CDN_RESOURCE_ID) return env.MOXT_CDN_RESOURCE_ID
  if (process.env.MOXT_CDN_RESOURCE_ID) return process.env.MOXT_CDN_RESOURCE_ID
  const found = findCdnResource(domain, wwwDomain)
  return found?.id || null
}

export async function syncSiteDns({ env = loadPhase2Env(), purge = true } = {}) {
  ensureYc()
  const credentials = loadRegruCredentials(env)
  if (!credentials.username || !credentials.password) {
    throw new Error(
      'MOXT_REGRU_USERNAME / MOXT_REGRU_PASSWORD requis dans scripts/phase2.env\n' +
        '  REG.RU → https://www.reg.ru/user/account/#/settings/api/\n' +
        '  Ajoutez l’IP publique de cette machine aux IP autorisées.',
    )
  }

  const resourceId = resolveCdnResourceId(env)
  if (!resourceId) {
    throw new Error('MOXT_CDN_RESOURCE_ID introuvable — lancez npm run setup:yandex-cdn:recreate')
  }

  const resource = ycJson('cdn', 'resource', 'get', resourceId)
  const providerCname = resource.provider_cname
  if (!providerCname) throw new Error('CDN sans provider_cname')

  log('DNS REG.RU', `${domain} + ${wwwDomain}`)
  await ensureCdnDns({
    domain,
    wwwDomain,
    providerCname,
    credentials,
  })

  upsertPhase2Env({ MOXT_CDN_RESOURCE_ID: resourceId })

  if (purge) {
    log('Purge cache CDN', resourceId)
    const result = purgeCdnCache(resourceId)
    if (!result.ok) {
      console.warn(`  ⚠ Purge CDN : ${result.reason}`)
    }
  }

  return { resourceId, providerCname }
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — synchronisation DNS REG.RU')
  console.log('══════════════════════════════════════')

  await syncSiteDns()

  const checkScript = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-site.mjs')
  const { spawnSync } = await import('node:child_process')
  const { root } = await import('./lib/env.mjs')
  const result = spawnSync(process.execPath, [checkScript], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  })
  if ((result.status ?? 1) !== 0) process.exit(result.status || 1)

  console.log('\n✓ DNS synchronisé — moxtapp.ru et www.moxtapp.ru pointent vers le CDN')
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
