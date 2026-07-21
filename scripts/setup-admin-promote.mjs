#!/usr/bin/env node
/**
 * Synchronise le mot de passe de promotion admin vers Supabase Edge Functions.
 *
 * 1. Ajoutez dans scripts/phase2.env :
 *      MOXT_ADMIN_PROMOTE_PASSWORD=votre_mot_de_passe_secret
 * 2. Lancez : npm run setup:admin-promote
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')

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

function runSupabase(args, env) {
  return spawnSync('npx', ['supabase', ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env,
  }).status ?? 1
}

function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — verrouillage promotion admin')
  console.log('══════════════════════════════════════')

  const vars = parseEnvFile(envPath)
  let password = (process.env.MOXT_ADMIN_PROMOTE_PASSWORD || vars.MOXT_ADMIN_PROMOTE_PASSWORD || '').trim()

  if (!password) {
    password = randomBytes(18).toString('base64url')
    upsertEnvVar('MOXT_ADMIN_PROMOTE_PASSWORD', password)
    log('Mot de passe généré', 'enregistré dans scripts/phase2.env')
    console.log(`\n  Conservez ce mot de passe : ${password}`)
    console.log('  Il sera demandé dans l’interface admin lors d’une promotion vers admin.')
  } else {
    log('Mot de passe local', 'MOXT_ADMIN_PROMOTE_PASSWORD déjà défini')
  }

  const supabaseEnv = {
    ...process.env,
    SUPABASE_ACCESS_TOKEN:
      process.env.SUPABASE_ACCESS_TOKEN || vars.SUPABASE_ACCESS_TOKEN || '',
  }

  if (!supabaseEnv.SUPABASE_ACCESS_TOKEN) {
    console.error('\n✗ SUPABASE_ACCESS_TOKEN manquant (scripts/phase2.env ou variable d’environnement).')
    process.exit(1)
  }

  log('Déploiement', 'admin-promote-role')
  // JWT vérifié dans la fonction (getUser) — évite l’échec opaque CORS du gateway.
  if (
    runSupabase(
      ['functions', 'deploy', 'admin-promote-role', '--no-verify-jwt'],
      supabaseEnv,
    ) !== 0
  ) {
    process.exit(1)
  }

  log('Secrets Edge Function', 'MOXT_ADMIN_PROMOTE_PASSWORD')
  if (
    runSupabase(
      ['secrets', 'set', `MOXT_ADMIN_PROMOTE_PASSWORD=${password}`, '--project-ref', 'rbvqfkccbkwjxkvpnwqn'],
      supabaseEnv,
    ) !== 0
  ) {
    process.exit(1)
  }

  console.log('\n══════════════════════════════════════')
  console.log('  Promotion admin verrouillée')
  console.log('══════════════════════════════════════')
  console.log('\n  Où remplir le mot de passe :')
  console.log('    • Fichier local : scripts/phase2.env')
  console.log('      MOXT_ADMIN_PROMOTE_PASSWORD=...')
  console.log('    • Interface : demandé au clic « admin » (superadmin uniquement)')
  console.log('\n  Resynchroniser après changement : npm run setup:admin-promote\n')
}

main()
