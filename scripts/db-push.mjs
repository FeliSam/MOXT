#!/usr/bin/env node
/**
 * Applique les migrations Supabase sur le projet lié.
 * Contourne uv_spawn Windows : utilise le CLI local (node_modules/supabase) + phase2.env.
 *
 * Usage :
 *   npm run db:push
 *   node scripts/db-push.mjs --password VOTRE_MOT_DE_PASSE_DB
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const projectRef = 'rbvqfkccbkwjxkvpnwqn'
const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')

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

function runNodeSupabase(args, env, { input } = {}) {
  if (!existsSync(supabaseJs)) {
    console.error('\n✗ CLI Supabase introuvable. Lancez : npm install')
    return 1
  }
  const result = spawnSync(process.execPath, [supabaseJs, ...args], {
    cwd: root,
    stdio: input ? ['pipe', 'inherit', 'inherit'] : 'inherit',
    env,
    input: input || undefined,
  })
  return result.status ?? 1
}

function passwordFromArgs() {
  const idx = process.argv.indexOf('--password')
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]
  return process.env.SUPABASE_DB_PASSWORD || process.env.MOXT_SUPABASE_DB_PASSWORD || ''
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — migrations Supabase (db push)')
  console.log('══════════════════════════════════════')

  const vars = existsSync(envPath) ? parseEnvFile(envPath) : {}
  const dbPassword = passwordFromArgs() || vars.SUPABASE_DB_PASSWORD || vars.MOXT_SUPABASE_DB_PASSWORD

  const env = {
    ...process.env,
    SUPABASE_ACCESS_TOKEN:
      process.env.SUPABASE_ACCESS_TOKEN || vars.SUPABASE_ACCESS_TOKEN || '',
    MOXT_POSTBOX_SMTP_USER: vars.MOXT_POSTBOX_SMTP_USER || process.env.MOXT_POSTBOX_SMTP_USER,
    MOXT_POSTBOX_SMTP_PASS: vars.MOXT_POSTBOX_SMTP_PASS || process.env.MOXT_POSTBOX_SMTP_PASS,
    MOXT_POSTBOX_FROM: vars.MOXT_POSTBOX_FROM || process.env.MOXT_POSTBOX_FROM,
    SEND_SMS_HOOK_SECRET: vars.SEND_SMS_HOOK_SECRET || process.env.SEND_SMS_HOOK_SECRET,
  }

  if (dbPassword) {
    env.SUPABASE_DB_PASSWORD = dbPassword
  }

  log('Supabase — liaison projet')
  if (runNodeSupabase(['link', '--project-ref', projectRef, '--yes'], env) !== 0) {
    process.exit(1)
  }

  if (!dbPassword) {
    console.error('\n✗ Mot de passe base de données requis pour db push.')
    console.error('  Dashboard Supabase → Project Settings → Database → Database password')
    console.error('\n  Puis :')
    console.error('    $env:SUPABASE_DB_PASSWORD="votre_mot_de_passe"; npm run db:push')
    console.error('  Ou ajoutez SUPABASE_DB_PASSWORD dans scripts/phase2.env ou secrets GitHub')
    process.exit(1)
  }

  const isCi = Boolean(process.env.CI || process.env.GITHUB_ACTIONS)
  if (isCi && !env.SUPABASE_ACCESS_TOKEN) {
    console.error('\n✗ SUPABASE_ACCESS_TOKEN requis pour db push en CI.')
    console.error('  https://supabase.com/dashboard/account/tokens')
    console.error('  Puis : npm run setup:github-secrets')
    process.exit(1)
  }

  log('Migrations', 'supabase/migrations → projet distant')
  const code = runNodeSupabase(['db', 'push', '--linked', '--yes', '--include-all'], env, {
    input: 'y\n',
  })
  if (code !== 0) {
    console.error('\n✗ db push échoué.')
    console.error('  Alternatives :')
    console.error('  - WSL : wsl -e npm run db:push')
    console.error('  - SQL Editor : copier les fichiers supabase/migrations/*.sql non appliqués')
    process.exit(code)
  }

  console.log('\n✓ Migrations appliquées.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
