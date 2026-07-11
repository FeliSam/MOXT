#!/usr/bin/env node
/**
 * Déploie SMS.ru pour les OTP Supabase (edge function send-sms).
 *
 * 1. Ajoutez dans scripts/phase2.env :
 *      SMS_RU_API_ID=votre_cle_api
 *      SMS_PROVIDER=smsru
 * 2. Lancez : npm run setup:sms-ru
 *
 * Ou en une ligne :
 *   $env:SMS_RU_API_ID="..."; npm run setup:sms-ru
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

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

function run(cmd, args, { env = process.env } = {}) {
  return spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env,
  }).status ?? 1
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
    console.error('  Éditez scripts/phase2.env (pas .example) :')
    console.error('    SMS_RU_API_ID=votre_cle_api')
    console.error('    SMS_PROVIDER=smsru')
    console.error('\n  La clé doit être SANS # au début de la ligne.')
    console.error('  Ou : $env:SMS_RU_API_ID="..."; npm run setup:sms-ru')
    process.exit(1)
  }

  if (!vars.SMS_PROVIDER || vars.SMS_PROVIDER === 'auto') {
    upsertEnvVar('SMS_PROVIDER', 'smsru')
    vars.SMS_PROVIDER = 'smsru'
  }

  vars.SEND_SMS_HOOK_SECRET = ensureHookSecret(vars)

  log('Provider', vars.SMS_PROVIDER || 'smsru')
  log('Supabase', `projet ${projectRef}`)
  if (run('npx', ['supabase', 'link', '--project-ref', projectRef, '--yes']) !== 0) {
    process.exit(1)
  }

  const secretsPath = path.join(root, 'scripts', 'phase2.supabase-secrets.env')
  const secretLines = [
    `SMS_PROVIDER=${vars.SMS_PROVIDER || 'smsru'}`,
    `SMS_RU_API_ID=${apiId}`,
    `SMS_MESSAGE_TEMPLATE=${vars.SMS_MESSAGE_TEMPLATE || vars.YC_SNS_MESSAGE_TEMPLATE || 'Код MOXT: {otp}. Никому не сообщайте.'}`,
    `SEND_SMS_HOOK_SECRET=${vars.SEND_SMS_HOOK_SECRET || process.env.SEND_SMS_HOOK_SECRET || ''}`,
  ]

  if (vars.SMS_RU_FROM) secretLines.push(`SMS_RU_FROM=${vars.SMS_RU_FROM}`)
  if (vars.YC_SNS_ACCESS_KEY_ID) secretLines.push(`YC_SNS_ACCESS_KEY_ID=${vars.YC_SNS_ACCESS_KEY_ID}`)
  if (vars.YC_SNS_SECRET_ACCESS_KEY) {
    secretLines.push(`YC_SNS_SECRET_ACCESS_KEY=${vars.YC_SNS_SECRET_ACCESS_KEY}`)
  }
  if (vars.YC_SNS_SENDER_ID) secretLines.push(`YC_SNS_SENDER_ID=${vars.YC_SNS_SENDER_ID}`)
  if (vars.YC_SNS_MESSAGE_TEMPLATE) {
    secretLines.push(`YC_SNS_MESSAGE_TEMPLATE=${vars.YC_SNS_MESSAGE_TEMPLATE}`)
  }

  writeFileSync(secretsPath, `${secretLines.join('\n')}\n`, 'utf8')
  log('Secrets Edge Function', 'send-sms')
  if (run('npx', ['supabase', 'secrets', 'set', '--env-file', secretsPath]) !== 0) {
    process.exit(1)
  }

  log('Déploiement', 'send-sms')
  if (run('npx', ['supabase', 'functions', 'deploy', 'send-sms', '--no-verify-jwt']) !== 0) {
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
    const pushEnv = {
      ...process.env,
      SEND_SMS_HOOK_SECRET: vars.SEND_SMS_HOOK_SECRET,
      MOXT_POSTBOX_SMTP_USER: vars.MOXT_POSTBOX_SMTP_USER,
      MOXT_POSTBOX_SMTP_PASS: vars.MOXT_POSTBOX_SMTP_PASS,
      MOXT_POSTBOX_FROM: vars.MOXT_POSTBOX_FROM,
    }
    if (run('npx', ['supabase', 'config', 'push', '--yes'], { env: pushEnv }) !== 0) {
      console.log('\n  ⚠ config push échoué — relancez : npm run setup:supabase')
    }
  } else {
    console.log('\n  ⚠ Hook Auth non synchronisé (Postbox absent de phase2.env).')
    console.log('  Edge Function déployée ; pour activer les OTP :')
    console.log('    npm run setup:yandex-provision')
    console.log('    npm run setup:supabase')
  }

  console.log('\n══════════════════════════════════════')
  console.log('  SMS.ru configuré')
  console.log('══════════════════════════════════════')
  console.log('\n  Test : inscription ou connexion avec un numéro +7')
  console.log('  Vérifiez le solde sur https://sms.ru')
  console.log('\n  SMS.ru — expéditeur obligatoire (erreur 221 sans cela) :')
  console.log('    https://sms.ru/?panel=senders → ajoutez MOXT ou moxtapp.ru')
  console.log('    Puis dans phase2.env : SMS_RU_FROM=MOXT')
  console.log('    Et : npm run setup:sms-ru')
  console.log('\n  Revenir à Yandex CNS plus tard : SMS_PROVIDER=yandex dans phase2.env puis npm run setup:sms-ru')
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
