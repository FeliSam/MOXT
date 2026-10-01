#!/usr/bin/env node
/**
 * Migration batch Supabase Storage → Yandex Object Storage + backfill media_objects.
 *
 * Schema note (20260827100000_media_objects.sql): owner_id is NOT NULL + FK auth.users.
 * When the guessed owner UUID is missing from auth.users, we still keep the S3 object and
 * skip the media_objects row (null owner is not allowed without a follow-up migration).
 *
 * Usage:
 *   set -a; source scripts/phase2.yandex-media.env; set +a
 *   node scripts/migrate-supabase-to-yandex.mjs --dry-run --bucket=videos --limit=20
 *   node scripts/migrate-supabase-to-yandex.mjs --bucket=videos --limit=200
 *   node scripts/migrate-supabase-to-yandex.mjs --bucket=listings --limit=500 --rewrite-urls
 *   node scripts/migrate-supabase-to-yandex.mjs --rewrite-urls-only --tables=videos,listings --limit=200
 */
import { createClient } from '@supabase/supabase-js'
import { Upload } from '@aws-sdk/lib-storage'
import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'node:stream'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SUPABASE_STORAGE_BUCKETS,
  MEDIA_KIND_BY_LEGACY_BUCKET,
} from '../packages/shared/src/media/storageAudit.js'
import {
  legacyPathToObjectKey,
  inferEntityFromLegacyBucket,
  yandexBucketForObjectKey,
  buildPublicMediaUrl,
} from '../packages/shared/src/media/objectKeys.js'
import {
  createStorageS3Client,
  ensureS3Credentials,
  contentTypeForKey,
} from './lib/yandex-s3.mjs'
import { loadPhase2Env } from './lib/env.mjs'
import { rewriteLiveContentUrls } from './lib/rewrite-content-urls.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'rbvqfkccbkwjxkvpnwqn'
const CDN_BASE = (process.env.MOXT_MEDIA_CDN_BASE || 'https://cdn.moxtapp.ru').replace(/\/+$/, '')

const SECRET_ENV_FILES = [
  'phase2.yandex-media.env',
  'phase2.supabase-secrets.env',
  'phase2.env',
]

function parseArgs(argv) {
  const out = { limit: 100, offset: 0 }
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

/** Merge local secret env files into process.env without printing values. */
function loadSecretEnvFiles() {
  const merged = { ...loadPhase2Env() }
  for (const name of SECRET_ENV_FILES) {
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

/**
 * Walk Supabase storage but stop once we have offset+limit file objects.
 */
async function listSupabaseObjects(supabase, bucket, { limit, offset }) {
  const need = Math.max(0, Number(offset) || 0) + Math.max(1, Number(limit) || 100)
  const objects = []
  let listedFolders = 0

  async function walk(prefix) {
    if (objects.length >= need) return
    const { data, error } = await supabase.storage.from(bucket).list(prefix || '', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw new Error(error.message)
    listedFolders += 1
    if (listedFolders === 1 || listedFolders % 25 === 0) {
      console.log(`  … listing (${objects.length}/${need} files, folders=${listedFolders})`)
    }
    for (const entry of data || []) {
      if (objects.length >= need) return
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id) {
        objects.push({ path: fullPath, metadata: entry.metadata })
      } else {
        await walk(fullPath)
      }
    }
  }

  await walk('')
  return objects.slice(offset, offset + limit)
}

async function downloadSupabaseObject(supabase, bucket, objectPath) {
  const { data, error } = await supabase.storage.from(bucket).download(objectPath)
  if (error) throw new Error(error.message)
  return data
}

async function uploadToYandex(s3, bucketName, objectKey, body, mimeType) {
  const stream = body instanceof Blob ? Readable.fromWeb(body.stream()) : body
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucketName,
      Key: objectKey,
      Body: stream,
      ContentType: mimeType || contentTypeForKey(objectKey),
      CacheControl: objectKey.startsWith('public/')
        ? 'public, max-age=31536000, immutable'
        : 'private, max-age=3600',
    },
  })
  await upload.done()
}

function isOwnerFkError(message) {
  const msg = String(message || '').toLowerCase()
  return (
    msg.includes('media_objects_owner_id_fkey') ||
    (msg.includes('owner_id') && (msg.includes('foreign key') || msg.includes('violates')))
  )
}

