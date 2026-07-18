#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = 'rbvqfkccbkwjxkvpnwqn'
const POST_ID = 'POST-mrp1mjcr-f2ea6a'

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

async function getServiceRoleKey(accessToken, projectRef) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
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
  const url = phase2.VITE_SUPABASE_URL || prod.VITE_SUPABASE_URL
  const accessToken = phase2.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
  const serviceKey = await getServiceRoleKey(accessToken, PROJECT_REF)
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await admin
    .from('posts')
    .update({ pinned: true, status: 'published', updated_at: new Date().toISOString() })
    .eq('id', POST_ID)
    .select('id, pinned, status, author_name, message')
    .single()

  if (error) throw new Error(error.message)
  console.log(
    JSON.stringify(
      {
        ok: true,
        id: data.id,
        pinned: data.pinned,
        status: data.status,
        author: data.author_name,
        preview: String(data.message || '').slice(0, 80),
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err?.message || err) }))
  process.exit(1)
})
