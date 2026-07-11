#!/usr/bin/env node
/**
 * Lie Supabase, pousse la config Auth (SMTP + hook SMS) et applique les migrations.
 * Les variables env(MOXT_*) du config.toml sont résolues depuis scripts/phase2.env.
 */
import { existsSync, readFileSync } from 'node:fs'
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

function run(cmd, args, { env = process.env } = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env,
  })
  return result.status ?? 1
}

function requirePostboxVars(vars) {
  const keys = ['MOXT_POSTBOX_SMTP_USER', 'MOXT_POSTBOX_SMTP_PASS', 'MOXT_POSTBOX_FROM']
  const missing = keys.filter((key) => !vars[key] || vars[key].includes('REMPLACER'))
  if (missing.length) {
    console.error('\n✗ Variables Postbox manquantes pour config push :')
    for (const key of missing) console.error(`  - ${key}`)
    console.error('\n  Lancez : npm run setup:yandex-provision')
    console.error('  Ou     : npm run setup:phase2')
    process.exit(1)
  }
}

function warnGoogleVars(vars) {
  const keys = ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET']
  const missing = keys.filter((key) => !vars[key])
  if (missing.length) {
    console.warn('\n⚠ Google OAuth non configuré (connexion Google désactivée côté Supabase) :')
    for (const key of missing) console.warn(`  - ${key}`)
    console.warn('  Ajoutez-les dans scripts/phase2.env puis : npm run setup:google-auth')
  }
}

function buildPushEnv(vars) {
  return {
    ...process.env,
    MOXT_POSTBOX_SMTP_USER: vars.MOXT_POSTBOX_SMTP_USER,
    MOXT_POSTBOX_SMTP_PASS: vars.MOXT_POSTBOX_SMTP_PASS,
    MOXT_POSTBOX_FROM: vars.MOXT_POSTBOX_FROM,
    SEND_SMS_HOOK_SECRET: vars.SEND_SMS_HOOK_SECRET || process.env.SEND_SMS_HOOK_SECRET || '',
    GOOGLE_OAUTH_CLIENT_ID: vars.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    GOOGLE_OAUTH_CLIENT_SECRET:
      vars.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    SUPABASE_DB_PASSWORD:
      vars.SUPABASE_DB_PASSWORD ||
      vars.MOXT_SUPABASE_DB_PASSWORD ||
      process.env.SUPABASE_DB_PASSWORD ||
      '',
  }
}

function runSupabase(args, { env = process.env } = {}) {
  const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')
  if (existsSync(supabaseJs)) {
    const result = spawnSync(process.execPath, [supabaseJs, ...args], {
      cwd: root,
      stdio: 'inherit',
      env,
    })
    return result.status ?? 1
  }
  return run('npx', ['supabase', ...args], { env })
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — Supabase (link + config + db)')
  console.log('══════════════════════════════════════')

  if (!existsSync(envPath)) {
    console.error('\n✗ scripts/phase2.env introuvable.')
    console.error('  Le config push a besoin des identifiants Postbox (MOXT_POSTBOX_*).')
    console.error('  Lancez : npm run setup:yandex-provision')
    process.exit(1)
  }

  const vars = parseEnvFile(envPath)
  requirePostboxVars(vars)
  warnGoogleVars(vars)
  const pushEnv = buildPushEnv(vars)

  log('Supabase — liaison projet')
  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], { env: pushEnv }) !== 0) {
    process.exit(1)
  }

  log('Config Auth', `SMTP ${vars.MOXT_POSTBOX_FROM} + hook send_sms`)
  if (runSupabase(['config', 'push', '--yes'], { env: pushEnv }) !== 0) {
    process.exit(1)
  }

  const dbPassword = pushEnv.SUPABASE_DB_PASSWORD
  if (dbPassword) {
    log('Migrations base de données')
    const dbCode = runSupabase(['db', 'push', '--linked', '--yes'], { env: pushEnv })
    if (dbCode !== 0) {
      console.warn('\n⚠ Migrations non appliquées.')
      console.warn('  Relancez : $env:SUPABASE_DB_PASSWORD="..."; npm run db:push')
    }
  } else {
    console.warn('\n⚠ Migrations ignorées : SUPABASE_DB_PASSWORD manquant dans scripts/phase2.env')
    console.warn('  Dashboard Supabase → Settings → Database → Database password')
    console.warn('  Puis : $env:SUPABASE_DB_PASSWORD="..."; npm run db:push')
  }

  console.log('\n══════════════════════════════════════')
  console.log('  Supabase configuré')
  console.log('══════════════════════════════════════')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