async function ownerExists(admin, ownerId, cache) {
  if (!ownerId) return false
  if (cache.has(ownerId)) return cache.get(ownerId)
  const { data, error } = await admin.from('profiles').select('id').eq('id', ownerId).maybeSingle()
  let ok = Boolean(data?.id) && !error
  if (!ok) {
    try {
      const { data: userData, error: userErr } = await admin.auth.admin.getUserById(ownerId)
      ok = Boolean(userData?.user?.id) && !userErr
    } catch {
      ok = false
    }
  }
  cache.set(ownerId, ok)
  return ok
}

async function backfillMediaObject(admin, row) {
  const { error } = await admin.from('media_objects').upsert(row, {
    onConflict: 'bucket,object_key',
    ignoreDuplicates: false,
  })
  if (error) throw new Error(error.message)
}

function guessOwnerId(legacyPath) {
  const first = String(legacyPath || '').split('/')[0]
  return /^[0-9a-f-]{36}$/i.test(first) ? first : null
}

async function migrateBucket({
  supabase,
  admin,
  s3,
  bucket,
  dryRun,
  limit,
  offset,
  ownerCache,
  uploadedKeys,
}) {
  const meta = SUPABASE_STORAGE_BUCKETS.find((b) => b.id === bucket)
  if (!meta) throw new Error(`Bucket inconnu: ${bucket}`)

  console.log(`\n=== ${bucket} (${meta.visibility}) ===`)
  console.log(`  listing up to limit=${limit} (offset=${offset})…`)
  const objects = await listSupabaseObjects(supabase, bucket, { limit, offset })
  console.log(`  ${objects.length} objet(s) à traiter`)

  let migrated = 0
  let uploadedNoRegistry = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < objects.length; i += 1) {
    const obj = objects[i]
    const legacyPath = obj.path
    const objectKey = legacyPathToObjectKey(bucket, legacyPath)
    const yandexBucket = yandexBucketForObjectKey(objectKey)
    const guessedOwner = guessOwnerId(legacyPath)
    const progress = `[${i + 1}/${objects.length}]`

    if (dryRun) {
      console.log(`  ${progress} [dry-run] ${legacyPath} → ${yandexBucket}/${objectKey}`)
      migrated += 1
      continue
    }

    try {
      console.log(`  ${progress} download ${legacyPath}`)
      const blob = await downloadSupabaseObject(supabase, bucket, legacyPath)
      const mimeType = blob.type || contentTypeForKey(objectKey)
      console.log(`  ${progress} upload s3://${yandexBucket}/${objectKey} (${blob.size || '?'} B)`)
      await uploadToYandex(s3, yandexBucket, objectKey, blob, mimeType)
      uploadedKeys.add(objectKey)

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(legacyPath)
      const publicUrl =
        meta.visibility === 'public' ? buildPublicMediaUrl(objectKey, CDN_BASE) : null

      const inferred = inferEntityFromLegacyBucket(bucket, legacyPath)
      const visibility = objectKey.startsWith('private/') ? 'private' : 'public'

      let ownerId = null
      if (guessedOwner && (await ownerExists(admin, guessedOwner, ownerCache))) {
        ownerId = guessedOwner
      } else if (guessedOwner) {
        console.warn(
          `  ${progress} ⚠ owner ${guessedOwner} absent de auth/profiles — S3 OK, skip media_objects`,
        )
      } else {
        console.warn(`  ${progress} ⚠ owner inconnu dans le chemin — S3 OK, skip media_objects`)
      }

      if (!ownerId) {
        uploadedNoRegistry += 1
        continue
      }

      try {
        await backfillMediaObject(admin, {
          owner_id: ownerId,
          kind: MEDIA_KIND_BY_LEGACY_BUCKET[bucket] || 'image',
          visibility,
          bucket: yandexBucket,
          object_key: objectKey,
          mime_type: mimeType || contentTypeForKey(objectKey),
          byte_size: blob.size,
          entity_type: inferred.entityType,
          entity_id: inferred.entityId,
          status: 'ready',
          legacy_supabase_bucket: bucket,
          legacy_supabase_path: legacyPath,
          legacy_supabase_url: pub?.publicUrl || null,
          public_url: publicUrl,
        })
        migrated += 1
        if (migrated % 10 === 0) {
          console.log(
            `  … progress: migrated=${migrated} no_registry=${uploadedNoRegistry} failed=${failed}`,
          )
        }
      } catch (bfErr) {
        const msg = bfErr instanceof Error ? bfErr.message : String(bfErr)
        if (isOwnerFkError(msg)) {
          console.warn(`  ${progress} ⚠ media_objects FK (${msg}) — S3 conservé, registry skip`)
          uploadedNoRegistry += 1
        } else {
          throw bfErr
        }
      }
    } catch (error) {
      failed += 1
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`  ✗ ${legacyPath}: ${msg}`)
    }
  }

  return { migrated, uploadedNoRegistry, skipped, failed }
}

