#!/usr/bin/env node
/**
 * Vérifie SMSC.ru (solde, identifiants, secrets hook).
 *   npm run check:smsc
 */
import { loadPhase2Env } from './lib/env.mjs'

function line(ok, label, detail = '') {
  console.log(`  ${ok ? '✓' : '✗'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

async function fetchSmscBalance(env) {
  const login = env.SMSC_LOGIN
  const password = env.SMSC_PASSWORD
  const apikey = env.SMSC_API_KEY
  if (!login || (!password && !apikey)) {
    return { ok: false, detail: 'SMSC_LOGIN + SMSC_PASSWORD (ou SMSC_API_KEY) manquants' }
  }
  const body = new URLSearchParams({ login, fmt: '3' })
  if (apikey) body.set('apikey', apikey)
  else body.set('psw', password)
  const res = await fetch('https://smsc.ru/sys/balance.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, detail: `Réponse invalide (${res.status})` }
  }
  if (data.error) return { ok: false, detail: String(data.error) }
  const balance = Number(data.balance)
  if (Number.isNaN(balance)) return { ok: false, detail: 'Solde illisible' }
  return { ok: balance > 1, detail: `${balance.toFixed(2)} ₽` }
}

async function main() {
  const env = loadPhase2Env()
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — diagnostic SMSC / OTP')
  console.log('══════════════════════════════════════\n')

  line(Boolean(env.SMS_PROVIDER), 'SMS_PROVIDER', env.SMS_PROVIDER || 'non défini')
  line(Boolean(env.SMSC_LOGIN), 'SMSC_LOGIN', env.SMSC_LOGIN ? 'défini' : 'manquant')
  line(Boolean(env.SMSC_PASSWORD || env.SMSC_API_KEY), 'SMSC_PASSWORD / API_KEY', 'défini')
  line(Boolean(env.SMSC_SENDER), 'SMSC_SENDER', env.SMSC_SENDER || 'manquant')
  line(Boolean(env.SEND_SMS_HOOK_SECRET), 'SEND_SMS_HOOK_SECRET (local)', env.SEND_SMS_HOOK_SECRET ? 'défini' : 'manquant')

  const balance = await fetchSmscBalance(env)
  line(balance.ok, 'Solde SMSC', balance.detail)

  console.log('\n▸ Causes fréquentes si le SMS échoue (solde OK, hors mode test)')
  console.log('  A. Secret hook Supabase désynchronisé (Auth ≠ Edge Function)')
  console.log('     → npm run setup:smsc  (resynchronise SEND_SMS_HOOK_SECRET)')
  console.log('  B. Expéditeur MOXT non validé chez SMSC')
  console.log('     → smsc.ru → SMS → Имена отправителей, ou retirez SMSC_SENDER')
  console.log('  C. Numéro déjà lié à un autre compte MOXT')
  console.log('  D. Logs Supabase : Edge Functions → send-sms → Logs (erreur exacte)')
  console.log('\n▸ Si l’envoi SMS échoue malgré un solde OK')
  console.log('  1. smsc.ru → Paramètres → désactiver le « mode test »')
  console.log('     (ou ajouter le numéro +7 dans les numéros autorisés)')
  console.log('  2. Vérifier que l’expéditeur MOXT est validé chez SMSC')
  console.log('  3. Resynchroniser Supabase : npm run setup:smsc')
  console.log('  4. Vérifier les logs : Supabase → Edge Functions → send-sms → Logs')
  console.log('')
}

main().catch((error) => {
  console.error(`Erreur : ${error.message}`)
  process.exit(1)
})
