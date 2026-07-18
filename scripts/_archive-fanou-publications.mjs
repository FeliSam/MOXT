#!/usr/bin/env node
/**
 * Archive toutes les publications de Feliciano Fanou sauf le post de bienvenue épinglé.
 * Usage: node scripts/_archive-fanou-publications.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = 'rbvqfkccbkwjxkvpnwqn'
const KNOWN_OWNER_ID = 'f9968533-bf1e-4c21-a665-524f2ec9e630'

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

function isWelcomePost(post) {
  if (!post) return false
  if (post.pinned === true) return true
  if (post.source_type !== 'free') return false
  if (post.direct_link === '/news') return true
  if (String(post.image_url || '').includes('welcome-moxt-launch')) return true
  if (typeof post.message === 'string' && /bienvenue sur moxt/i.test(post.message)) return true
  return false
}

async function archiveTable(admin, table, ownerColumn, ownerId, activeStatuses, extraFilter) {
  let query = admin
    .from(table)
    .select('id, status' + (table === 'posts' ? ', pinned, source_type, direct_link, image_url, message' : ''))
    .eq(ownerColumn, ownerId)
    .in('status', activeStatuses)

  const { data, error } = await query
  if (error) throw new Error(`${table} select: ${error.message}`)

  let rows = data || []
  if (extraFilter) rows = rows.filter(extraFilter)

  const ids = rows.map((row) => row.id)
  if (!ids.length) {
    return { table, kept: 0, archived: 0, ids: [] }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await admin
    .from(table)
    .update({ status: 'archived', updated_at: now })
    .in('id', ids)

  if (updateError) throw new Error(`${table} update: ${updateError.message}`)
  return { table, kept: 0, archived: ids.length, ids }
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

  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id, first_name, last_name, email')
    .or(
      'and(first_name.ilike.%Feliciano%,last_name.ilike.%Fanou%),and(first_name.ilike.%Fanou%,last_name.ilike.%Feliciano%),email.ilike.%felicianolheureux%',
    )
    .limit(10)

  if (profileError) throw new Error(`profiles: ${profileError.message}`)

  const profile =
    (profiles || []).find((p) => p.id === KNOWN_OWNER_ID) ||
    (profiles || []).find(
      (p) =>
        /feliciano/i.test(`${p.first_name} ${p.last_name}`) &&
        /fanou/i.test(`${p.first_name} ${p.last_name}`),
    ) ||
    (profiles || [])[0]

  if (!profile) throw new Error('Profil Feliciano Fanou introuvable')

  const ownerId = profile.id
  const now = new Date().toISOString()
  const summary = {
    ownerId,
    ownerName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
    keptWelcome: [],
    results: [],
  }

  // Posts: archive all published except welcome pinned
  const { data: posts, error: postsError } = await admin
    .from('posts')
    .select('id, status, pinned, source_type, direct_link, image_url, message')
    .eq('author_id', ownerId)
    .eq('status', 'published')

  if (postsError) throw new Error(`posts select: ${postsError.message}`)

  const welcomePosts = (posts || []).filter(isWelcomePost)
  const archivePosts = (posts || []).filter((post) => !isWelcomePost(post))
  summary.keptWelcome = welcomePosts.map((p) => ({ id: p.id, pinned: p.pinned }))

  if (archivePosts.length) {
    const { error } = await admin
      .from('posts')
      .update({ status: 'archived', updated_at: now })
      .in(
        'id',
        archivePosts.map((p) => p.id),
      )
    if (error) throw new Error(`posts update: ${error.message}`)
  }
  summary.results.push({
    table: 'posts',
    kept: welcomePosts.length,
    archived: archivePosts.length,
    ids: archivePosts.map((p) => p.id),
  })

  summary.results.push(
    await archiveTable(admin, 'listings', 'owner_id', ownerId, ['active', 'pending']),
  )
  summary.results.push(await archiveTable(admin, 'jobs', 'owner_id', ownerId, ['active', 'pending']))
  summary.results.push(
    await archiveTable(admin, 'events', 'owner_id', ownerId, ['published', 'pending']),
  )
  summary.results.push(
    await archiveTable(admin, 'parcels', 'owner_id', ownerId, ['active', 'pending']),
  )
  summary.results.push(
    await archiveTable(admin, 'p2p_offers', 'owner_id', ownerId, ['active', 'pending']),
  )

  console.log(JSON.stringify({ ok: true, ...summary }, null, 2))
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err?.message || err) }))
  process.exit(1)
})
