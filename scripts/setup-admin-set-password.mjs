#!/usr/bin/env node
/**
 * Déploie admin-set-user-password (secret MOXT_ADMIN_PROMOTE_PASSWORD déjà sur le projet).
 * Usage : npm run setup:admin-set-password
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
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
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return vars
}

function runSupabase(args, env) {
  return spawnSync('npx', ['supabase', ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env,
  }).status ?? 1
}

const vars = parseEnvFile(envPath)
const password = vars.MOXT_ADMIN_PROMOTE_PASSWORD || process.env.MOXT_ADMIN_PROMOTE_PASSWORD || ''
if (!password) {
  console.error('MOXT_ADMIN_PROMOTE_PASSWORD manquant dans scripts/phase2.env')
  process.exit(1)
}

const supabaseEnv = {
  ...process.env,
  SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN || vars.SUPABASE_ACCESS_TOKEN || '',
}

if (!supabaseEnv.SUPABASE_ACCESS_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN manquant — supabase login ou phase2.env')
  process.exit(1)
}

if (runSupabase(['link', '--project-ref', projectRef, '--yes'], supabaseEnv) !== 0) {
  process.exit(1)
}

if (runSupabase(['functions', 'deploy', 'admin-set-user-password', '--no-verify-jwt'], supabaseEnv) !== 0) {
  process.exit(1)
}

if (
  runSupabase(
    ['secrets', 'set', `MOXT_ADMIN_PROMOTE_PASSWORD=${password}`, '--project-ref', projectRef],
    supabaseEnv,
  ) !== 0
) {
  process.exit(1)
}

console.log('\n✓ admin-set-user-password déployée')
