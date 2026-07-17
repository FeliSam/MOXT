#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { OWNER_ID } from './seed/catalogSeedUtils.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

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
  if (!res.ok) throw new Error(`api-keys HTTP ${res.status}`)
  const keys = await res.json()
  const list = Array.isArray(keys) ? keys : keys?.api_keys || []
  const service = list.find(
    (k) =>
      k.name === 'service_role' ||
      k.type === 'service_role' ||
      (Array.isArray(k.tags) && k.tags.includes('service_role')),
  )
  return service?.api_key || service?.key || service?.secret
}

const phase2 = parseEnv(path.join(root, 'scripts', 'phase2.env'))
const prod = parseEnv(path.join(root, 'moxt-react', '.env.production'))
const url = phase2.VITE_SUPABASE_URL || prod.VITE_SUPABASE_URL
const accessToken = phase2.SUPABASE_ACCESS_TOKEN
const serviceKey = await getServiceRoleKey(accessToken, 'rbvqfkccbkwjxkvpnwqn')
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: profile } = await admin
  .from('profiles')
  .select('id, first_name, last_name')
  .eq('id', OWNER_ID)
  .single()

const { data: listings } = await admin
  .from('listings')
  .select('id, title, owner_id, seller_name, created_at, images, price, currency, status')
  .eq('owner_id', OWNER_ID)
  .like('id', 'ANN-MOX-%')

const { data: jobs } = await admin
  .from('jobs')
  .select('id, title, owner_id, publisher_name, created_at, status')
  .eq('owner_id', OWNER_ID)
  .like('id', 'JOB-MOX-%')

const { data: events } = await admin
  .from('events')
  .select('id, title, owner_id, organizer_name, created_at, start_at, status')
  .eq('owner_id', OWNER_ID)
  .like('id', 'EVT-MOX-%')

const { data: parcels } = await admin
  .from('parcels')
  .select(
    'id, owner_id, owner_name, from_country, to_country, origin, destination, departure_date, created_at, status',
  )
  .eq('owner_id', OWNER_ID)
  .like('id', 'COL-MOX-%')

const sourceIds = [
  ...(listings || []).map((r) => r.id),
  ...(jobs || []).map((r) => r.id),
  ...(events || []).map((r) => r.id),
  ...(parcels || []).map((r) => r.id),
]

const { data: posts } = await admin
  .from('posts')
  .select('id, source_type, source_id, author_id, author_name, created_at, status')
  .eq('author_id', OWNER_ID)
  .in('source_id', sourceIds)

const storageHosted = (listings || []).filter(
  (l) => Array.isArray(l.images) && l.images.some((u) => String(u).includes('supabase')),
).length

console.log(
  JSON.stringify(
    {
      profile,
      counts: {
        listings: listings?.length,
        jobs: jobs?.length,
        events: events?.length,
        parcels: parcels?.length,
        posts: posts?.length,
      },
      authorsOk: {
        listings: (listings || []).every(
          (r) => r.owner_id === OWNER_ID && r.seller_name === 'Feliciano Fanou',
        ),
        jobs: (jobs || []).every(
          (r) => r.owner_id === OWNER_ID && r.publisher_name === 'Feliciano Fanou',
        ),
        events: (events || []).every(
          (r) => r.owner_id === OWNER_ID && r.organizer_name === 'Feliciano Fanou',
        ),
        parcels: (parcels || []).every(
          (r) => r.owner_id === OWNER_ID && r.owner_name === 'Feliciano Fanou',
        ),
        posts: (posts || []).every(
          (r) => r.author_id === OWNER_ID && r.author_name === 'Feliciano Fanou',
        ),
      },
      listingsWithSupabaseImages: storageHosted,
      earliestParcelDeparture: (parcels || []).map((p) => p.departure_date).sort()[0],
      earliestEventStart: (events || []).map((e) => e.start_at).sort()[0],
      sampleListing: listings?.[0],
      sampleParcel: parcels?.[0],
      postSourceTypes: Object.fromEntries(
        ['listing', 'job', 'event', 'parcel'].map((t) => [
          t,
          (posts || []).filter((p) => p.source_type === t).length,
        ]),
      ),
    },
    null,
    2,
  ),
)
