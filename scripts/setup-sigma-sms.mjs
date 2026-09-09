#!/usr/bin/env node
/**
 * Ajoute Sigma Messaging (Telegram + FlashCall) en parallèle de SMSC.
 *
 * 1. scripts/phase2.env :
 *      SIGMA_SMS_API_KEY=...     # ou Sigma_Moxt_API_Key=...
 *      # optionnel :
 *      # SIGMA_TELEGRAM_SENDER=MOXT
 *      # SIGMA_FLASHCALL_SENDER=flashcall
 * 2. npm run setup:sigma-sms
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
  warnSmsInfraLocked('setup:sigma-sms')
  console.log('  Sigma s’ajoute à SMSC : SMS = SMSC, Telegram/appel = Sigma.')

  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — Sigma SMS (Telegram + appel)')
  console.log('══════════════════════════════════════')

  for (const key of [
    'SIGMA_SMS_API_KEY',
    'Sigma_Moxt_API_Key',
    'SIGMA_API_KEY',
    'SIGMA_TELEGRAM_SENDER',
    'SIGMA_FLASHCALL_SENDER',
    'SIGMA_SENDER',
  ]) {
    if (process.env[key]) upsertEnvVar(key === 'Sigma_Moxt_API_Key' ? 'SIGMA_SMS_API_KEY' : key, process.env[key])
  }

  const vars = parseEnvFile(envPath)
  const apiKey = (
    process.env.SIGMA_SMS_API_KEY ||
    process.env.SIGMA_API_KEY ||
    process.env.Sigma_Moxt_API_Key ||
    vars.SIGMA_SMS_API_KEY ||
    vars.SIGMA_API_KEY ||
    vars.Sigma_Moxt_API_Key ||
    ''
  ).trim()

  if (!apiKey || apiKey.includes('REMPLACER')) {
    console.error('\n✗ SIGMA_SMS_API_KEY manquant.')
    console.error('  Ajoutez dans scripts/phase2.env :')
    console.error('    SIGMA_SMS_API_KEY=votre_cle_api')
    console.error('  (alias accepté : Sigma_Moxt_API_Key)')
    process.exit(1)
  }

  upsertEnvVar('SIGMA_SMS_API_KEY', apiKey)
  const supabaseEnv = buildSupabaseEnv(vars)

  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], supabaseEnv) !== 0) {
    process.exit(1)
  }

  if (process.env.MOXT_SKIP_DB_PUSH !== '1') {
    log('Migration', 'otp_delivery')
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
      console.log('\n  ⚠ db:push échoué — relancez npm run db:push')
    }
  }

  const secretsPath = path.join(root, 'scripts', 'phase2.supabase-secrets.env')
  const secretLines = [`SIGMA_SMS_API_KEY=${apiKey}`]
  const telegramSender = vars.SIGMA_TELEGRAM_SENDER || vars.SIGMA_SENDER || 'MOXT'
  const flashSender = vars.SIGMA_FLASHCALL_SENDER || 'flashcall'
  secretLines.push(`SIGMA_TELEGRAM_SENDER=${telegramSender}`)
  secretLines.push(`SIGMA_FLASHCALL_SENDER=${flashSender}`)
  writeFileSync(secretsPath, `${secretLines.join('\n')}\n`, 'utf8')

  log('Secrets', 'SIGMA_SMS_API_KEY (Telegram + FlashCall)')
  if (runSupabase(['secrets', 'set', '--env-file', secretsPath], supabaseEnv) !== 0) {
    process.exit(1)
  }

  log('Déploiement', 'send-sms, otp-set-channel, verify-flashcall')
  for (const name of ['send-sms', 'otp-set-channel', 'verify-flashcall']) {
    if (runSupabase(['functions', 'deploy', name, '--no-verify-jwt'], supabaseEnv) !== 0) {
      process.exit(1)
    }
  }

  console.log('\n══════════════════════════════════════')
  console.log('  Sigma configuré')
  console.log('══════════════════════════════════════')
  console.log('\n  SMS reste sur SMSC. Telegram / appel = Sigma.')
  console.log('  Appel : l’utilisateur saisit les 4 derniers chiffres du numéro qui appelle.')
  console.log('  Cabinet : https://online.sigmasms.ru')
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
