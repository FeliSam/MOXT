#!/usr/bin/env node
/** Upload Moxt.apk via REST + curl (plus fiable que fetch Node pour ~68 Mo). */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = 'rbvqfkccbkwjxkvpnwqn'
const APK_PATH = path.join(
  root,
  'moxt-react/android/app/build/outputs/apk/debug/Moxt.apk',
)

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
  const phase2 = parseEnv(path.join(root, 'scripts', 'phase2.env'))
  const prod = parseEnv(path.join(root, 'moxt-react', '.env.production'))
  const url = (phase2.VITE_SUPABASE_URL || prod.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const accessToken = phase2.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
  if (!url || !accessToken) throw new Error('VITE_SUPABASE_URL / SUPABASE_ACCESS_TOKEN manquants')
  if (!existsSync(APK_PATH)) throw new Error(`APK introuvable: ${APK_PATH}`)

  const serviceKey = await getServiceRoleKey(accessToken)
  const id = `APK-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`.toUpperCase()
  const fileName = 'Moxt.apk'
  const storagePath = `android/${id}/${fileName}`
  const size = statSync(APK_PATH).size
  const endpoint = `${url}/storage/v1/object/app-releases/${storagePath}`

  console.log(`▸ curl upload ${(size / (1024 * 1024)).toFixed(1)} Mo → ${storagePath}`)
  const curl = spawnSync(
    'curl',
    [
      '-sS',
      '-X',
      'POST',
      endpoint,
      '-H',
      `Authorization: Bearer ${serviceKey}`,
      '-H',
      'apikey: ' + serviceKey,
      '-H',
      'Content-Type: application/vnd.android.package-archive',
      '-H',
      'x-upsert: true',
      '--data-binary',
      `@${APK_PATH}`,
      '--max-time',
      '600',
    ],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  )
  if (curl.status !== 0) {
    throw new Error(`curl exit ${curl.status}: ${curl.stderr || curl.stdout}`)
  }
  const body = (curl.stdout || '').trim()
  if (/error|Error|fail/i.test(body) && !/"Key"/.test(body)) {
    throw new Error(`storage response: ${body.slice(0, 500)}`)
  }
  console.log('  storage:', body.slice(0, 200))

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await admin
    .from('app_releases')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('platform', 'android')
    .eq('is_active', true)

  const { error: insertError } = await admin.from('app_releases').insert({
    id,
    platform: 'android',
    version: 'debug',
    file_name: fileName,
    storage_path: storagePath,
    file_size: size,
    is_active: true,
    notes: 'Publié depuis outputs/apk/debug/Moxt.apk',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (insertError) throw new Error(`insert: ${insertError.message}`)

  const { data: pub } = admin.storage.from('app-releases').getPublicUrl(storagePath)
  console.log('✓ APK publié')
  console.log(`  id: ${id}`)
  console.log(`  url: ${pub?.publicUrl}`)
}

main().catch((error) => {
  console.error('✗', error.message || error)
  process.exit(1)
})
