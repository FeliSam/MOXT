#!/usr/bin/env node
/**
 * Phase 2 — Yandex uniquement : Postbox (e-mails) + CNS (SMS OTP)
 *
 * Automatique : npm run setup:yandex-all
 * Ou seul     : npm run setup:phase2 (après provision-yandex-auth)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { assertSmsInfraChangeAllowed } from './lib/smsInfraLock.mjs'

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
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

function run(cmd, args, { env = process.env, inherit = true } = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: inherit ? 'inherit' : 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env,
  })
  return {
    code: result.status ?? 1,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  }
}

function requireVars(vars, keys) {
  const missing = keys.filter((k) => !vars[k] || vars[k].includes('REMPLACER'))
  if (missing.length) {
    console.error(`\n✗ Variables manquantes dans scripts/phase2.env :`)
    for (const key of missing) console.error(`  - ${key}`)
    console.error('\n  Copiez scripts/phase2.env.example → scripts/phase2.env')
    process.exit(1)
  }
}

function ensureHookSecret(vars) {
  if (vars.SEND_SMS_HOOK_SECRET && !vars.SEND_SMS_HOOK_SECRET.includes('REMPLACER')) {
    return vars.SEND_SMS_HOOK_SECRET
  }
  const secret = `v1,whsec_${randomBytes(24).toString('base64')}`
  const lines = existsSync(envPath) ? readFileSync(envPath, 'utf8').split(/\r?\n/) : []
  let replaced = false
  const next = lines.map((line) => {
    if (line.startsWith('SEND_SMS_HOOK_SECRET=')) {
      replaced = true
      return `SEND_SMS_HOOK_SECRET=${secret}`
    }
    return line
  })
  if (!replaced) next.push(`SEND_SMS_HOOK_SECRET=${secret}`)
  writeFileSync(envPath, `${next.join('\n').trimEnd()}\n`, 'utf8')
  log('Secret hook généré', 'enregistré dans scripts/phase2.env')
  return secret
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — Phase 2 Yandex (Postbox + CNS)')
  console.log('══════════════════════════════════════')

  if (!existsSync(envPath)) {
    console.error('\n✗ scripts/phase2.env introuvable.')
    console.error('  Lancez : npm run setup:yandex-provision')
    console.error('  Ou     : npm run setup:yandex-all')
    process.exit(1)
  }

  const vars = parseEnvFile(envPath)
  const smsRuReady = Boolean(vars.SMS_RU_API_ID && !vars.SMS_RU_API_ID.includes('REMPLACER'))
  const requiredKeys = [
    'MOXT_POSTBOX_SMTP_USER',
    'MOXT_POSTBOX_SMTP_PASS',
    'MOXT_POSTBOX_FROM',
  ]
  if (!smsRuReady) {
    requiredKeys.push('YC_SNS_ACCESS_KEY_ID', 'YC_SNS_SECRET_ACCESS_KEY')
  }
  requireVars(vars, requiredKeys)

  const hookSecret = ensureHookSecret(vars)
  vars.SEND_SMS_HOOK_SECRET = hookSecret

  log('Supabase — liaison projet')
  if (run('npx', ['supabase', 'link', '--project-ref', projectRef, '--yes']).code !== 0) {
    process.exit(1)
  }

  log('Secrets Edge Function send-sms')
  assertSmsInfraChangeAllowed('setup:phase2')
  const secretsPath = path.join(root, 'scripts', 'phase2.supabase-secrets.env')
  const secretLines = [
    `SMS_PROVIDER=${vars.SMS_PROVIDER || (smsRuReady ? 'smsru' : 'yandex')}`,
    `YC_SNS_MESSAGE_TEMPLATE=${vars.YC_SNS_MESSAGE_TEMPLATE || 'Код MOXT: {otp}. Никому не сообщайте.'}`,
    `SMS_MESSAGE_TEMPLATE=${vars.SMS_MESSAGE_TEMPLATE || vars.YC_SNS_MESSAGE_TEMPLATE || 'Код MOXT: {otp}. Никому не сообщайте.'}`,
    `SEND_SMS_HOOK_SECRET=${vars.SEND_SMS_HOOK_SECRET}`,
  ]
  if (smsRuReady) {
    secretLines.push(`SMS_RU_API_ID=${vars.SMS_RU_API_ID}`)
    if (vars.SMS_RU_FROM) secretLines.push(`SMS_RU_FROM=${vars.SMS_RU_FROM}`)
  }
  if (vars.YC_SNS_ACCESS_KEY_ID) secretLines.push(`YC_SNS_ACCESS_KEY_ID=${vars.YC_SNS_ACCESS_KEY_ID}`)
  if (vars.YC_SNS_SECRET_ACCESS_KEY) {
    secretLines.push(`YC_SNS_SECRET_ACCESS_KEY=${vars.YC_SNS_SECRET_ACCESS_KEY}`)
  }
  secretLines.push(`YC_SNS_SENDER_ID=${vars.YC_SNS_SENDER_ID || 'MOXT'}`)
  writeFileSync(secretsPath, `${secretLines.join('\n')}\n`, 'utf8')
  if (run('npx', ['supabase', 'secrets', 'set', '--env-file', secretsPath]).code !== 0) {
    process.exit(1)
  }

  log('Déploiement Edge Function', 'send-sms')
  if (run('npx', ['supabase', 'functions', 'deploy', 'send-sms', '--no-verify-jwt']).code !== 0) {
    process.exit(1)
  }

  log('Déploiement Edge Function', 'phone-login')
  if (run('npx', ['supabase', 'functions', 'deploy', 'phone-login', '--no-verify-jwt']).code !== 0) {
    process.exit(1)
  }

  log('Config Auth', smsRuReady ? 'Postbox SMTP + hook send_sms → SMS.ru' : 'Postbox SMTP + hook send_sms → Yandex CNS')
  const pushEnv = {
    ...process.env,
    MOXT_POSTBOX_SMTP_USER: vars.MOXT_POSTBOX_SMTP_USER,
    MOXT_POSTBOX_SMTP_PASS: vars.MOXT_POSTBOX_SMTP_PASS,
    MOXT_POSTBOX_FROM: vars.MOXT_POSTBOX_FROM,
    SEND_SMS_HOOK_SECRET: vars.SEND_SMS_HOOK_SECRET,
  }
  if (run('npx', ['supabase', 'config', 'push', '--yes'], { env: pushEnv }).code !== 0) {
    process.exit(1)
  }

  log('Postbox', 'adresse + DKIM automatiques')
  if (
    spawnSync(process.execPath, [path.join(root, 'scripts', 'setup-postbox-domain.mjs')], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    }).status !== 0
  ) {
    console.log('\n  Relancez plus tard : npm run setup:postbox')
  }

  log('CNS', 'canal SMS + sandbox automatiques')
  if (
    spawnSync(process.execPath, [path.join(root, 'scripts', 'setup-cns-sms.mjs')], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, MOXT_CNS_SKIP_PHASE2: '1' },
    }).status !== 0
  ) {
    console.log('\n  Relancez plus tard : npm run setup:cns')
  }

  console.log('\n══════════════════════════════════════')
  console.log('  Phase 2 Yandex configurée')
  console.log('══════════════════════════════════════')
  console.log('\n  E-mails → Yandex Postbox')
  console.log(smsRuReady ? '  SMS OTP → SMS.ru' : '  SMS OTP → Yandex Cloud Notification Service')
  console.log('\n  Étapes console Yandex (si pas encore fait) :')
  console.log('  1. Postbox : vérifier le domaine moxtapp.ru (SPF/DKIM)')
  console.log('  2. CNS : modèle SMS type Authorization (2–4 semaines)')
  console.log('  3. CNS : sortir de la sandbox pour la production')
  console.log('\n  CNS facturé : abonnement expéditeur MOXT + chaque envoi SMS (tests inclus)')
  console.log('  Test sandbox : $env:MOXT_CNS_TEST_PHONE="+7999..."; npm run setup:cns')
  console.log('\n  Test : inscription /register (e-mail + téléphone)')
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
