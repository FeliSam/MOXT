#!/usr/bin/env node
/**
 * LibreTranslate self-hosted — traduction P2P MOXT (budget zéro API).
 *
 * Prérequis :
 *   1. VM Yandex avec Docker
 *   2. scripts/phase2.env → LIBRETRANSLATE_URL=http://…:5000
 *   3. SUPABASE_ACCESS_TOKEN dans phase2.env
 *
 * Lance : npm run setup:libretranslate
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
  }
}

async function checkLibreTranslate(url, apiKey = '') {
  const base = String(url || '').trim().replace(/\/+$/, '')
  if (!base) return { ok: false, detail: 'URL vide' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12_000)
  try {
    const headers = { Accept: 'application/json' }
    if (apiKey) headers['X-API-Key'] = apiKey
    const response = await fetch(`${base}/languages`, {
      signal: controller.signal,
      headers,
    })
    if (!response.ok) {
      return { ok: false, detail: `HTTP ${response.status}` }
    }
    const data = await response.json().catch(() => null)
    if (!Array.isArray(data)) {
      return { ok: false, detail: 'Réponse /languages invalide' }
    }
    const codes = data.map((entry) => String(entry?.code || entry).toLowerCase())
    const required = ['fr', 'en', 'ru', 'pt', 'es']
    const missing = required.filter((code) => !codes.includes(code))
    if (missing.length) {
      return { ok: true, detail: `OK mais langues manquantes : ${missing.join(', ')}` }
    }
    return { ok: true, detail: `OK (${required.join(', ')})` }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return { ok: false, detail: aborted ? 'Timeout' : String(err?.message || err) }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — LibreTranslate (traduction P2P)')
  console.log('══════════════════════════════════════')

  log('Infra Docker (VM Yandex)', [
    'docker run -d --name libretranslate --restart unless-stopped \\',
    '  -p 5000:5000 libretranslate/libretranslate \\',
    '  --load-only fr,en,ru,pt,es',
    '',
    'Restreindre le firewall aux IP sortantes Supabase Edge.',
  ].join('\n  '))

  const vars = parseEnvFile(envPath)
  const ltUrl = (process.env.LIBRETRANSLATE_URL || vars.LIBRETRANSLATE_URL || '').trim()
  const ltKey = (process.env.LIBRETRANSLATE_API_KEY || vars.LIBRETRANSLATE_API_KEY || '').trim()

  if (!ltUrl || ltUrl.includes('10.x.x.x')) {
    console.error('\n✗ LIBRETRANSLATE_URL manquant dans scripts/phase2.env')
    console.error('  Exemple : LIBRETRANSLATE_URL=http://10.0.0.5:5000')
    process.exit(1)
  }

  log('Healthcheck', ltUrl)
  const health = await checkLibreTranslate(ltUrl, ltKey)
  if (!health.ok) {
    console.error(`\n✗ LibreTranslate injoignable : ${health.detail}`)
    console.error('  Vérifiez Docker, le firewall et l’URL.')
    process.exit(1)
  }
  log('LibreTranslate', health.detail)

  const supabaseEnv = buildSupabaseEnv(vars)
  if (!supabaseEnv.SUPABASE_ACCESS_TOKEN) {
    console.error('\n✗ SUPABASE_ACCESS_TOKEN manquant (scripts/phase2.env)')
    console.error('  https://supabase.com/dashboard/account/tokens')
    process.exit(1)
  }

  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], supabaseEnv) !== 0) {
    console.error('\n✗ Liaison Supabase échouée.')
    process.exit(1)
  }

  log('Migration', 'message_translations')
  if (process.env.MOXT_SKIP_DB_PUSH !== '1') {
    const push = spawnSync('npm', ['run', 'db:push'], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: supabaseEnv,
    })
    if ((push.status ?? 1) !== 0) {
      console.error('\n✗ db:push échoué — corrigez puis relancez.')
      process.exit(1)
    }
  }

  log('Secrets Supabase', 'LIBRETRANSLATE_URL')
  if (
    runSupabase(
      ['secrets', 'set', `LIBRETRANSLATE_URL=${ltUrl}`, '--project-ref', projectRef],
      supabaseEnv,
    ) !== 0
  ) {
    console.error('\n✗ secrets set LIBRETRANSLATE_URL échoué.')
    process.exit(1)
  }

  if (ltKey) {
    log('Secrets Supabase', 'LIBRETRANSLATE_API_KEY')
    if (
      runSupabase(
        ['secrets', 'set', `LIBRETRANSLATE_API_KEY=${ltKey}`, '--project-ref', projectRef],
        supabaseEnv,
      ) !== 0
    ) {
      console.error('\n✗ secrets set LIBRETRANSLATE_API_KEY échoué.')
      process.exit(1)
    }
  }

  log('Edge Function', 'translate-message')
  if (
    runSupabase(
      ['functions', 'deploy', 'translate-message', '--project-ref', projectRef],
      supabaseEnv,
    ) !== 0
  ) {
    console.error('\n✗ Deploy translate-message échoué.')
    process.exit(1)
  }

  console.log('\n✓ LibreTranslate configuré pour la traduction P2P.')
  console.log('  Test : compte admin → Messages → appui long sur un message → icône globe.')
  console.log('  Front : npm run cpd (ou web:deploy:yandex) après validation.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
