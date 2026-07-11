#!/usr/bin/env node
/**
 * Vérifications complètes infrastructure MOXT (Yandex + REG.RU + HTTP).
 *
 *   npm run check:site
 */
import { maskSecret, runAllChecks } from './lib/checks.mjs'
import { loadPhase2Env } from './lib/env.mjs'

function line(ok, label, detail = '') {
  const icon = ok ? '✓' : '✗'
  console.log(`  ${icon}  ${label}${detail ? ` — ${detail}` : ''}`)
}

function section(title) {
  console.log(`\n▸ ${title}`)
}

async function main() {
  const env = loadPhase2Env()
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — vérifications infrastructure')
  console.log('══════════════════════════════════════')

  const report = await runAllChecks()

  section('1. Yandex CLI')
  line(report.yc.ok, 'yc configuré', report.yc.detail)

  section('2. scripts/phase2.env')
  line(report.phase2.ok, 'Variables requises', report.phase2.missing.join(', ') || 'OK')
  line(!!env.MOXT_CDN_RESOURCE_ID, 'MOXT_CDN_RESOURCE_ID', env.MOXT_CDN_RESOURCE_ID || '—')
  line(!!env.MOXT_REGRU_USERNAME, 'MOXT_REGRU_USERNAME', env.MOXT_REGRU_USERNAME || '—')
  line(!!env.MOXT_REGRU_PASSWORD, 'MOXT_REGRU_PASSWORD', maskSecret(env.MOXT_REGRU_PASSWORD))
  line(!!env.MOXT_POSTBOX_FROM, 'MOXT_POSTBOX_FROM', env.MOXT_POSTBOX_FROM || '—')

  section('3. CDN Yandex')
  if (report.cdn.ok) {
    line(true, 'Ressource active', report.cdn.id)
    line(true, 'SSL', report.cdn.ssl)
    line(true, 'CNAME fournisseur', report.cdn.providerCname)
    line(true, 'Host header', `${report.cdn.host}${report.cdn.hostOk ? '' : ' (incorrect)'}`)
    line(report.cdn.originOk !== false, 'Origine CDN', report.cdn.originSource || '—')
    line(report.cdn.rewriteOk !== false, 'Rewrite SPA', report.cdn.rewrite)
    line(true, 'Hostnames', report.cdn.www.join(', '))
  } else {
    line(false, 'CDN', report.cdn.detail || 'inactif ou SSL non READY')
  }

  section('4. REG.RU API + DNS')
  line(report.regru.ok, 'API REG.RU', report.regru.ok ? `${report.regru.recordCount} enregistrements` : report.regru.detail)
  if (report.dns.wwwCname !== undefined) {
    line(report.dns.wwwOk, 'CNAME www', report.dns.wwwCname || 'manquant')
    line(report.dns.apexOk, 'Apex @ (zone REG.RU)', `A=[${(report.dns.apexA || []).join(', ')}]`)
    line(
      report.dns.propagated,
      'Propagation apex (public DNS)',
      report.dns.propagated
        ? `résolu=[${(report.dns.apexResolve || []).join(', ')}]`
        : 'en cours — A déjà dans la zone REG.RU (5–30 min)',
    )
    line(true, 'IP CDN attendues', (report.dns.expectedIps || []).join(', '))
  }

  section('5. HTTP (site en ligne)')
  for (const [name, result] of Object.entries(report.http)) {
    const detail = result.ok
      ? `HTTP ${result.status}${result.title ? ` (${result.title})` : ''}`
      : result.error || `HTTP ${result.status || 'échec'}`
    line(result.ok, name, detail)
  }

  section('6. Frontend local')
  line(report.viteEnv, 'moxt-react/.env.local (dev)', report.viteEnv ? 'présent' : 'optionnel en prod')

  console.log('\n══════════════════════════════════════')
  if (report.ok) {
    console.log('  Résultat : TOUT OK — site en ligne')
    console.log('══════════════════════════════════════')
    console.log(`\n  Production : https://${report.wwwDomain}/`)
    console.log(`  Bucket     : https://${report.bucket}.website.yandexcloud.net/`)
  } else {
    console.log('  Résultat : ACTIONS REQUISES')
    console.log('══════════════════════════════════════')
    console.log('\n  Corriger : npm run setup:site-online')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
