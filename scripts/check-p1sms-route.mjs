#!/usr/bin/env node
/**
 * Diagnostic routage OTP SMSC / P1SMS (sans afficher de numéros ni secrets).
 *   node scripts/check-p1sms-route.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')

function parseEnv(filePath) {
  const vars = {}
  if (!existsSync(filePath)) return vars
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return vars
}

async function main() {
  const vars = parseEnv(envPath)
  const apiKey = vars.P1SMS_API_KEY || ''
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — diagnostic P1SMS / routage OTP')
  console.log('══════════════════════════════════════\n')
  console.log(`  P1SMS_API_KEY local : ${apiKey ? `oui (${apiKey.length} car.)` : 'NON'}`)
  console.log(`  P1SMS_CHANNEL       : ${vars.P1SMS_CHANNEL || 'digit'}`)

  if (apiKey) {
    const balRes = await fetch(
      `https://admin.p1sms.ru/apiUsers/getUserBalanceInfo?apiKey=${encodeURIComponent(apiKey)}`,
    )
    const balText = await balRes.text()
    let bal = null
    try {
      bal = JSON.parse(balText)
    } catch {
      bal = null
    }
    console.log(
      `  Solde P1SMS         : ${bal?.status === 'success' ? `${bal.data} ₽` : `erreur (${balRes.status})`}`,
    )
  }

  const password = vars.SUPABASE_DB_PASSWORD || vars.MOXT_SUPABASE_DB_PASSWORD || ''
  if (!password) {
    console.log('\n  ✗ SUPABASE_DB_PASSWORD manquant — impossible de lire otp_sms_route')
    process.exit(1)
  }

  const client = new pg.Client({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.rbvqfkccbkwjxkvpnwqn',
    password,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  const stats = await client.query(`
    select
      count(*)::int as rows,
      coalesce(max(send_count), 0)::int as max_attempts,
      count(*) filter (where last_provider = 'p1sms')::int as p1sms_sends,
      count(*) filter (where last_provider = 'smsc')::int as smsc_sends,
      count(*) filter (where updated_at > now() - interval '2 hours')::int as recent_2h
    from public.otp_sms_route
  `)
  console.log('\n  Table otp_sms_route :')
  console.log(`    lignes            : ${stats.rows[0].rows}`)
  console.log(`    max tentatives    : ${stats.rows[0].max_attempts}`)
  console.log(`    envois SMSC       : ${stats.rows[0].smsc_sends}`)
  console.log(`    envois P1SMS      : ${stats.rows[0].p1sms_sends}`)
  console.log(`    activité < 2 h    : ${stats.rows[0].recent_2h}`)

  const recent = await client.query(`
    select send_count, last_provider,
           extract(epoch from (now() - updated_at))::int as age_sec
    from public.otp_sms_route
    order by updated_at desc
    limit 8
  `)
  if (recent.rows.length) {
    console.log('\n  Dernières tentatives (sans numéro) :')
    for (const row of recent.rows) {
      console.log(
        `    count=${row.send_count} provider=${row.last_provider || '(vide)'} age=${row.age_sec}s`,
      )
    }
  } else {
    console.log('\n  Aucune ligne otp_sms_route — le hook n’a jamais claimé de tentative')
    console.log('  (soit pas d’inscription récente, soit claim RPC en échec → toujours SMSC)')
  }

  // Verify RPC works as service would
  const rpc = await client.query(`select public.claim_otp_sms_attempt($1) as n`, [
    '+70000000000',
  ])
  console.log(`\n  RPC claim test      : tentative #${rpc.rows[0].n}`)
  await client.query(`delete from public.otp_sms_route where phone = $1`, ['+70000000000'])

  await client.end()

  console.log('\n  Rappel flux :')
  console.log('    1er SMS (inscription) → SMSC')
  console.log('    Renvoi après 90 s     → P1SMS')
  console.log('══════════════════════════════════════\n')
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
