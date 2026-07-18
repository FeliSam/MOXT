#!/usr/bin/env node
/**
 * Restaure les publications catalogue de Feliciano Fanou (annonces, jobs, events, colis)
 * sans republier leurs posts dans le fil d'actualités.
 *
 * Usage: node scripts/_restore-fanou-catalog.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = 'rbvqfkccbkwjxkvpnwqn'
const OWNER_ID = 'f9968533-bf1e-4c21-a665-524f2ec9e630'

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

async function restoreTable(admin, table, ownerColumn, fromStatuses, toStatus) {
  const { data, error } = await admin
    .from(table)
    .select('id, status')
    .eq(ownerColumn, OWNER_ID)
    .in('status', fromStatuses)

  if (error) throw new Error(`${table} select: ${error.message}`)
  const ids = (data || []).map((row) => row.id)
  if (!ids.length) return { table, restored: 0, ids: [] }

  const now = new Date().toISOString()
  const { error: updateError } = await admin
    .from(table)
    .update({ status: toStatus, updated_at: now })
    .in('id', ids)

  if (updateError) throw new Error(`${table} update: ${updateError.message}`)
  return { table, restored: ids.length, toStatus, ids }
}

async function main() {
  const phase2 = parseEnv(path.join(root, 'scripts', 'phase2.env'))
  const prod = parseEnv(path.join(root, 'moxt-react', '.env.production'))
  const url = phase2.VITE_SUPABASE_URL || prod.VITE_SUPABASE_URL
  const accessToken = phase2.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
  if (!url || !accessToken) throw new Error('VITE_SUPABASE_URL / SUPABASE_ACCESS_TOKEN manquants')

  const serviceKey = await getServiceRoleKey(accessToken, PROJECT_REF)
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const results = []
  results.push(await restoreTable(admin, 'listings', 'owner_id', ['archived'], 'active'))
  results.push(await restoreTable(admin, 'jobs', 'owner_id', ['archived'], 'active'))
  results.push(await restoreTable(admin, 'events', 'owner_id', ['archived'], 'published'))
  results.push(await restoreTable(admin, 'parcels', 'owner_id', ['archived'], 'active'))
  results.push(await restoreTable(admin, 'p2p_offers', 'owner_id', ['archived'], 'active'))

  // Keep feed posts archived (except welcome / pinned launch post).
  const { data: feedPosts, error: postsError } = await admin
    .from('posts')
    .select('id, status, pinned, source_type, direct_link, message')
    .eq('author_id', OWNER_ID)
    .eq('status', 'published')

  if (postsError) throw new Error(`posts check: ${postsError.message}`)

  console.log(
    JSON.stringify(
      {
        ok: true,
        ownerId: OWNER_ID,
        catalog: results,
        publishedFeedPostsStillLive: (feedPosts || []).map((p) => ({
          id: p.id,
          pinned: p.pinned,
          source_type: p.source_type,
        })),
        note: 'Les posts du fil restent archivés ; seuls les catalogues sont réactivés.',
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
