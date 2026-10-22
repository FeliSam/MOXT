/**
 * Création de contenus, mêmes tables et colonnes que supabaseMiddleware
 * (posts, statuts, offres P2P, colis, jobs, événements, vidéos, réservation colis).
 */

function createId(prefix) {
  const suffix =
    globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return `${prefix}-${suffix.toUpperCase()}`
}

async function write(client, table, row, { method = 'insert' } = {}) {
  if (!client) throw new Error('Client Supabase indisponible')
  const query = method === 'upsert' ? client.from(table).upsert(row, { onConflict: 'id' }) : client.from(table).insert(row)
  const { error } = await query
  if (error) throw error
  return row
}

export function buildPost(values, now = new Date()) {
  const iso = now.toISOString()
  const images = Array.isArray(values.images) ? values.images.filter((url) => typeof url === 'string' && url).slice(0, 4) : []
  return {
    id: values.id || createId('POST'),
    authorId: values.authorId,
    authorName: values.authorName || '',
    authorAvatarUrl: values.authorAvatarUrl || null,
    message: String(values.message || '').trim(),
    images,
    imageUrl: images[0] || null,
    status: 'published',
    likes: [],
    comments: [],
    sourceType: 'free',
    createdAt: iso,
    updatedAt: iso,
    lastSharedAt: iso,
  }
}

export async function createPost(client, values, now) {
  const post = buildPost(values, now)
  if (!post.message && !post.images.length) throw new Error('Texte ou photo requis')
  await write(client, 'posts', {
    id: post.id,
    author_id: post.authorId,
    author_name: post.authorName,
    author_avatar_url: post.authorAvatarUrl,
    source_type: post.sourceType,
    message: post.message,
    image_url: post.imageUrl,
    images: post.images,
    likes: [],
    comments: [],
    last_shared_at: post.lastSharedAt,
    status: post.status,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  })
  return post
}

