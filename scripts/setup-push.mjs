#!/usr/bin/env node
/**
 * Configure Web Push MOXT : VAPID, secrets Supabase, déploiement send-push, migration.
 *
 * Usage :
 *   npm run push:generate-vapid
 *   npm run setup:push
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { parseEnvFile, phase2EnvPath, upsertPhase2Env } from './lib/env.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRef = 'rbvqfkccbkwjxkvpnwqn'
const defaultSupabaseUrl = `https://${projectRef}.supabase.co`

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function requireEnv(env, keys) {
  const missing = keys.filter((key) => !env[key])
  if (missing.length) {
    console.error(`\n✗ Variables manquantes dans ${phase2EnvPath} : ${missing.join(', ')}`)
    console.error('  Lancez d’abord : npm run push:generate-vapid')
    process.exit(1)
  }
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
  return (
    spawnSync('npx', ['supabase', ...args], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env,
    }).status ?? 1
  )
}

function resolveSupabaseUrl(vars) {
  return (
    vars.VITE_SUPABASE_URL ||
    vars.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    defaultSupabaseUrl
  )
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — Web Push (VAPID + send-push)')
  console.log('══════════════════════════════════════')

  const vars = parseEnvFile(phase2EnvPath)
  requireEnv(vars, ['VITE_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'PUSH_DISPATCH_SECRET'])

  const supabaseUrl = resolveSupabaseUrl(vars)
  const dispatchUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-push`

  upsertPhase2Env({
    VITE_SUPABASE_URL: supabaseUrl,
    MOXT_SEND_PUSH_URL: dispatchUrl,
  })

  const supabaseEnv = buildSupabaseEnv(vars)
  if (!supabaseEnv.SUPABASE_ACCESS_TOKEN) {
    console.error('\n✗ SUPABASE_ACCESS_TOKEN manquant dans scripts/phase2.env')
    process.exit(1)
  }

  log('Supabase', `projet ${projectRef}`)
  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], supabaseEnv) !== 0) {
    console.error('\n✗ Liaison Supabase échouée')
    process.exit(1)
  }

  log('Secrets Edge Function', 'send-push')
  const vapidPublicKey = vars.VAPID_PUBLIC_KEY || vars.VITE_VAPID_PUBLIC_KEY
  if (
    runSupabase(
      [
        'secrets',
        'set',
        `VAPID_PUBLIC_KEY=${vapidPublicKey}`,
        `VAPID_PRIVATE_KEY=${vars.VAPID_PRIVATE_KEY}`,
        `PUSH_DISPATCH_SECRET=${vars.PUSH_DISPATCH_SECRET}`,
        'VAPID_SUBJECT=mailto:support@moxtapp.ru',
      ],
      supabaseEnv,
    ) !== 0
  ) {
    process.exit(1)
  }

  log('Déploiement', 'send-push')
  if (runSupabase(['functions', 'deploy', 'send-push', '--no-verify-jwt'], supabaseEnv) !== 0) {
    process.exit(1)
  }

  log('Migration', 'device_subscriptions + push_dispatch_log')
  const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')
  const dbArgs = ['db', 'push', '--linked', '--yes', '--include-all']
  const dbCode = existsSync(supabaseJs)
    ? spawnSync(process.execPath, [supabaseJs, ...dbArgs], { cwd: root, stdio: 'inherit', env: supabaseEnv }).status ?? 1
    : spawnSync('npx', ['supabase', ...dbArgs], {
        cwd: root,
        stdio: 'inherit',
        shell: process.platform === 'win32',
        env: supabaseEnv,
      }).status ?? 1

  if (dbCode !== 0) {
    console.warn('\n⚠ db:push échoué — appliquez manuellement :')
    console.warn('  supabase/migrations/20260713100000_device_subscriptions_push.sql')
  }

  console.log('\n▸ Trigger pg_net (secret runtime + GUC optionnel)')
  // Managed Supabase often denies ALTER DATABASE ... SET for custom GUCs.
  // Persist the secret in private.moxt_runtime_settings (read by the trigger).
  const secret = String(vars.PUSH_DISPATCH_SECRET || '')
  const dollarTag = `moxt${Date.now().toString(36)}`
  const settingsSql = [
    `insert into private.moxt_runtime_settings (key, value, updated_at)`,
    `values ('push_dispatch_secret', $${dollarTag}$${secret}$${dollarTag}$, now())`,
    `on conflict (key) do update`,
    `set value = excluded.value, updated_at = now();`,
  ].join('\n')
  const settingsCode = runSupabase(['db', 'query', '--linked', settingsSql], supabaseEnv)
  if (settingsCode !== 0) {
    console.error('\n✗ Impossible d’écrire private.moxt_runtime_settings.push_dispatch_secret')
    console.error('  Vérifiez que la migration 20260729200000_push_dispatch_secret_settings.sql est appliquée.')
    process.exit(1)
  }
  console.log('  ✓ private.moxt_runtime_settings.push_dispatch_secret')

  // Best-effort GUCs (ignored when permission denied).
  const alterSql = [
    `ALTER DATABASE postgres SET moxt.send_push_url = '${dispatchUrl}';`,
    `ALTER DATABASE postgres SET moxt.push_dispatch_secret = '${secret}';`,
  ].join('\n')
  const sqlCode = runSupabase(['db', 'query', '--linked', alterSql], supabaseEnv)
  if (sqlCode !== 0) {
    console.warn('  ⚠ GUC ALTER DATABASE refusé (attendu sur Supabase managé) — settings table utilisée.')
  } else {
    console.log('  ✓ moxt.send_push_url + moxt.push_dispatch_secret (GUC)')
  }

  console.log('\n══════════════════════════════════════')
  console.log('  Web Push configuré')
  console.log('══════════════════════════════════════')
  console.log(`  URL dispatch : ${dispatchUrl}`)
  console.log('  Test pipeline : npm run push:simulate')
  console.log('  iPhone : Safari → écran d’accueil → Paramètres → notifications push ON')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
