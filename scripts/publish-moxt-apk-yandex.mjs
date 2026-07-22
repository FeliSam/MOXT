#!/usr/bin/env node
/**
 * Publie Moxt.apk sur le bucket Yandex (CDN moxtapp.ru) + enregistrement app_releases.
 * Contourne les resets réseau vers Supabase Storage pour les gros APK.
 */
import { createClient } from '@supabase/supabase-js'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { Upload } from '@aws-sdk/lib-storage'
import { S3Client } from '@aws-sdk/client-s3'
import {
  ensureS3Credentials,
  resolveWritableS3Client,
} from './lib/yandex-s3.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = 'rbvqfkccbkwjxkvpnwqn'
const BUCKET = process.env.MOXT_YC_BUCKET || 'moxtapp-web'
const APK_PATH = path.join(root, 'releases', 'Moxt-1.2.1-release.apk')
const OBJECT_KEY = 'downloads/Moxt.apk'
const PUBLIC_URL = `https://moxtapp.ru/${OBJECT_KEY}`
const APK_VERSION = '1.2.1'
const DOWNLOAD_NAME = 'Moxt.apk'

function parseEnv(filePath) {
  const vars = {}
  if (!existsSync(filePath)) return vars
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    vars[trimmed.slice(0, eq).trim()] = value
  }
  return vars
}

async function getServiceRoleKey(accessToken) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`api-keys HTTP ${res.status}: ${await res.text()}`)
  const keys = await res.json()
  const list = Array.isArray(keys) ? keys : keys?.api_keys || []
  const service = list.find(
    (k) =>
      k.name === 'service_role' ||
      k.type === 'service_role' ||
      (Array.isArray(k.tags) && k.tags.includes('service_role')),
  )
  const key = service?.api_key || service?.key || service?.secret
  if (!key) throw new Error('service_role key introuvable')
  return key
}

async function main() {
  if (!existsSync(APK_PATH)) throw new Error(`APK introuvable: ${APK_PATH}`)
  const size = statSync(APK_PATH).size
  console.log(`▸ Upload Yandex ${(size / (1024 * 1024)).toFixed(1)} Mo → s3://${BUCKET}/${OBJECT_KEY}`)

  ensureS3Credentials({ allowEphemeral: true })
  const writable = await resolveWritableS3Client(BUCKET)
  if (!writable?.client) {
    throw new Error(`S3 non accessible (${writable?.reason || 'no client'})`)
  }

  const upload = new Upload({
    client: writable.client,
    params: {
      Bucket: BUCKET,
      Key: OBJECT_KEY,
      Body: createReadStream(APK_PATH),
      ContentType: 'application/vnd.android.package-archive',
      CacheControl: 'public, max-age=300',
      ContentDisposition: `attachment; filename="${DOWNLOAD_NAME}"`,
    },
  })
  upload.on('httpUploadProgress', (p) => {
    if (p.loaded && p.total) {
      const pct = ((100 * p.loaded) / p.total).toFixed(0)
      process.stdout.write(`\r  ${pct}%`)
    }
  })
  await upload.done()
  console.log('\n  ✓ objet S3')

  const phase2 = parseEnv(path.join(root, 'scripts', 'phase2.env'))
  const prod = parseEnv(path.join(root, 'moxt-react', '.env.production'))
  const url = phase2.VITE_SUPABASE_URL || prod.VITE_SUPABASE_URL
  const accessToken = phase2.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
  if (!url || !accessToken) throw new Error('VITE_SUPABASE_URL / SUPABASE_ACCESS_TOKEN manquants')

  const serviceKey = await getServiceRoleKey(accessToken)
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const id = `APK-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`.toUpperCase()
  await admin
    .from('app_releases')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('platform', 'android')
    .eq('is_active', true)

  const { error } = await admin.from('app_releases').insert({
    id,
    platform: 'android',
    version: APK_VERSION,
    file_name: DOWNLOAD_NAME,
    storage_path: PUBLIC_URL,
    file_size: size,
    is_active: true,
    notes: `Release ${APK_VERSION} — CDN Yandex (${OBJECT_KEY})`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(`insert app_releases: ${error.message}`)

  console.log('✓ APK publié')
  console.log(`  id: ${id}`)
  console.log(`  url: ${PUBLIC_URL}`)
}

main().catch((error) => {
  console.error('✗', error.message || error)
  process.exit(1)
})
