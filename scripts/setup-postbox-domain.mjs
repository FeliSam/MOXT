#!/usr/bin/env node
/**
 * Crée l’adresse Postbox + enregistrements DKIM dans Yandex DNS.
 * Usage : npm run setup:postbox
 */
import {
  dkimDnsInstructions,
  dkimTokensFromAddress,
  enablePostboxDkimSigning,
  ensurePostboxAddress,
  ensurePostboxDkimDns,
  ensurePostboxEditorRole,
  findDnsZone,
  folderId,
  getPostboxAddress,
  refreshPostboxDkimVerification,
  summarizePostboxStatus,
  waitPostboxVerification,
} from './lib/postbox.mjs'

const domain = (process.env.MOXT_DOMAIN || 'moxtapp.ru').replace(/\.$/, '')
const dnsZoneName = process.env.MOXT_DNS_ZONE_NAME || 'moxtapp-zone'

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  Postbox — adresse + DKIM automatiques')
  console.log('══════════════════════════════════════')

  const folder = folderId()
  if (!folder) throw new Error('folder-id Yandex introuvable — npm run setup:yc ou yc init')
  log('Rôle IAM', 'postbox.editor sur moxt-auth')
  ensurePostboxEditorRole(folder)

  log('Adresse Postbox', domain)
  const created = await ensurePostboxAddress(domain)
  const tokens = dkimTokensFromAddress(created)
  if (!tokens.length) {
    const current = await getPostboxAddress(domain)
    tokens.push(...dkimTokensFromAddress(current))
  }
  if (!tokens.length) {
    throw new Error('Aucun token DKIM retourné par Postbox')
  }
  log('Tokens DKIM', tokens.join(', '))

  const zone = findDnsZone(dnsZoneName, domain)
  if (!zone) {
    throw new Error(`Zone DNS "${dnsZoneName}" introuvable — lancez npm run setup:yandex-cdn`)
  }

  const added = ensurePostboxDkimDns(zone, domain, tokens)
  log('DNS DKIM', added ? `${added} enregistrement(s) corrigé(s)` : 'déjà correct (pstbx.ru)')

  console.log('\n  ⚠ NS actifs : REG.RU (ns1.reg.ru) — mettez à jour aussi chez REG.RU :')
  for (const row of dkimDnsInstructions(domain, tokens)) {
    console.log(`    ${row.type}  ${row.name}  →  ${row.value}`)
  }

  let status = summarizePostboxStatus(await getPostboxAddress(domain))
  if (status.dkimStatus !== 'SUCCESS' || !status.verifiedForSending) {
    log('Activation DKIM', 'relance vérification Postbox')
    try {
      await refreshPostboxDkimVerification(domain)
    } catch (error) {
      log('Activation DKIM', `ignorée : ${error instanceof Error ? error.message : error}`)
    }
  }

  log('Vérification Postbox', 'attente ~2 min')
  const result = await waitPostboxVerification(domain)
  status = summarizePostboxStatus(result.address)
  const dkimStatus = status.dkimStatus || 'PENDING'
  const verified = status.verifiedForSending ? 'oui' : 'non'

  console.log('\n══════════════════════════════════════')
  console.log('  Postbox configuré')
  console.log('══════════════════════════════════════')
  console.log(`  Domaine    : ${domain}`)
  console.log(`  DKIM       : ${dkimStatus}`)
  console.log(`  Envoi OK   : ${verified}`)
  if (dkimStatus !== 'SUCCESS') {
    console.log('\n  Cibles DKIM attendues par Postbox : *.dkim.pstbx.ru (pas postbox.yandexcloud.net)')
    console.log('  REG.RU → DNS → modifier les 2 CNAME _domainkey ci-dessus')
    console.log('  Console Yandex → Postbox → moxtapp.ru → « Запустить проверку »')
    console.log('  Puis : npm run setup:postbox')
  } else {
    console.log('\n  Test : inscription e-mail sur /register')
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
