#!/usr/bin/env node
/**
 * Peuple Supabase avec annonces, jobs, événements et colis de démo (Feliciano Fanou).
 * Upload les images vers le bucket `listings`, crée aussi les posts du fil d'actualité.
 *
 * Usage: node scripts/seed-catalog-content.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
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
const PROJECT_REF = 'rbvqfkccbkwjxkvpnwqn'

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

function extFromContentType(contentType = '') {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
  return 'jpg'
}

async function downloadBytes(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MOXT-Seed/1.0)',
      Accept: 'image/*',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await res.arrayBuffer())
  return { buffer, contentType }
}

async function uploadImage(admin, ownerId, folder, key, sourceUrl, failures) {
  try {
    const { buffer, contentType } = await downloadBytes(sourceUrl)
    const ext = extFromContentType(contentType)
    const storagePath = `${ownerId}/${folder}/${key}.${ext}`
    const { error } = await admin.storage.from('listings').upload(storagePath, buffer, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    })
    if (error) throw error
    const { data } = admin.storage.from('listings').getPublicUrl(storagePath)
    return data.publicUrl
  } catch (err) {
    failures.push({ key, sourceUrl, error: String(err?.message || err) })
    return sourceUrl
  }
}

async function resolveImages(admin, ownerId, folder, id, urls, failures) {
  const out = []
  for (let i = 0; i < (urls || []).length; i += 1) {
    const url = urls[i]
    const stored = await uploadImage(admin, ownerId, folder, `${id}-${i + 1}`, url, failures)
    out.push(stored)
  }
  return out
}

function buildListing(item, images) {
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
    images,
    payload: {
      condition: item.condition,
      sellerName: PUBLISHER_NAME,
      ownerId: OWNER_ID,
      images,
    },
    created_at: item.created_at,
    updated_at: item.created_at,
    expires_at: expiresInDays(item.created_at, 90),
  }
}

function buildJob(item, images) {
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
    salary: String(item.salary ?? ''),
    salary_period: item.salaryPeriod,
    description: item.description,
    requirements: item.requirements || '',
    benefits: item.benefits || '',
    location: item.city,
    remote: Boolean(item.remote),
    status: 'active',
    expires_at: expiresInDays(item.created_at, 60),
    payload: {
      images,
      ownerId: OWNER_ID,
      publisherName: PUBLISHER_NAME,
      contractType: item.contractType,
      experienceLevel: item.experienceLevel,
      salaryPeriod: item.salaryPeriod,
      location: item.city,
      remote: Boolean(item.remote),
      title: item.title,
      sector: item.sector,
      description: item.description,
    },
    created_at: item.created_at,
    updated_at: item.created_at,
  }
}

function buildEvent(item, images) {
  return {
    id: item.id,
    owner_id: OWNER_ID,
    title: item.title,
    category: item.category,
    format: item.format || 'in_person',
    language: 'fr',
    description: item.description,
    program: JSON.stringify({ images }),
    speakers: '',
    start_at: item.starts_at,
    end_at: item.ends_at,
    city: item.city,
    venue: item.venue,
    address: item.venue,
    capacity: item.max_attendees,
    price: item.price || 0,
    currency: 'RUB',
    free_entry: item.free_entry !== false && !(item.price > 0),
    organizer_name: PUBLISHER_NAME,
    organizer_contact: PUBLISHER_PHONE,
    status: 'published',
    created_at: item.created_at,
    updated_at: item.created_at,
    expires_at: item.ends_at || item.starts_at,
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
    rejected_types: item.rejected_types || '',
    created_at: item.created_at,
    updated_at: item.created_at,
  }
}

function postId(prefix) {
  return `POST-${prefix}-${Date.now().toString(36)}-${randomBytes(2).toString('hex')}`
}

function buildFeedPosts({ listings, jobs, events, parcels, avatarUrl }) {
  const posts = []

  for (const item of listings) {
    const price = item.price ? `${item.price} ${item.currency || 'RUB'}` : ''
    posts.push({
      id: postId(item.id),
      author_id: OWNER_ID,
      author_name: PUBLISHER_NAME,
      author_avatar_url: avatarUrl,
      source_type: 'listing',
      source_id: item.id,
      message: `🛍️ Nouvelle annonce : ${item.title}${price ? ` — ${price}` : ''}\n\n${(item.description || '').slice(0, 160)}${(item.description || '').length > 160 ? '…' : ''}\n\nDispo sur MOXT Marketplace.`,
      image_url: item.images?.[0] || null,
      direct_link: `/marketplace/${item.id}`,
      likes: [],
      comments: [],
      last_shared_at: item.created_at,
      status: 'published',
      created_at: item.created_at,
      updated_at: item.created_at,
    })
  }

  for (const item of jobs) {
    posts.push({
      id: postId(item.id),
      author_id: OWNER_ID,
      author_name: PUBLISHER_NAME,
      author_avatar_url: avatarUrl,
      source_type: 'job',
      source_id: item.id,
      message: `💼 Offre d'emploi : ${item.title}\n📍 ${item.location || ''}\n\n${(item.description || '').slice(0, 160)}${(item.description || '').length > 160 ? '…' : ''}\n\nPostulez via MOXT.`,
      image_url: item.payload?.images?.[0] || null,
      direct_link: `/jobs/${item.id}`,
      likes: [],
      comments: [],
      last_shared_at: item.created_at,
      status: 'published',
      created_at: item.created_at,
      updated_at: item.created_at,
    })
  }

  for (const item of events) {
    const when = item.start_at
      ? new Date(item.start_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : ''
    let imageUrl = null
    try {
      const parsed = JSON.parse(item.program || '{}')
      imageUrl = parsed.images?.[0] || null
    } catch {
      imageUrl = item.payload?.images?.[0] || null
    }
    posts.push({
      id: postId(item.id),
      author_id: OWNER_ID,
      author_name: PUBLISHER_NAME,
      author_avatar_url: avatarUrl,
      source_type: 'event',
      source_id: item.id,
      message: `🎉 Événement : ${item.title}${when ? `\n📅 ${when}` : ''}${item.city ? `\n📍 ${item.city}` : ''}\n\n${(item.description || '').slice(0, 140)}${(item.description || '').length > 140 ? '…' : ''}\n\nInscrivez-vous sur MOXT.`,
      image_url: imageUrl,
      direct_link: `/events/${item.id}`,
      likes: [],
      comments: [],
      last_shared_at: item.created_at,
      status: 'published',
      created_at: item.created_at,
      updated_at: item.created_at,
    })
  }

  for (const item of parcels) {
    posts.push({
      id: postId(item.id),
      author_id: OWNER_ID,
      author_name: PUBLISHER_NAME,
      author_avatar_url: avatarUrl,
      source_type: 'parcel',
      source_id: item.id,
      message: `📦 Trajet colis : ${item.origin} → ${item.destination}\n🗓️ Départ ${item.departure_date} · ${item.remaining_kg} kg dispo · ${item.price_per_kg} ${item.currency}/kg\n\n${(item.conditions || '').slice(0, 140)}${(item.conditions || '').length > 140 ? '…' : ''}\n\nRéservez sur MOXT.`,
      image_url: null,
      direct_link: `/parcels/${item.id}`,
      likes: [],
      comments: [],
      last_shared_at: item.created_at,
      status: 'published',
      created_at: item.created_at,
      updated_at: item.created_at,
    })
  }

  return posts
}

async function upsertBatch(admin, table, rows, attempts = 3) {
  let lastError
  for (let i = 1; i <= attempts; i += 1) {
    const { error } = await admin.from(table).upsert(rows, { onConflict: 'id' })
    if (!error) return
    lastError = error
    if (i < attempts) await new Promise((r) => setTimeout(r, 800 * i))
  }
  throw new Error(`${table}: ${lastError?.message || lastError}`)
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

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, phone, email')
    .eq('id', OWNER_ID)
    .maybeSingle()

  if (profileError) throw new Error(`profiles: ${profileError.message}`)
  if (!profile) throw new Error(`Profil ${OWNER_ID} (Feliciano Fanou) introuvable`)

  const imageFailures = []
  console.log('Uploading listing images…')
  const listingRows = []
  for (const item of LISTINGS) {
    const images = await resolveImages(admin, OWNER_ID, 'seed-listings', item.id, item.images, imageFailures)
    listingRows.push(buildListing(item, images))
  }

  console.log('Uploading job images…')
  const jobRows = []
  for (const item of JOBS) {
    const images = await resolveImages(admin, OWNER_ID, 'seed-jobs', item.id, item.images, imageFailures)
    jobRows.push(buildJob(item, images))
  }

  console.log('Uploading event images…')
  const eventRows = []
  for (const item of EVENTS) {
    const images = await resolveImages(admin, OWNER_ID, 'seed-events', item.id, item.images, imageFailures)
    eventRows.push(buildEvent(item, images))
  }

  const parcelRows = PARCELS.map(buildParcel)

  console.log('Upserting catalog rows…')
  await upsertBatch(admin, 'listings', listingRows)
  await upsertBatch(admin, 'jobs', jobRows)
  await upsertBatch(admin, 'events', eventRows)
  await upsertBatch(admin, 'parcels', parcelRows)

  console.log('Upserting feed posts…')
  const postRows = buildFeedPosts({
    listings: listingRows,
    jobs: jobRows,
    events: eventRows,
    parcels: parcelRows,
    avatarUrl: profile.avatar_url || null,
  })

  // Idempotent: delete previous seed posts for these source ids, then insert
  const sourceIds = [
    ...listingRows.map((r) => r.id),
    ...jobRows.map((r) => r.id),
    ...eventRows.map((r) => r.id),
    ...parcelRows.map((r) => r.id),
  ]
  await admin.from('posts').delete().eq('author_id', OWNER_ID).in('source_id', sourceIds)
  await upsertBatch(admin, 'posts', postRows)

  const countFor = async (table) => {
    const { count, error } = await admin
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(table === 'posts' ? 'author_id' : 'owner_id', OWNER_ID)
      .in(
        'id',
        table === 'posts'
          ? postRows.map((p) => p.id)
          : table === 'listings'
            ? listingRows.map((r) => r.id)
            : table === 'jobs'
              ? jobRows.map((r) => r.id)
              : table === 'events'
                ? eventRows.map((r) => r.id)
                : parcelRows.map((r) => r.id),
      )
    if (error) throw new Error(`count ${table}: ${error.message}`)
    return count
  }

  const counts = {
    listings: await countFor('listings'),
    jobs: await countFor('jobs'),
    events: await countFor('events'),
    parcels: await countFor('parcels'),
    posts: await countFor('posts'),
  }

  const parcelByCountry = { BJ: 0, TG: 0, CM: 0, GH: 0 }
  for (const p of parcelRows) {
    for (const code of Object.keys(parcelByCountry)) {
      if (p.from_country === code || p.to_country === code) parcelByCountry[code] += 1
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        ownerId: OWNER_ID,
        ownerName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || PUBLISHER_NAME,
        counts,
        parcelByCountry,
        sampleTitles: {
          listings: listingRows.slice(0, 3).map((r) => r.title),
          jobs: jobRows.slice(0, 3).map((r) => r.title),
          events: eventRows.slice(0, 3).map((r) => r.title),
          parcels: parcelRows.slice(0, 3).map((r) => `${r.origin}→${r.destination}`),
        },
        imageFailures,
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
