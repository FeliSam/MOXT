#!/usr/bin/env node
/**
 * Ajoute P1SMS en parallèle de SMSC pour les OTP Supabase (edge function send-sms).
 *
 * - Ne change PAS le provider primaire (SMSC reste SMS_PROVIDER=smsc + lock).
 * - Pousse P1SMS_API_KEY (+ options) et redéploie send-sms.
 * - En runtime (sans conflit / un seul envoi par tentative) :
 *     1er SMS (inscription) → SMSC
 *     2e+ SMS (renvoi après cooldown 90s) → P1SMS
 *
 * 1. Ajoutez dans scripts/phase2.env :
 *      P1SMS_API_KEY=votre_cle_api
 *      # optionnel :
 *      # P1SMS_CHANNEL=digit
 *      # P1SMS_SENDER=MOXT
 * 2. Lancez : npm run setup:p1sms
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { warnSmsInfraLocked } from './lib/smsInfraLock.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const projectRef = 'rbvqfkccbkwjxkvpnwqn'

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function parseEnvFile(filePath) {
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

function upsertEnvVar(key, value) {
  if (!value) return
  const lines = existsSync(envPath) ? readFileSync(envPath, 'utf8').split(/\r?\n/) : []
  let replaced = false
  const next = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      replaced = true
      return `${key}=${value}`
    }
    return line
  })
  if (!replaced) next.push(`${key}=${value}`)
  writeFileSync(envPath, `${next.join('\n').trimEnd()}\n`, 'utf8')
}

function buildSupabaseEnv(vars) {
  return {
    ...process.env,
    SUPABASE_ACCESS_TOKEN:
      process.env.SUPABASE_ACCESS_TOKEN || vars.SUPABASE_ACCESS_TOKEN || '',
    SEND_SMS_HOOK_SECRET: vars.SEND_SMS_HOOK_SECRET || process.env.SEND_SMS_HOOK_SECRET || '',
  }
}

function runSupabase(args, env) {
  const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')
  const result = existsSync(supabaseJs)
    ? spawnSync(process.execPath, [supabaseJs, ...args], {
        cwd: root,
        encoding: 'utf8',
        env,
      })
    : spawnSync('npx', ['supabase', ...args], {
        cwd: root,
        encoding: 'utf8',
        shell: process.platform === 'win32',
        env,
      })

  const stdout = result.stdout || ''
  const stderr = result.stderr || ''
  if (stdout) process.stdout.write(stdout)
  if (stderr) process.stderr.write(stderr)

  const combined = `${stdout}\n${stderr}`
  if (
    result.status !== 0 &&
    /Timeout while shutting down PostHog/i.test(combined) &&
    /Finished supabase secrets set|Deployed Functions|project_ref/i.test(combined)
  ) {
    return 0
  }
  return result.status ?? 1
}

async function main() {
  // Additive parallel fallback — does not replace locked SMSC primary.
  warnSmsInfraLocked('setup:p1sms')

  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — P1SMS (renvoi OTP après SMSC)')
  console.log('══════════════════════════════════════')

  for (const key of ['P1SMS_API_KEY', 'P1SMS_CHANNEL', 'P1SMS_SENDER', 'P1SMS_WEBHOOK_URL']) {
    if (process.env[key]) upsertEnvVar(key, process.env[key])
  }

  const vars = parseEnvFile(envPath)
  const apiKey = (process.env.P1SMS_API_KEY || vars.P1SMS_API_KEY || '').trim()
  if (!apiKey || apiKey.includes('REMPLACER')) {
    console.error('\n✗ P1SMS_API_KEY manquant ou vide.')
    console.error('  1. Compte : https://admin.p1sms.ru')
    console.error('  2. Clé API : section « Эмулятор запросов » / « Инструкция по API »')
    console.error('  3. Éditez scripts/phase2.env :')
    console.error('       P1SMS_API_KEY=votre_cle_api')
    console.error('       # optionnel : P1SMS_CHANNEL=digit')
    console.error('       # optionnel : P1SMS_SENDER=MOXT  (requis si channel=char)')
    process.exit(1)
  }

  const channel = (process.env.P1SMS_CHANNEL || vars.P1SMS_CHANNEL || 'digit').trim() || 'digit'
  const sender = (process.env.P1SMS_SENDER || vars.P1SMS_SENDER || '').trim()
  if ((channel === 'char' || channel === 'viber') && !sender) {
    console.error('\n✗ P1SMS_SENDER requis pour le canal', channel)
    console.error('  Ajoutez P1SMS_SENDER=votre_sender dans scripts/phase2.env')
    process.exit(1)
  }

  // Never flip primary away from SMSC when locked / already on smsc.
  const keepSmscPrimary =
    (vars.SMS_PROVIDER || 'smsc').toLowerCase() === 'smsc' ||
    (vars.SMS_INFRA_LOCKED || '').toLowerCase() === 'true' ||
    Boolean(vars.SMSC_LOGIN)

  if (keepSmscPrimary) {
    upsertEnvVar('SMS_PROVIDER', 'smsc')
    vars.SMS_PROVIDER = 'smsc'
  }

  const supabaseEnv = buildSupabaseEnv(vars)
  if (!supabaseEnv.SUPABASE_ACCESS_TOKEN) {
    console.error('\n✗ SUPABASE_ACCESS_TOKEN manquant dans scripts/phase2.env')
    process.exit(1)
  }

  log('Provider 1er SMS', vars.SMS_PROVIDER || 'smsc')
  log('Provider renvoi', 'p1sms')
  log('Canal P1SMS', sender ? `${channel} (sender=${sender})` : channel)
  log('Supabase', `projet ${projectRef}`)

  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], supabaseEnv) !== 0) {
    process.exit(1)
  }

  log('Migration', 'otp_sms_route (SMSC 1er / P1SMS renvoi)')
  if (process.env.MOXT_SKIP_DB_PUSH !== '1') {
    const dbPush = spawnSync('npm', ['run', 'db:push'], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...supabaseEnv,
        SUPABASE_DB_PASSWORD:
          process.env.SUPABASE_DB_PASSWORD ||
          vars.SUPABASE_DB_PASSWORD ||
          vars.MOXT_SUPABASE_DB_PASSWORD ||
          '',
      },
    }).status ?? 1
    if (dbPush !== 0) {
      console.log('\n  ⚠ db:push échoué — vérifiez SUPABASE_DB_PASSWORD dans phase2.env')
      console.log('  Relancez : npm run db:push puis npm run setup:p1sms')
    }
  } else {
    log('Migration', 'ignorée (MOXT_SKIP_DB_PUSH=1)')
  }

  const secretsPath = path.join(root, 'scripts', 'phase2.supabase-secrets.env')
  const secretLines = [
    `SMS_PROVIDER=${vars.SMS_PROVIDER || 'smsc'}`,
    `P1SMS_API_KEY=${apiKey}`,
    `P1SMS_CHANNEL=${channel}`,
    `SMS_MESSAGE_TEMPLATE=${vars.SMS_MESSAGE_TEMPLATE || vars.YC_SNS_MESSAGE_TEMPLATE || 'Код MOXT: {otp}. Никому не сообщайте.'}`,
  ]

  if (sender) secretLines.push(`P1SMS_SENDER=${sender}`)
  if (vars.P1SMS_WEBHOOK_URL) secretLines.push(`P1SMS_WEBHOOK_URL=${vars.P1SMS_WEBHOOK_URL}`)
  if (vars.SEND_SMS_HOOK_SECRET) secretLines.push(`SEND_SMS_HOOK_SECRET=${vars.SEND_SMS_HOOK_SECRET}`)
  if (vars.SMSC_LOGIN) secretLines.push(`SMSC_LOGIN=${vars.SMSC_LOGIN}`)
  if (vars.SMSC_PASSWORD) secretLines.push(`SMSC_PASSWORD=${vars.SMSC_PASSWORD}`)
  if (vars.SMSC_API_KEY) secretLines.push(`SMSC_API_KEY=${vars.SMSC_API_KEY}`)
  if (vars.SMSC_SENDER) secretLines.push(`SMSC_SENDER=${vars.SMSC_SENDER}`)
  if (vars.SMSC_WEBHOOK_SECRET) secretLines.push(`SMSC_WEBHOOK_SECRET=${vars.SMSC_WEBHOOK_SECRET}`)
  secretLines.push('SMS_INFRA_LOCKED=true')
  if (vars.SMS_RU_API_ID) secretLines.push(`SMS_RU_API_ID=${vars.SMS_RU_API_ID}`)
  if (vars.SMS_RU_FROM) secretLines.push(`SMS_RU_FROM=${vars.SMS_RU_FROM}`)
  if (vars.YC_SNS_ACCESS_KEY_ID) secretLines.push(`YC_SNS_ACCESS_KEY_ID=${vars.YC_SNS_ACCESS_KEY_ID}`)
  if (vars.YC_SNS_SECRET_ACCESS_KEY) {
    secretLines.push(`YC_SNS_SECRET_ACCESS_KEY=${vars.YC_SNS_SECRET_ACCESS_KEY}`)
  }
  if (vars.YC_SNS_SENDER_ID) secretLines.push(`YC_SNS_SENDER_ID=${vars.YC_SNS_SENDER_ID}`)

  writeFileSync(secretsPath, `${secretLines.join('\n')}\n`, 'utf8')
  log('Secrets Edge Function', 'send-sms (SMSC primary + P1SMS failover)')
  if (runSupabase(['secrets', 'set', '--env-file', secretsPath], supabaseEnv) !== 0) {
    process.exit(1)
  }

  log('Déploiement', 'send-sms')
  if (runSupabase(['functions', 'deploy', 'send-sms', '--no-verify-jwt'], supabaseEnv) !== 0) {
    process.exit(1)
  }

  console.log('\n══════════════════════════════════════')
  console.log('  P1SMS configuré en parallèle')
  console.log('══════════════════════════════════════')
  console.log('\n  Flux : 1er SMS → SMSC · renvoi (90s) → P1SMS')
  console.log('  Un seul provider par tentative (pas de double envoi).')
  console.log('  SMSC n’a pas été coupé ni remplacé.')
  console.log('\n  Test : inscription avec un numéro +7, puis « Renvoyer » après 90s')
  console.log('  Cabinet : https://admin.p1sms.ru')
  console.log('  Doc API : https://p1sms.ru/api-dokumentaciya-p1sms')
  if (!vars.SMSC_LOGIN) {
    console.log('\n  ⚠ SMSC_LOGIN absent — P1SMS pourra devenir primary si SMS_INFRA_LOCKED n’est pas actif.')
    console.log('  Relancez npm run setup:smsc pour garder SMSC en primary.')
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
