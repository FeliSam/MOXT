#!/usr/bin/env node
/**
 * Peuple Supabase avec annonces, jobs, événements et colis de démo (Feliciano Fanou).
 * Usage: node scripts/seed-catalog-content.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  EVENTS,
  JOBS,
  LISTINGS,
  OWNER_ID,
  PARCELS,
  PUBLISHER_NAME,
  PUBLISHER_PHONE,
} from './seed/catalogData.mjs'
import { expiresInDays } from './seed/catalogSeedUtils.mjs'

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

function buildListing(item) {
  return {
    id: item.id,
    owner_id: OWNER_ID,
    seller_name: PUBLISHER_NAME,
    seller_type: 'person',
    title: item.title,
    description: item.description,
    type: item.type || 'product',
    category: item.category,
    status: 'active',
    price: item.price,
    currency: item.currency,
    country: item.country,
    city: item.city,
    address: '',
    images: item.images,
    payload: { condition: item.condition, sellerName: PUBLISHER_NAME, ownerId: OWNER_ID },
    created_at: item.created_at,
    updated_at: item.created_at,
    expires_at: expiresInDays(item.created_at, 90),
  }
}

function buildJob(item) {
  return {
    id: item.id,
    owner_id: OWNER_ID,
    publisher_name: PUBLISHER_NAME,
    publisher_type: 'personal',
    title: item.title,
    sector: item.sector,
    contract_type: item.contractType,
    experience_level: item.experienceLevel,
    language: item.language,
    salary: Number(item.salary) || 0,
    salary_period: item.salaryPeriod,
    description: item.description,
    requirements: item.requirements || '',
    benefits: item.benefits || '',
    location: item.city,
    remote: item.remote,
    status: 'active',
    expires_at: expiresInDays(item.created_at, 60),
    payload: {
      images: item.images,
      ownerId: OWNER_ID,
      publisherName: PUBLISHER_NAME,
      contractType: item.contractType,
      experienceLevel: item.experienceLevel,
      salaryPeriod: item.salaryPeriod,
      location: item.city,
      remote: item.remote,
    },
    created_at: item.created_at,
    updated_at: item.created_at,
  }
}

function buildEvent(item) {
  return {
    id: item.id,
    owner_id: OWNER_ID,
    title: item.title,
    category: item.category,
    format: item.format || 'in_person',
    language: 'fr',
    description: item.description,
    program: JSON.stringify({ images: item.images || [] }),
    speakers: '',
    start_at: item.starts_at,
    end_at: item.ends_at,
    city: item.city,
    venue: item.venue,
    address: item.venue,
    capacity: item.max_attendees,
    price: item.price || 0,
    currency: 'RUB',
    free_entry: item.free_entry !== false,
    organizer_name: PUBLISHER_NAME,
    organizer_contact: PUBLISHER_PHONE,
    status: 'published',
    created_at: item.created_at,
    updated_at: item.created_at,
  }
}

function buildParcel(item) {
  return {
    id: item.id,
    owner_id: OWNER_ID,
    owner_name: PUBLISHER_NAME,
    from_country: item.from_country,
    to_country: item.to_country,
    origin: item.origin,
    destination: item.destination,
    origin_airport_code: item.origin_airport_code,
    destination_airport_code: item.destination_airport_code,
    departure_date: item.departure_date,
    deposit_deadline: item.deposit_deadline,
    distribution_date: item.distribution_date,
    capacity_kg: item.capacity_kg,
    remaining_kg: item.remaining_kg,
    price_per_kg: item.price_per_kg,
    currency: item.currency,
    conditions: item.conditions,
    contact: item.contact,
    publish_as: 'person',
    proof_status: 'verified',
    status: 'active',
    accepted_types: item.accepted_types,
    rejected_types: item.rejected_types,
    created_at: item.created_at,
    updated_at: item.created_at,
  }
}

async function upsertBatch(admin, table, rows) {
  const { error } = await admin.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`${table}: ${error.message}`)
}

async function main() {
  const phase2 = parseEnv(path.join(root, 'scripts', 'phase2.env'))
  const prod = parseEnv(path.join(root, 'moxt-react', '.env.production'))
  const url = phase2.VITE_SUPABASE_URL || prod.VITE_SUPABASE_URL
  const accessToken = phase2.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
  const projectRef = 'rbvqfkccbkwjxkvpnwqn'
  if (!url || !accessToken) throw new Error('VITE_SUPABASE_URL / SUPABASE_ACCESS_TOKEN manquants')

  const serviceKey = await getServiceRoleKey(accessToken, projectRef)
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('id', OWNER_ID)
    .maybeSingle()

  if (profileError) throw new Error(`profiles: ${profileError.message}`)
  if (!profile) throw new Error(`Profil ${OWNER_ID} (Feliciano Fanou) introuvable`)

  const listingRows = LISTINGS.map(buildListing)
  const jobRows = JOBS.map(buildJob)
  const eventRows = EVENTS.map(buildEvent)
  const parcelRows = PARCELS.map(buildParcel)

  await upsertBatch(admin, 'listings', listingRows)
  await upsertBatch(admin, 'jobs', jobRows)
  await upsertBatch(admin, 'events', eventRows)
  await upsertBatch(admin, 'parcels', parcelRows)

  console.log(
    JSON.stringify(
      {
        ok: true,
        ownerId: OWNER_ID,
        ownerName: PUBLISHER_NAME,
        counts: {
          listings: listingRows.length,
          jobs: jobRows.length,
          events: eventRows.length,
          parcels: parcelRows.length,
        },
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
