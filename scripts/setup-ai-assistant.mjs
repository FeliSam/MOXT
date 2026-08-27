#!/usr/bin/env node
/**
 * Secrets + déploiement Edge Function ai-assistant (Yandex GPT / AI Studio).
 *
 * Usage:
 *   node scripts/setup-ai-assistant.mjs
 *
 * Clé à mettre dans scripts/phase2.env :
 *   MOXT_YANDEX_AI_API_KEY=Api-Key ...   (depuis Yandex Cloud → AI Studio)
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const projectRef = 'rbvqfkccbkwjxkvpnwqn'
const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')

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
  const result = spawnSync(process.execPath, [supabaseJs, ...args], {
    cwd: root,
    stdio: 'inherit',
    env,
  })
  return result.status ?? 1
}

async function main() {
  const vars = parseEnvFile(envPath)
  const apiKey =
    process.env.MOXT_YANDEX_AI_API_KEY ||
    process.env.YANDEX_AI_API_KEY ||
    vars.MOXT_YANDEX_AI_API_KEY ||
    vars.YANDEX_AI_API_KEY
  const token = vars.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN

  if (!apiKey) {
    console.error('✗ MOXT_YANDEX_AI_API_KEY manquante dans scripts/phase2.env')
    console.error('  Yandex Cloud → AI Studio → API keys')
    process.exit(1)
  }
  if (!token) {
    console.error('✗ SUPABASE_ACCESS_TOKEN manquant dans scripts/phase2.env')
    process.exit(1)
  }

  const env = { ...process.env, SUPABASE_ACCESS_TOKEN: token }
  const folderId = vars.YANDEX_AI_FOLDER_ID || 'b1gmns3k9udjtgk89c9i'
  const promptId = vars.YANDEX_AI_PROMPT_ID || 'fvtkqqlnba09snlpt1k4'

  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], env) !== 0) process.exit(1)

  const secrets = [
    ['YANDEX_AI_API_KEY', apiKey],
    ['YANDEX_AI_FOLDER_ID', folderId],
    ['YANDEX_AI_PROMPT_ID', promptId],
    ['YANDEX_AI_BASE_URL', 'https://ai.api.cloud.yandex.net/v1'],
  ]

  for (const [name, value] of secrets) {
    console.log(`▸ Secret ${name}…`)
    if (runSupabase(['secrets', 'set', `${name}=${value}`, '--project-ref', projectRef], env) !== 0) {
      process.exit(1)
    }
  }

  console.log('▸ Déploiement ai-assistant…')
  if (runSupabase(['functions', 'deploy', 'ai-assistant', '--project-ref', projectRef], env) !== 0) {
    process.exit(1)
  }

  console.log('\n✓ ai-assistant déployée (fallback assistant MOXT).')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