async function s3ObjectExists(s3, bucketName, objectKey, cache) {
  const cacheKey = `${bucketName}:${objectKey}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: objectKey }))
    cache.set(cacheKey, true)
    return true
  } catch {
    cache.set(cacheKey, false)
    return false
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const dryRun = Boolean(args['dry-run'])
  const rewriteUrls = Boolean(args['rewrite-urls']) || Boolean(args['rewrite-urls-only'])
  const rewriteOnly = Boolean(args['rewrite-urls-only'])
  const limit = Number(args.limit) || 100
  const offset = Number(args.offset) || 0
  const bucketArg = args.bucket
  const tablesArg = args.tables
    ? String(args.tables)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null

  console.log('Loading env (phase2.yandex-media.env / phase2.env / secrets)…')
  const fileEnv = loadSecretEnvFiles()

  const supabaseUrl = process.env.VITE_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`
  const serviceRole = await resolveServiceRoleKey(fileEnv)
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const admin = supabase

  let s3 = null
  if (!dryRun || rewriteUrls) {
    const creds = ensureS3Credentials({ allowEphemeral: true })
    if (!creds && !dryRun && !rewriteOnly) {
      throw new Error('Credentials Yandex S3 manquants (MOXT_YC_S3_* dans phase2.yandex-media.env)')
    }
    if (creds) s3 = createStorageS3Client(creds)
  }

  const uploadedKeys = new Set()
  const ownerCache = new Map()
  let totals = { migrated: 0, uploadedNoRegistry: 0, skipped: 0, failed: 0 }

  if (!rewriteOnly) {
    const buckets = bucketArg ? [bucketArg] : SUPABASE_STORAGE_BUCKETS.map((b) => b.id)

    for (const bucket of buckets) {
      const result = await migrateBucket({
        supabase,
        admin,
        s3,
        bucket,
        dryRun,
        limit,
        offset,
        ownerCache,
        uploadedKeys,
      })
      totals.migrated += result.migrated
      totals.uploadedNoRegistry += result.uploadedNoRegistry
      totals.skipped += result.skipped
      totals.failed += result.failed
    }

    console.log(
      `\nUpload terminé — migrés+registry: ${totals.migrated}, S3 sans registry: ${totals.uploadedNoRegistry}, ignorés: ${totals.skipped}, échecs: ${totals.failed}`,
    )
    if (dryRun) console.log('(dry-run — aucun fichier copié)')
  }

  if (rewriteUrls && !dryRun) {
    const headCache = new Map()
    console.log('\n=== Rewrite URLs Supabase → CDN ===')
    const rewriteResult = await rewriteLiveContentUrls({
      admin,
      cdnBase: CDN_BASE,
      tables: tablesArg,
      limit,
      dryRun: false,
      shouldRewrite: async ({ objectKey, yandexBucket }) => {
        if (uploadedKeys.has(objectKey)) return true
        if (!s3) {
          try {
            const url = buildPublicMediaUrl(objectKey, CDN_BASE)
            const res = await fetch(url, { method: 'HEAD' })
            return res.ok
          } catch {
            return false
          }
        }
        return s3ObjectExists(s3, yandexBucket || 'moxt-public', objectKey, headCache)
      },
    })
    console.log(
      `Rewrite terminé — updated: ${rewriteResult.updated}, skipped(no CDN): ${rewriteResult.skippedMissing}, scanned: ${rewriteResult.scanned}`,
    )
  } else if (rewriteUrls && dryRun) {
    console.log('\n=== Rewrite URLs (dry-run) ===')
    const rewriteResult = await rewriteLiveContentUrls({
      admin,
      cdnBase: CDN_BASE,
      tables: tablesArg,
      limit,
      dryRun: true,
      shouldRewrite: async () => true,
    })
    console.log(
      `Rewrite dry-run — would update: ${rewriteResult.updated}, scanned: ${rewriteResult.scanned}`,
    )
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
