#!/usr/bin/env node
/**
 * Déploie SMSC.ru pour :
 *  - envoi OTP Supabase (edge function send-sms, provider smsc)
 *  - réception SMS entrants + statuts (edge function smsc-webhook)
 *
 * 1. Ajoutez dans scripts/phase2.env :
 *      SMSC_LOGIN=Feliciano6
 *      SMSC_PASSWORD=votre_mot_de_passe
 *      # ou SMSC_API_KEY=...
 *      SMS_PROVIDER=smsc
 *      SMSC_SENDER=MOXT
 * 2. Configurez le webhook dans SMSC (voir instructions en fin de script)
 * 3. Lancez : npm run setup:smsc
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { warnSmsInfraLocked } from './lib/smsInfraLock.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const projectRef = 'rbvqfkccbkwjxkvpnwqn'
const webhookBase = `https://${projectRef}.supabase.co/functions/v1/smsc-webhook`

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

function buildSupabaseEnv(vars) {
  return {
    ...process.env,
    SUPABASE_ACCESS_TOKEN:
      process.env.SUPABASE_ACCESS_TOKEN || vars.SUPABASE_ACCESS_TOKEN || '',
    SUPABASE_DB_PASSWORD:
      process.env.SUPABASE_DB_PASSWORD ||
      vars.SUPABASE_DB_PASSWORD ||
      vars.MOXT_SUPABASE_DB_PASSWORD ||
      '',
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
  return run('npx', ['supabase', ...args], { env })
}

function ensureHookSecret(vars) {
  if (vars.SEND_SMS_HOOK_SECRET && !vars.SEND_SMS_HOOK_SECRET.includes('REMPLACER')) {
    return vars.SEND_SMS_HOOK_SECRET
  }
  const secret = `v1,whsec_${randomBytes(24).toString('base64')}`
  upsertEnvVar('SEND_SMS_HOOK_SECRET', secret)
  log('Secret hook OTP généré', 'enregistré dans scripts/phase2.env')
  return secret
}

function ensureWebhookSecret(vars) {
  if (vars.SMSC_WEBHOOK_SECRET && !vars.SMSC_WEBHOOK_SECRET.includes('REMPLACER')) {
    return vars.SMSC_WEBHOOK_SECRET
  }
  const secret = randomBytes(24).toString('hex')
  upsertEnvVar('SMSC_WEBHOOK_SECRET', secret)
  log('Secret webhook SMSC généré', 'enregistré dans scripts/phase2.env')
  return secret
}

async function main() {
  warnSmsInfraLocked('setup:smsc')

  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — SMSC.ru (envoi OTP + réception SMS)')
  console.log('══════════════════════════════════════')

  for (const key of ['SMSC_LOGIN', 'SMSC_PASSWORD', 'SMSC_API_KEY', 'SMSC_SENDER']) {
    if (process.env[key]) upsertEnvVar(key, process.env[key])
  }

  const vars = parseEnvFile(envPath)
  const login = (process.env.SMSC_LOGIN || vars.SMSC_LOGIN || '').trim()
  const password = (process.env.SMSC_PASSWORD || vars.SMSC_PASSWORD || '').trim()
  const apikey = (process.env.SMSC_API_KEY || vars.SMSC_API_KEY || '').trim()

  if (!login || (!password && !apikey)) {
    console.error('\n✗ Identifiants SMSC manquants.')
    console.error('  Éditez scripts/phase2.env :')
    console.error('    SMSC_LOGIN=Feliciano6')
    console.error('    SMSC_PASSWORD=votre_mot_de_passe')
    console.error('    # ou SMSC_API_KEY=...')
    console.error('    SMS_PROVIDER=smsc')
    console.error('    SMSC_SENDER=MOXT')
    process.exit(1)
  }

  upsertEnvVar('SMS_PROVIDER', 'smsc')
  vars.SMS_PROVIDER = 'smsc'
  vars.SEND_SMS_HOOK_SECRET = ensureHookSecret(vars)
  vars.SMSC_WEBHOOK_SECRET = ensureWebhookSecret(vars)

  log('Provider', 'smsc')
  log('Compte SMSC', login)
  log('Supabase', `projet ${projectRef}`)

  const supabaseEnv = buildSupabaseEnv(vars)
  if (!supabaseEnv.SUPABASE_ACCESS_TOKEN) {
    console.error('\n✗ SUPABASE_ACCESS_TOKEN manquant pour la CLI Supabase.')
    console.error('  1. Créez un token : https://supabase.com/dashboard/account/tokens')
    console.error('  2. Ajoutez-le dans scripts/phase2.env :')
    console.error('       SUPABASE_ACCESS_TOKEN=sbp_...')
    console.error('  3. Ou dans PowerShell : $env:SUPABASE_ACCESS_TOKEN="sbp_..."')
    console.error('  4. Ou : npx supabase login')
    process.exit(1)
  }

  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], supabaseEnv) !== 0) {
    console.error('\n✗ Liaison Supabase échouée (Unauthorized).')
    console.error('  Le token est peut-être expiré ou révoqué.')
    console.error('  Regénérez-le : https://supabase.com/dashboard/account/tokens')
    process.exit(1)
  }

  log('Migration', 'smsc_events')
  if (run('npm', ['run', 'db:push'], { env: supabaseEnv }) !== 0) {
    console.log('\n  ⚠ db:push échoué — vérifiez SUPABASE_DB_PASSWORD dans phase2.env')
  }

  const secretsPath = path.join(root, 'scripts', 'phase2.supabase-secrets.env')
  const secretLines = [
    `SMS_PROVIDER=smsc`,
    `SMSC_LOGIN=${login}`,
    `SMSC_WEBHOOK_SECRET=${vars.SMSC_WEBHOOK_SECRET}`,
    `SMS_MESSAGE_TEMPLATE=${vars.SMS_MESSAGE_TEMPLATE || vars.YC_SNS_MESSAGE_TEMPLATE || 'Код MOXT: {otp}. Никому не сообщайте.'}`,
    `SEND_SMS_HOOK_SECRET=${vars.SEND_SMS_HOOK_SECRET || ''}`,
  ]
  if (password) secretLines.push(`SMSC_PASSWORD=${password}`)
  if (apikey) secretLines.push(`SMSC_API_KEY=${apikey}`)
  if (vars.SMSC_SENDER) secretLines.push(`SMSC_SENDER=${vars.SMSC_SENDER}`)
  if (vars.SMS_RU_API_ID) secretLines.push(`SMS_RU_API_ID=${vars.SMS_RU_API_ID}`)
  secretLines.push('SMS_INFRA_LOCKED=true')
  if (vars.YC_SNS_ACCESS_KEY_ID) secretLines.push(`YC_SNS_ACCESS_KEY_ID=${vars.YC_SNS_ACCESS_KEY_ID}`)
  if (vars.YC_SNS_SECRET_ACCESS_KEY) {
    secretLines.push(`YC_SNS_SECRET_ACCESS_KEY=${vars.YC_SNS_SECRET_ACCESS_KEY}`)
  }
  if (vars.YC_SNS_SENDER_ID) secretLines.push(`YC_SNS_SENDER_ID=${vars.YC_SNS_SENDER_ID}`)

  writeFileSync(secretsPath, `${secretLines.join('\n')}\n`, 'utf8')
  log('Secrets Edge Functions', 'send-sms + smsc-webhook')
  if (runSupabase(['secrets', 'set', '--env-file', secretsPath], supabaseEnv) !== 0) {
    process.exit(1)
  }

  log('Déploiement', 'send-sms')
  if (runSupabase(['functions', 'deploy', 'send-sms', '--no-verify-jwt'], supabaseEnv) !== 0) {
    process.exit(1)
  }

  log('Déploiement', 'smsc-webhook')
  if (runSupabase(['functions', 'deploy', 'smsc-webhook', '--no-verify-jwt'], supabaseEnv) !== 0) {
    process.exit(1)
  }

  const hasPostbox = Boolean(
    vars.MOXT_POSTBOX_SMTP_USER &&
      vars.MOXT_POSTBOX_SMTP_PASS &&
      vars.MOXT_POSTBOX_FROM &&
      !vars.MOXT_POSTBOX_SMTP_USER.includes('REMPLACER'),
  )
  const hasSmsHook = Boolean(vars.SEND_SMS_HOOK_SECRET && !vars.SEND_SMS_HOOK_SECRET.includes('REMPLACER'))

  if (hasPostbox || hasSmsHook) {
    log('Config Auth', hasPostbox ? 'hook send_sms → SMSC + SMTP' : 'hook send_sms → SMSC')
    const pushEnv = {
      ...process.env,
      SEND_SMS_HOOK_SECRET: vars.SEND_SMS_HOOK_SECRET,
    }
    if (hasPostbox) {
      pushEnv.MOXT_POSTBOX_SMTP_USER = vars.MOXT_POSTBOX_SMTP_USER
      pushEnv.MOXT_POSTBOX_SMTP_PASS = vars.MOXT_POSTBOX_SMTP_PASS
      pushEnv.MOXT_POSTBOX_FROM = vars.MOXT_POSTBOX_FROM
    }
    if (runSupabase(['config', 'push', '--yes'], { ...supabaseEnv, ...pushEnv }) !== 0) {
      console.log('\n  ⚠ config push échoué — relancez : npm run setup:supabase')
    }
  } else {
    console.log('\n  ⚠ Hook Auth non synchronisé. Lancez npm run setup:supabase après.')
  }

  const webhookUrl = `${webhookBase}?secret=${vars.SMSC_WEBHOOK_SECRET}`

  console.log('\n══════════════════════════════════════')
  console.log('  SMSC — configuration côté smsc.ru')
  console.log('══════════════════════════════════════')
  console.log('\n  1. Paramètres → API / SMPP')
  console.log('     URL des réponses et des statuts :')
  console.log(`     ${webhookUrl}`)
  console.log('\n  2. Cochez « Rediriger vers l’URL » :')
  console.log('       ☑ SMS entrants')
  console.log('       ☑ statuts (recommandé)')
  console.log('\n  3. Paramètres → SMS et appels entrants')
  console.log('     Louez un numéro virtuel si vous voulez recevoir des SMS sur un numéro dédié.')
  console.log('\n  4. Expéditeur OTP : SMSC_SENDER=MOXT (ou votre sender validé)')
  console.log('\n  5. Tests : cochez « Activer la journalisation de l’API » pendant les essais')
  console.log('     Décochez « Mode test » en production.')
  console.log('\n  6. Solde : gardez au moins 50–100 ₽ pour les OTP')
  console.log('\n══════════════════════════════════════')
  console.log('  Déploiement terminé')
  console.log('══════════════════════════════════════')
  console.log('\n  Test envoi : connexion / inscription avec un numéro +7')
  console.log('  Test réception : envoyez un SMS au numéro virtuel SMSC, puis vérifiez la table smsc_events')
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
