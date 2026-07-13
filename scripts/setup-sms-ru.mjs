#!/usr/bin/env node
/**
 * Déploie SMS.ru pour les OTP Supabase (edge function send-sms).
 *
 * 1. Ajoutez dans scripts/phase2.env :
 *      SMS_RU_API_ID=votre_cle_api
 *      SMS_PROVIDER=smsru
 * 2. Lancez : npm run setup:sms-ru
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { assertSmsInfraChangeAllowed, warnSmsInfraLocked } from './lib/smsInfraLock.mjs'

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
    MOXT_POSTBOX_SMTP_USER: vars.MOXT_POSTBOX_SMTP_USER || process.env.MOXT_POSTBOX_SMTP_USER,
    MOXT_POSTBOX_SMTP_PASS: vars.MOXT_POSTBOX_SMTP_PASS || process.env.MOXT_POSTBOX_SMTP_PASS,
    MOXT_POSTBOX_FROM: vars.MOXT_POSTBOX_FROM || process.env.MOXT_POSTBOX_FROM,
  }
}

function runSupabase(args, env) {
  const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')
  if (existsSync(supabaseJs)) {
    return (
      spawnSync(process.execPath, [supabaseJs, ...args], {
        cwd: root,
        stdio: 'inherit',
        env,
      }).status ?? 1
    )
  }
  return (
    spawnSync('npx', ['supabase', ...args], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      encoding: 'utf8',
      env,
    }).status ?? 1
  )
}

function ensureHookSecret(vars) {
  if (vars.SEND_SMS_HOOK_SECRET && !vars.SEND_SMS_HOOK_SECRET.includes('REMPLACER')) {
    return vars.SEND_SMS_HOOK_SECRET
  }
  const secret = `v1,whsec_${randomBytes(24).toString('base64')}`
  upsertEnvVar('SEND_SMS_HOOK_SECRET', secret)
  log('Secret hook généré', 'enregistré dans scripts/phase2.env')
  return secret
}

async function main() {
  assertSmsInfraChangeAllowed('setup:sms-ru')

  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — SMS.ru (OTP téléphone)')
  console.log('══════════════════════════════════════')

  if (process.env.SMS_RU_API_ID) {
    upsertEnvVar('SMS_RU_API_ID', process.env.SMS_RU_API_ID)
    log('Clé API', 'enregistrée dans scripts/phase2.env')
  }

  const vars = parseEnvFile(envPath)
  const apiId = (process.env.SMS_RU_API_ID || vars.SMS_RU_API_ID || '').trim()
  if (!apiId || apiId.includes('REMPLACER')) {
    console.error('\n✗ SMS_RU_API_ID manquant ou vide.')
    console.error('  Éditez scripts/phase2.env : SMS_RU_API_ID=votre_cle_api')
    process.exit(1)
  }

  upsertEnvVar('SMS_PROVIDER', 'smsru')
  vars.SMS_PROVIDER = 'smsru'
  vars.SEND_SMS_HOOK_SECRET = ensureHookSecret(vars)

  const supabaseEnv = buildSupabaseEnv(vars)
  if (!supabaseEnv.SUPABASE_ACCESS_TOKEN) {
    console.error('\n✗ SUPABASE_ACCESS_TOKEN manquant dans scripts/phase2.env')
    process.exit(1)
  }

  log('Provider', 'smsru')
  log('Supabase', `projet ${projectRef}`)
  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], supabaseEnv) !== 0) {
    process.exit(1)
  }

  const secretsPath = path.join(root, 'scripts', 'phase2.supabase-secrets.env')
  const secretLines = [
    'SMS_PROVIDER=smsru',
    `SMS_RU_API_ID=${apiId}`,
    `SMS_MESSAGE_TEMPLATE=${vars.SMS_MESSAGE_TEMPLATE || vars.YC_SNS_MESSAGE_TEMPLATE || 'Код MOXT: {otp}. Никому не сообщайте.'}`,
    `SEND_SMS_HOOK_SECRET=${vars.SEND_SMS_HOOK_SECRET || ''}`,
  ]

  if (vars.SMS_RU_FROM) secretLines.push(`SMS_RU_FROM=${vars.SMS_RU_FROM}`)
  if (vars.SMSC_LOGIN) secretLines.push(`SMSC_LOGIN=${vars.SMSC_LOGIN}`)
  if (vars.SMSC_PASSWORD) secretLines.push(`SMSC_PASSWORD=${vars.SMSC_PASSWORD}`)
  if (vars.SMSC_API_KEY) secretLines.push(`SMSC_API_KEY=${vars.SMSC_API_KEY}`)
  if (vars.SMSC_SENDER) secretLines.push(`SMSC_SENDER=${vars.SMSC_SENDER}`)
  if (vars.SMSC_WEBHOOK_SECRET) secretLines.push(`SMSC_WEBHOOK_SECRET=${vars.SMSC_WEBHOOK_SECRET}`)
  if (vars.YC_SNS_ACCESS_KEY_ID) secretLines.push(`YC_SNS_ACCESS_KEY_ID=${vars.YC_SNS_ACCESS_KEY_ID}`)
  if (vars.YC_SNS_SECRET_ACCESS_KEY) {
    secretLines.push(`YC_SNS_SECRET_ACCESS_KEY=${vars.YC_SNS_SECRET_ACCESS_KEY}`)
  }
  if (vars.YC_SNS_SENDER_ID) secretLines.push(`YC_SNS_SENDER_ID=${vars.YC_SNS_SENDER_ID}`)

  writeFileSync(secretsPath, `${secretLines.join('\n')}\n`, 'utf8')
  log('Secrets Edge Function', 'send-sms (SMS.ru principal + repli SMSC)')
  if (runSupabase(['secrets', 'set', '--env-file', secretsPath], supabaseEnv) !== 0) {
    process.exit(1)
  }

  log('Déploiement', 'send-sms')
  if (runSupabase(['functions', 'deploy', 'send-sms', '--no-verify-jwt'], supabaseEnv) !== 0) {
    process.exit(1)
  }

  const hasPostbox = Boolean(
    vars.MOXT_POSTBOX_SMTP_USER &&
      vars.MOXT_POSTBOX_SMTP_PASS &&
      vars.MOXT_POSTBOX_FROM &&
      !vars.MOXT_POSTBOX_SMTP_USER.includes('REMPLACER'),
  )

  if (hasPostbox) {
    log('Config Auth', 'hook send_sms (SMS.ru)')
    if (
      runSupabase(['config', 'push', '--yes'], {
        ...supabaseEnv,
        SEND_SMS_HOOK_SECRET: vars.SEND_SMS_HOOK_SECRET,
      }) !== 0
    ) {
      console.log('\n  ⚠ config push échoué — relancez : npm run setup:supabase')
    }
  }

  console.log('\n══════════════════════════════════════')
  console.log('  SMS.ru configuré')
  console.log('══════════════════════════════════════')
  console.log('\n  Test : inscription ou connexion avec un numéro +7')
  console.log('  Vérifiez le solde sur https://sms.ru')
  console.log('\n  Si erreur 221 : créez l’expéditeur MOXT sur https://sms.ru/?panel=senders')
  console.log('  puis SMS_RU_FROM=MOXT dans phase2.env et relancez npm run setup:sms-ru')
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
