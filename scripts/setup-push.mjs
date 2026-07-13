#!/usr/bin/env node
/**
 * Configure Web Push MOXT : VAPID, secrets Supabase, URL dispatch DB.
 *
 * Usage :
 *   node scripts/generate-vapid-keys.mjs
 *   node scripts/setup-push.mjs
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { parseEnvFile, phase2EnvPath, upsertPhase2Env } from './lib/env.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function readPhase2() {
  return parseEnvFile(phase2EnvPath)
}

function requireEnv(env, keys) {
  const missing = keys.filter((key) => !env[key])
  if (missing.length) {
    console.error(`\n✗ Variables manquantes dans ${phase2EnvPath} : ${missing.join(', ')}`)
    console.error('  Lancez d’abord : node scripts/generate-vapid-keys.mjs')
    process.exit(1)
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  return result.status ?? 1
}

async function main() {
  const env = readPhase2()
  requireEnv(env, ['VITE_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'PUSH_DISPATCH_SECRET'])

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL
  if (!supabaseUrl) {
    console.error('\n✗ VITE_SUPABASE_URL manquant dans phase2.env')
    process.exit(1)
  }

  const dispatchUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-push`
  upsertPhase2Env({
    MOXT_SEND_PUSH_URL: dispatchUrl,
  })

  console.log('\n▸ Secrets Edge Function send-push')
  console.log('  Définissez dans Supabase (Project Settings → Edge Functions → Secrets) :')
  console.log(`  VAPID_PUBLIC_KEY=${env.VITE_VAPID_PUBLIC_KEY}`)
  console.log(`  VAPID_PRIVATE_KEY=${env.VAPID_PRIVATE_KEY}`)
  console.log(`  PUSH_DISPATCH_SECRET=${env.PUSH_DISPATCH_SECRET}`)
  console.log('  VAPID_SUBJECT=mailto:support@moxtapp.ru')

  console.log('\n▸ Paramètres base de données (optionnel, pour trigger pg_net)')
  console.log(`  ALTER DATABASE postgres SET moxt.send_push_url = '${dispatchUrl}';`)
  console.log(`  ALTER DATABASE postgres SET moxt.push_dispatch_secret = '${env.PUSH_DISPATCH_SECRET}';`)

  console.log('\n▸ Déploiement')
  const pushFn = path.join(root, 'supabase', 'functions', 'send-push', 'index.ts')
  if (!existsSync(pushFn)) {
    console.error('✗ Fonction send-push introuvable')
    process.exit(1)
  }

  if (run('npx', ['supabase', 'functions', 'deploy', 'send-push', '--no-verify-jwt']) !== 0) {
    console.warn('\n⚠ Déploiement send-push manuel requis : npx supabase functions deploy send-push --no-verify-jwt')
  }

  if (run('npm', ['run', 'db:push']) !== 0) {
    console.warn('\n⚠ Migration device_subscriptions : npm run db:push')
  }

  console.log('\n✓ Configuration push documentée')
  console.log(`  URL dispatch : ${dispatchUrl}`)
  console.log('  Test local : node scripts/simulate-push-pipeline.mjs')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
