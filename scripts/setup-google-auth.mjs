#!/usr/bin/env node
/**
 * Pousse la config Google OAuth vers Supabase (config push).
 * Prérequis : scripts/phase2.env avec GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const projectRef = 'rbvqfkccbkwjxkvpnwqn'

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

function runSupabase(args, env) {
  const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')
  const result = spawnSync(process.execPath, [supabaseJs, ...args], {
    cwd: root,
    stdio: 'inherit',
    env,
  })
  return result.status ?? 1
}

function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — Google OAuth (Supabase)')
  console.log('══════════════════════════════════════\n')

  if (!existsSync(envPath)) {
    console.error('✗ scripts/phase2.env introuvable.')
    process.exit(1)
  }

  const vars = parseEnvFile(envPath)
  const clientId = vars.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = vars.GOOGLE_OAUTH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('✗ GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET requis dans scripts/phase2.env\n')
    console.log('Configuration Google Cloud Console :')
    console.log('  1. https://console.cloud.google.com/apis/credentials')
    console.log('  2. Créer un identifiant OAuth 2.0 (Application Web)')
    console.log('  3. URI de redirection autorisées :')
    console.log(`     https://${projectRef}.supabase.co/auth/v1/callback`)
    console.log('  4. Origines JavaScript autorisées :')
    console.log('     http://localhost:5173')
    console.log('     https://moxtapp.ru')
    console.log('     https://www.moxtapp.ru')
    console.log('\nPuis dans scripts/phase2.env :')
    console.log('  GOOGLE_OAUTH_CLIENT_ID=...')
    console.log('  GOOGLE_OAUTH_CLIENT_SECRET=...')
    process.exit(1)
  }

  const pushEnv = {
    ...process.env,
    GOOGLE_OAUTH_CLIENT_ID: clientId,
    GOOGLE_OAUTH_CLIENT_SECRET: clientSecret,
    MOXT_POSTBOX_SMTP_USER: vars.MOXT_POSTBOX_SMTP_USER || '',
    MOXT_POSTBOX_SMTP_PASS: vars.MOXT_POSTBOX_SMTP_PASS || '',
    MOXT_POSTBOX_FROM: vars.MOXT_POSTBOX_FROM || '',
    SEND_SMS_HOOK_SECRET: vars.SEND_SMS_HOOK_SECRET || '',
  }

  console.log('▸ Liaison projet Supabase…')
  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], pushEnv) !== 0) {
    process.exit(1)
  }

  console.log('\n▸ Activation Google OAuth (config push)…')
  if (runSupabase(['config', 'push', '--yes'], pushEnv) !== 0) {
    process.exit(1)
  }

  console.log('\n✓ Google OAuth activé sur Supabase.')
  console.log('  Redirection site après connexion : /register?from=google')
  console.log('  Les utilisateurs Google doivent compléter leur profil (téléphone RU, ville, pays).')
}

main()
