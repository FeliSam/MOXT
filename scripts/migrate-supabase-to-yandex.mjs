#!/usr/bin/env node
/**
 * Migration batch Supabase Storage → Yandex Object Storage + backfill media_objects.
 *
 * Usage:
 *   node scripts/migrate-supabase-to-yandex.mjs --dry-run
 *   node scripts/migrate-supabase-to-yandex.mjs --bucket=avatars
 *   node scripts/migrate-supabase-to-yandex.mjs --bucket=listings --limit=200 --offset=0
 */
import { createClient } from '@supabase/supabase-js'
import { Upload } from '@aws-sdk/lib-storage'
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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'rbvqfkccbkwjxkvpnwqn'
const CDN_BASE = (process.env.MOXT_MEDIA_CDN_BASE || 'https://cdn.moxtapp.ru').replace(/\/+$/, '')

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

async function resolveServiceRoleKey() {
  const env = { ...loadPhase2Env(), ...parseEnvFile(path.join(root, 'scripts', 'phase2.supabase-secrets.env')) }
  if (env.SUPABASE_SERVICE_ROLE_KEY) return env.SUPABASE_SERVICE_ROLE_KEY
  const token = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN
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

async function listSupabaseObjects(supabase, bucket, { limit, offset }) {
  const folder = ''
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error) throw new Error(error.message)

  const objects = []
  async function walk(prefix, entries) {
    for (const entry of entries || []) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id) {
        objects.push({ path: fullPath, metadata: entry.metadata })
      } else {
        const { data: nested } = await supabase.storage.from(bucket).list(fullPath, { limit: 1000 })
        await walk(fullPath, nested || [])
      }
    }
  }
  await walk('', data || [])
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

async function backfillMediaObject(admin, {
  ownerId,
  legacyBucket,
  legacyPath,
  objectKey,
  yandexBucket,
  mimeType,
  byteSize,
  publicUrl,
  legacyPublicUrl,
}) {
  const inferred = inferEntityFromLegacyBucket(legacyBucket, legacyPath)
  const visibility = objectKey.startsWith('private/') ? 'private' : 'public'
  const { error } = await admin.from('media_objects').upsert(
    {
      owner_id: ownerId,
      kind: MEDIA_KIND_BY_LEGACY_BUCKET[legacyBucket] || 'image',
      visibility,
      bucket: yandexBucket,
      object_key: objectKey,
      mime_type: mimeType || contentTypeForKey(objectKey),
      byte_size: byteSize,
      entity_type: inferred.entityType,
      entity_id: inferred.entityId,
      status: 'ready',
      legacy_supabase_bucket: legacyBucket,
      legacy_supabase_path: legacyPath,
      legacy_supabase_url: legacyPublicUrl,
      public_url: publicUrl,
    },
    { onConflict: 'bucket,object_key', ignoreDuplicates: false },
  )
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
}) {
  const meta = SUPABASE_STORAGE_BUCKETS.find((b) => b.id === bucket)
  if (!meta) throw new Error(`Bucket inconnu: ${bucket}`)

  console.log(`\n=== ${bucket} (${meta.visibility}) ===`)
  const objects = await listSupabaseObjects(supabase, bucket, { limit, offset })
  console.log(`  ${objects.length} objet(s) (offset=${offset}, limit=${limit})`)

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const obj of objects) {
    const legacyPath = obj.path
    const objectKey = legacyPathToObjectKey(bucket, legacyPath)
    const yandexBucket = yandexBucketForObjectKey(objectKey)
    const ownerId = guessOwnerId(legacyPath)

    if (dryRun) {
      console.log(`  [dry-run] ${legacyPath} → ${yandexBucket}/${objectKey}`)
      migrated += 1
      continue
    }

    if (!ownerId) {
      console.warn(`  ⚠ skip (owner inconnu): ${legacyPath}`)
      skipped += 1
      continue
    }

    try {
      const blob = await downloadSupabaseObject(supabase, bucket, legacyPath)
      const mimeType = blob.type || contentTypeForKey(objectKey)
      await uploadToYandex(s3, yandexBucket, objectKey, blob, mimeType)

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(legacyPath)
      const publicUrl =
        meta.visibility === 'public' ? buildPublicMediaUrl(objectKey, CDN_BASE) : null

      await backfillMediaObject(admin, {
        ownerId,
        legacyBucket: bucket,
        legacyPath,
        objectKey,
        yandexBucket,
        mimeType,
        byteSize: blob.size,
        publicUrl,
        legacyPublicUrl: pub?.publicUrl || null,
      })

      migrated += 1
      if (migrated % 25 === 0) console.log(`  … ${migrated} migrés`)
    } catch (error) {
      failed += 1
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`  ✗ ${legacyPath}: ${msg}`)
    }
  }

  return { migrated, skipped, failed }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const dryRun = Boolean(args['dry-run'])
  const limit = Number(args.limit) || 100
  const offset = Number(args.offset) || 0
  const bucketArg = args.bucket

  const supabaseUrl = process.env.VITE_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`
  const serviceRole = await resolveServiceRoleKey()
  const supabase = createClient(supabaseUrl, serviceRole)
  const admin = supabase

  let s3 = null
  if (!dryRun) {
    const creds = ensureS3Credentials({ allowEphemeral: true })
    if (!creds) throw new Error('Credentials Yandex S3 manquants (MOXT_YC_S3_*)')
    s3 = createStorageS3Client(creds)
  }

  const buckets = bucketArg
    ? [bucketArg]
    : SUPABASE_STORAGE_BUCKETS.map((b) => b.id)

  let totals = { migrated: 0, skipped: 0, failed: 0 }
  for (const bucket of buckets) {
    const result = await migrateBucket({
      supabase,
      admin,
      s3,
      bucket,
      dryRun,
      limit,
      offset,
    })
    totals.migrated += result.migrated
    totals.skipped += result.skipped
    totals.failed += result.failed
  }

  console.log(`\nTerminé — migrés: ${totals.migrated}, ignorés: ${totals.skipped}, échecs: ${totals.failed}`)
  if (dryRun) console.log('(dry-run — aucun fichier copié)')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
