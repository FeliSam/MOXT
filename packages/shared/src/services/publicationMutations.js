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
}

/** Champs éditables d'une fiche (colonnes réelles, pas le payload entier). */
export async function updatePublicationFields(client, type, id, fields, now = new Date()) {
  if (!client) throw new Error('Client Supabase indisponible')
  const patch = {}
  for (const [key, column] of Object.entries(EDIT_COLUMNS)) {
    if (fields[key] !== undefined) patch[column] = fields[key]
  }
  if (!Object.keys(patch).length) return
  patch.updated_at = now.toISOString()
  await settle(client.from(tableFor(type)).update(patch).eq('id', id))
}
