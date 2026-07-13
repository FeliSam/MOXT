import { supabase } from '../../services/supabaseClient'
import { normalizeListingImages } from './listingImageUtils'

const BASE_COLUMNS = {
  ownerId: 'owner_id',
  businessId: 'business_id',
  sellerName: 'seller_name',
  sellerType: 'seller_type',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  expiresAt: 'expires_at',
}

function listingToRemoteRow(listing) {
  const row = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    type: listing.type,
    category: listing.category,
    status: listing.status,
    price: listing.price,
    currency: listing.currency,
    country: listing.country,
    city: listing.city,
    address: listing.address,
    images: listing.images || [],
    payload: listing,
  }

  for (const [source, target] of Object.entries(BASE_COLUMNS)) {
    row[target] = listing[source] ?? null
  }
  return row
}

export function listingFromRemoteRow(row) {
  if (!row) return null
  const base = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey =
      Object.entries(BASE_COLUMNS).find(([, databaseKey]) => databaseKey === key)?.[0] || key
    if (key !== 'payload') base[camelKey] = value
  }
  const listing = { ...(row.payload || {}), ...base }
  listing.images = normalizeListingImages(row.images, row.payload?.images, listing.images)
  return listing
}

export function listingQuestionFromRemoteRow(row) {
  if (!row) return null
  return {
    id: row.id,
    listingId: row.listing_id || row.listingId,
    authorId: row.author_id || row.authorId,
    authorName: row.author_name || row.authorName || '',
    text: row.text || '',
    answer: row.answer || '',
    answeredAt: row.answered_at || row.answeredAt || null,
    createdAt: row.created_at || row.createdAt,
  }
}

export function listingQuestionToRemoteRow(question, listingId) {
  return {
    id: question.id,
    listing_id: listingId,
    author_id: question.authorId,
    author_name: question.authorName,
    text: question.text,
    answer: question.answer || '',
    answered_at: question.answeredAt || null,
    created_at: question.createdAt,
  }
}

export function mergeListingQuestions(listings, questionRows = []) {
  const byListing = new Map()
  for (const row of questionRows) {
    const question = listingQuestionFromRemoteRow(row)
    if (!question?.listingId) continue
    const bucket = byListing.get(question.listingId) || []
    bucket.push(question)
    byListing.set(question.listingId, bucket)
  }

  return listings.map((listing) => {
    const remoteQuestions = byListing.get(listing.id)
    if (!remoteQuestions?.length) return listing
    return { ...listing, questions: remoteQuestions }
  })
}

async function upsertRow(row) {
  return supabase
    .from('listings')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single()
}

function isMissingPayloadColumn(error) {
  return (
    error?.code === 'PGRST204' &&
    String(error.message || '')
      .toLowerCase()
      .includes('payload')
  )
}

export async function saveListingRemote(listing) {
  if (!supabase) throw new Error('Supabase non configuré.')
  const row = listingToRemoteRow(listing)
  let { data, error } = await upsertRow(row)

  // Compatibilité temporaire avec une base distante dont la migration
  // Marketplace n'a pas encore été exécutée ou dont le cache est obsolète.
  if (isMissingPayloadColumn(error)) {
    const legacyRow = { ...row }
    delete legacyRow.payload
    ;({ data, error } = await upsertRow(legacyRow))
  }

  if (error) {
    throw new Error(
      isMissingPayloadColumn(error)
        ? "La colonne listings.payload manque encore dans Supabase. Appliquez la migration Marketplace."
        : error.message,
    )
  }
  return { ...listing, ...listingFromRemoteRow(data) }
}
