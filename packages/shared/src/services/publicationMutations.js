/**
 * Écritures « Mes publications », mêmes tables que moxt-react/src/app/supabaseMiddleware.js
 * (update de statut, suppression). Les posts mettent aussi à jour `updated_at`.
 */

export const PUBLICATION_TABLE = {
  listing: 'listings',
  parcel: 'parcels',
  job: 'jobs',
  event: 'events',
  video: 'videos',
  post: 'posts',
  other: 'p2p_offers',
}

/** Statut « archivée » commun à tous les types. */
export function archiveStatus() {
  return 'archived'
}

/** Statut de republication : publié pour posts et événements, actif sinon (comme le web). */
export function republishStatus(type) {
  if (type === 'event' || type === 'post') return 'published'
  return 'active'
}

function tableFor(type) {
  const table = PUBLICATION_TABLE[type]
  if (!table) throw new Error(`Type non pris en charge : ${type}`)
  return table
}

async function settle(query) {
  const { error } = await query
  if (error) throw error
}

/** Archive, republication ou changement de statut (marketplace/updateListingStatus, posts/moderatePost, …). */
export async function setPublicationStatus(client, type, id, status, now = new Date()) {
  if (!client) throw new Error('Client Supabase indisponible')
  const patch = { status }
  if (type === 'post') patch.updated_at = now.toISOString()
  await settle(client.from(tableFor(type)).update(patch).eq('id', id))
}

/** Suppression définitive (deleteListing, deletePost, deleteOffer, …). */
export async function deletePublication(client, type, id) {
  if (!client) throw new Error('Client Supabase indisponible')
  await settle(client.from(tableFor(type)).delete().eq('id', id))
}

const EDIT_COLUMNS = {
  title: 'title',
  description: 'description',
  message: 'message',
  caption: 'caption',
  price: 'price',
  city: 'city',
  salary: 'salary',
  amount: 'amount',
  rate: 'rate',
  status: 'status',
  origin: 'origin',
  destination: 'destination',
  pricePerKg: 'price_per_kg',
  capacityKg: 'capacity_kg',
  sector: 'sector',
  location: 'location',
  images: 'images',
  imageUrl: 'image_url',
  category: 'category',
  venue: 'venue',
  format: 'format',
  startAt: 'start_at',
  onlineLink: 'online_link',
  capacity: 'capacity',
  organizerName: 'organizer_name',
  departureDate: 'departure_date',
  acceptedTypes: 'accepted_types',
  proofStatus: 'proof_status',
  travelProofUrl: 'travel_proof_url',
  fromCurrency: 'from_currency',
  toCurrency: 'to_currency',
  contact: 'contact',
}

/** Photos de job : uniquement dans payload (jobRemote.PAYLOAD_ONLY_FIELDS). */
const SKIP_COLUMN = {
  job: new Set(['images', 'imageUrl']),
}

const PAYLOAD_TYPES = new Set(['listing', 'parcel', 'job', 'event', 'other'])

/** Champs éditables d'une fiche (colonnes réelles + payload JSON quand la table en a un). */
export async function updatePublicationFields(client, type, id, fields, now = new Date()) {
  if (!client) throw new Error('Client Supabase indisponible')
  const skip = SKIP_COLUMN[type] || new Set()
  const patch = {}
  const hasPayload = PAYLOAD_TYPES.has(type)
  const payload = hasPayload && fields.payload && typeof fields.payload === 'object' ? { ...fields.payload } : null
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'payload' || value === undefined) continue
    if (payload) payload[key] = value
    const column = EDIT_COLUMNS[key]
    if (!column || skip.has(key)) continue
    patch[column] = value
  }
  if (payload) patch.payload = payload
  if (!Object.keys(patch).length) return
  patch.updated_at = now.toISOString()
  await settle(client.from(tableFor(type)).update(patch).eq('id', id))
}
