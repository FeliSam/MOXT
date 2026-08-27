#!/usr/bin/env node
/**
 * Pose les secrets media-api et déploie la Edge Function.
 * Usage: node scripts/setup-media-api.mjs
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
  const accessKey =
    vars.MOXT_YC_S3_ACCESS_KEY_ID || vars.YC_SNS_ACCESS_KEY_ID || process.env.YC_SNS_ACCESS_KEY_ID
  const secretKey =
    vars.MOXT_YC_S3_SECRET_ACCESS_KEY ||
    vars.YC_SNS_SECRET_ACCESS_KEY ||
    process.env.YC_SNS_SECRET_ACCESS_KEY
  const token = vars.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN

  if (!accessKey || !secretKey) {
    console.error('✗ Clés S3 Yandex manquantes (YC_SNS_* ou MOXT_YC_S3_* dans phase2.env)')
    process.exit(1)
  }
  if (!token) {
    console.error('✗ SUPABASE_ACCESS_TOKEN manquant dans phase2.env')
    process.exit(1)
  }

  const env = {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: token,
  }

  console.log('▸ Liaison projet Supabase…')
  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], env) !== 0) {
    process.exit(1)
  }

  const secrets = [
    ['YANDEX_S3_ACCESS_KEY_ID', accessKey],
    ['YANDEX_S3_SECRET_ACCESS_KEY', secretKey],
    ['YANDEX_S3_ENDPOINT', 'https://storage.yandexcloud.net'],
    ['YANDEX_S3_REGION', 'ru-central1'],
    ['YANDEX_S3_PUBLIC_BUCKET', vars.MOXT_MEDIA_PUBLIC_BUCKET || 'moxt-public'],
    ['YANDEX_S3_PRIVATE_BUCKET', vars.MOXT_MEDIA_PRIVATE_BUCKET || 'moxt-private'],
    ['MOXT_MEDIA_CDN_BASE', vars.MOXT_MEDIA_CDN_BASE || 'https://cdn.moxtapp.ru'],
  ]

  for (const [name, value] of secrets) {
    console.log(`▸ Secret ${name}…`)
    const code = runSupabase(['secrets', 'set', `${name}=${value}`, '--project-ref', projectRef], env)
    if (code !== 0) {
      console.error(`✗ Échec secret ${name}`)
      process.exit(code)
    }
  }

  console.log('▸ Déploiement media-api…')
  const deployCode = runSupabase(['functions', 'deploy', 'media-api', '--project-ref', projectRef], env)
  if (deployCode !== 0) process.exit(deployCode)

  console.log('\n✓ media-api déployée avec secrets Yandex.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
