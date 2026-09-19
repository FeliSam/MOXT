#!/usr/bin/env node
/**
 * Rewrite live DB content URLs from Supabase Storage → https://cdn.moxtapp.ru/...
 * Prefer rows whose object already exists on Yandex/CDN (HEAD check).
 *
 * Usage:
 *   set -a; source scripts/phase2.yandex-media.env; set +a
 *   node scripts/rewrite-supabase-urls-to-cdn.mjs --dry-run --tables=videos --limit=50
 *   node scripts/rewrite-supabase-urls-to-cdn.mjs --tables=videos,listings --limit=500
 */
import { createClient } from '@supabase/supabase-js'
import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPublicMediaUrl } from '../packages/shared/src/media/objectKeys.js'
import { createStorageS3Client, ensureS3Credentials } from './lib/yandex-s3.mjs'
import { loadPhase2Env } from './lib/env.mjs'
import { rewriteLiveContentUrls } from './lib/rewrite-content-urls.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'rbvqfkccbkwjxkvpnwqn'
const CDN_BASE = (process.env.MOXT_MEDIA_CDN_BASE || 'https://cdn.moxtapp.ru').replace(/\/+$/, '')

function parseArgs(argv) {
  const out = { limit: 200 }
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue
    const eq = arg.indexOf('=')
    if (eq < 0) out[arg.slice(2)] = true
    else out[arg.slice(2, eq)] = arg.slice(eq + 1)
  }
  return out
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const vars = {}
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return vars
}

function loadSecretEnvFiles() {
  const merged = { ...loadPhase2Env() }
  for (const name of ['phase2.yandex-media.env', 'phase2.supabase-secrets.env', 'phase2.env']) {
    Object.assign(merged, parseEnvFile(path.join(root, 'scripts', name)))
  }
  for (const [key, value] of Object.entries(merged)) {
    if (value && !process.env[key]) process.env[key] = value
  }
  return merged
}

async function resolveServiceRoleKey(fileEnv) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY
  }
  const token = process.env.SUPABASE_ACCESS_TOKEN || fileEnv.SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN ou SUPABASE_SERVICE_ROLE_KEY requis')
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`api-keys HTTP ${res.status}`)
  const keys = await res.json()
  const list = Array.isArray(keys) ? keys : keys?.api_keys || []
  const service = list.find((k) => k.name === 'service_role' || k.type === 'service_role')
  const key = service?.api_key || service?.key
  if (!key) throw new Error('service_role introuvable')
  return key
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const dryRun = Boolean(args['dry-run'])
  const limit = Number(args.limit) || 200
  const tables = args.tables
    ? String(args.tables)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null
  const requireCdn = args['skip-cdn-check'] ? false : true

  console.log('Loading env…')
  const fileEnv = loadSecretEnvFiles()
  const supabaseUrl = process.env.VITE_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`
  const serviceRole = await resolveServiceRoleKey(fileEnv)
  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let s3 = null
  const creds = ensureS3Credentials({ allowEphemeral: true })
  if (creds) s3 = createStorageS3Client(creds)
  const headCache = new Map()

  const result = await rewriteLiveContentUrls({
    admin,
    cdnBase: CDN_BASE,
    tables,
    limit,
    dryRun,
    shouldRewrite: async ({ objectKey, yandexBucket }) => {
      if (!requireCdn) return true
      if (s3) {
        const cacheKey = `${yandexBucket}:${objectKey}`
        if (headCache.has(cacheKey)) return headCache.get(cacheKey)
        try {
          await s3.send(new HeadObjectCommand({ Bucket: yandexBucket, Key: objectKey }))
          headCache.set(cacheKey, true)
          return true
        } catch {
          headCache.set(cacheKey, false)
          return false
        }
      }
      try {
        const url = buildPublicMediaUrl(objectKey, CDN_BASE)
        const res = await fetch(url, { method: 'HEAD' })
        return res.ok
      } catch {
        return false
      }
    },
  })

  console.log(
    `\nTerminé — scanned=${result.scanned} updated=${result.updated} skippedMissing=${result.skippedMissing}${dryRun ? ' (dry-run)' : ''}`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