export function buildStatus(values, now = new Date()) {
  const iso = now.toISOString()
  const images = Array.isArray(values.images) ? values.images.filter((url) => typeof url === 'string' && url).slice(0, 4) : []
  return {
    id: values.id || createId('STA'),
    authorId: values.authorId,
    authorName: values.authorName || '',
    authorAvatarUrl: values.authorAvatarUrl || null,
    businessId: values.businessId || null,
    images,
    caption: values.caption || '',
    isOfficial: false,
    viewedBy: [],
    createdAt: iso,
    expiresAt: values.expiresAt || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export async function createStatus(client, values, now) {
  const status = buildStatus(values, now)
  if (!status.caption && !status.images.length) throw new Error('Légende ou photo requise')
  await write(client, 'statuses', {
    id: status.id,
    author_id: status.authorId,
    author_name: status.authorName,
    author_avatar_url: status.authorAvatarUrl,
    business_id: status.businessId,
    images: status.images,
    caption: status.caption,
    is_official: false,
    viewed_by: [],
    viewers: {},
    reactions: {},
    created_at: status.createdAt,
    expires_at: status.expiresAt,
  })
  return status
}

export function p2pOfferToRemoteRow(offer) {
  return {
    id: offer.id,
    owner_id: offer.ownerId,
    owner_name: offer.ownerName || '',
    amount: Number(offer.amount) || 0,
    from_currency: offer.fromCurrency || 'RUB',
    to_currency: offer.toCurrency || 'XOF',
    rate: Number(offer.rate) || 0,
    status: offer.status || 'active',
    payload: offer,
    created_at: offer.createdAt || new Date().toISOString(),
  }
}

export function buildP2POffer(values, now = new Date()) {
  return {
    ...values,
    id: values.id || createId('P2P'),
    amount: Number(values.amount),
    rate: Number(values.rate),
    status: 'active',
    createdAt: now.toISOString(),
  }
}

export async function createP2POffer(client, values, now) {
  const offer = buildP2POffer(values, now)
  if (!(offer.amount > 0) || !(offer.rate > 0)) throw new Error('Montant et taux requis')
  await write(client, 'p2p_offers', p2pOfferToRemoteRow(offer))
  return offer
}

export function buildParcel(values, now = new Date()) {
  const capacity = Number(values.capacityKg)
  return {
    ...values,
    id: values.id || createId('COL'),
    capacityKg: capacity,
    remainingKg: capacity,
    pricePerKg: Number(values.pricePerKg),
    currency: String(values.currency || 'RUB').toUpperCase(),
    depositDeadline: values.depositDeadline || values.departureDate,
    distributionDate: values.distributionDate || '',
    status: 'active',
    proofStatus: 'missing',
    passportStatus: 'missing',
    reservations: [],
    createdAt: now.toISOString(),
  }
}

export async function createParcel(client, values, now) {
  const parcel = buildParcel(values, now)
  if (!parcel.origin || !parcel.destination || !(parcel.capacityKg > 0)) {
    throw new Error('Trajet et capacité requis')
  }
  await write(client, 'parcels', {
    id: parcel.id,
    owner_id: parcel.ownerId,
    owner_name: parcel.ownerName || '',
    business_id: parcel.businessId || null,
    origin: parcel.origin,
    destination: parcel.destination,
    departure_date: parcel.departureDate,
    distribution_date: parcel.distributionDate,
    deposit_deadline: parcel.depositDeadline,
    capacity_kg: parcel.capacityKg,
    remaining_kg: parcel.remainingKg,
    price_per_kg: parcel.pricePerKg,
    currency: parcel.currency,
    accepted_types: parcel.acceptedTypes || [],
    status: parcel.status,
    proof_status: parcel.proofStatus,
    passport_status: parcel.passportStatus,
    reservations: [],
    created_at: parcel.createdAt,
    payload: parcel,
  })
  return parcel
}

export function parcelRequestRow(values, now = new Date()) {
  const iso = now.toISOString()
  return {
    id: values.id || createId('PREQ'),
    parcel_id: values.parcelId,
    user_id: values.userId,
    requester_name: values.requesterName || '',
    owner_id: values.ownerId || null,
    business_id: values.businessId || null,
    related_type: 'parcel',
    related_id: values.parcelId,
    kg: Number(values.kg) || 0,
    status: 'submitted',
    created_at: iso,
    updated_at: iso,
  }
}

export async function requestParcelReservation(client, values, now) {
  const row = parcelRequestRow(values, now)
  if (!(row.kg > 0)) throw new Error('Poids requis')
  await write(client, 'parcel_requests', row, { method: 'upsert' })
  return row
}

export function buildJob(values, now = new Date()) {
  const iso = now.toISOString()
  return {
    ...values,
    id: values.id || createId('JOB'),
    status: 'active',
    createdAt: iso,
    expiresAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export async function createJob(client, values, now) {
  const job = buildJob(values, now)
  if (!job.title || String(job.description || '').trim().length < 30) {
    throw new Error('Titre et description (30 caractères) requis')
  }
  await write(client, 'jobs', {
    id: job.id,
    owner_id: job.ownerId,
    business_id: job.businessId || null,
    title: job.title,
    sector: job.sector || '',
    description: job.description,
    location: job.location || '',
    salary: job.salary || '',
    status: job.status,
    created_at: job.createdAt,
    expires_at: job.expiresAt,
    payload: job,
  })
  return job
}

export function buildEvent(values, now = new Date()) {
  return {
    ...values,
    id: values.id || createId('EVT'),
    capacity: Number(values.capacity) || 0,
    price: Number(values.price) || 0,
    status: 'published',
    createdAt: now.toISOString(),
  }
}

export async function createEvent(client, values, now) {
  const event = buildEvent(values, now)
  if (!event.title || !event.startAt || String(event.description || '').trim().length < 20) {
    throw new Error('Titre, date et description requis')
  }
  await write(client, 'events', {
    id: event.id,
    owner_id: event.ownerId,
    business_id: event.businessId || null,
    title: event.title,
    category: event.category || '',
    description: event.description,
    city: event.city || '',
    start_at: event.startAt,
    format: event.format || 'in_person',
    venue: event.venue || null,
    online_link: event.onlineLink || null,
    price: event.price,
    capacity: event.capacity,
    status: event.status,
    organizer_name: event.organizerName || '',
    created_at: event.createdAt,
    payload: event,
  })
  return event
}

export function buildVideo(values, now = new Date()) {
  const iso = now.toISOString()
  return {
    ...values,
    id: values.id || createId('VID'),
    title: values.title || '',
    caption: values.caption || '',
    videoUrl: values.videoUrl || '',
    thumbnailUrl: values.thumbnailUrl || '',
    viewCount: 0,
    shareCount: 0,
    likes: [],
    comments: [],
    status: 'active',
    createdAt: iso,
    updatedAt: iso,
  }
}

export async function createVideo(client, values, now) {
  const video = buildVideo(values, now)
  if (!video.title || !video.videoUrl || !video.businessId) throw new Error('Titre, fichier et entreprise requis')
  await write(client, 'videos', {
    id: video.id,
    owner_id: video.ownerId,
    business_id: video.businessId,
    business_name: video.businessName || null,
    title: video.title,
    caption: video.caption,
    video_url: video.videoUrl,
    thumbnail_url: video.thumbnailUrl || null,
    view_count: 0,
    share_count: 0,
    likes: [],
    comments: [],
    status: video.status,
    created_at: video.createdAt,
    updated_at: video.updatedAt,
  })
  return video
}

/** Cadeau d'étoiles (RPC stars_gift_to_publisher), mêmes montants que le web. */
export const STAR_GIFT_AMOUNTS = [5, 10, 25, 50]

export async function giftStarsToPublisher(client, { recipientType, recipientId, amount, idempotencyKey, message = null }) {
  if (!client) throw new Error('Client Supabase indisponible')
  const { data, error } = await client.rpc('stars_gift_to_publisher', {
    p_recipient_type: recipientType,
    p_recipient_id: recipientId,
    p_amount: amount,
    p_idempotency_key: idempotencyKey,
    p_message: message,
  })
  if (error) throw error
  return data
}
