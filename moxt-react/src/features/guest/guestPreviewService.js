import { supabase } from '../../services/supabaseClient'
import { fromRows } from '../../services/remoteRowMapper'
import { listingFromRemoteRow } from '../marketplace/marketplaceRemote'
import { businessFromRemoteRow } from '../businesses/businessRemote'
import { reviewFromRemoteRow } from '../reviews/reviewRemote'

function mapProfile(row) {
  if (!row) return null
  return {
    id: row.id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    city: row.city || '',
    country: row.country || '',
    verified: row.status === 'verified',
    memberSince: row.created_at || row.updated_at || null,
    avatarUrl: row.avatar_url || '',
    activityVisibility: row.activity_visibility || 'public',
  }
}

function mapPublications(rowsByType) {
  return {
    listings: (rowsByType.listings || []).map(listingFromRemoteRow).filter(Boolean),
    parcels: fromRows(rowsByType.parcels || []),
    jobs: fromRows(rowsByType.jobs || []),
    events: fromRows(rowsByType.events || []),
    posts: fromRows(rowsByType.posts || []),
    others: [],
  }
}

export async function fetchGuestUserPreview(userId) {
  if (!supabase || !userId) {
    return { error: 'unavailable' }
  }

  const profileRes = await supabase
    .from('profiles')
    .select(
      'id, first_name, last_name, city, country, status, created_at, updated_at, activity_visibility, avatar_url',
    )
    .eq('id', userId)
    .maybeSingle()

  if (profileRes.error) {
    console.warn('[MOXT] Aperçu invité profil:', profileRes.error.message)
    return { error: 'unavailable' }
  }
  if (!profileRes.data) {
    return { error: 'not_found' }
  }

  const visibility = profileRes.data.activity_visibility || 'public'
  if (visibility !== 'public') {
    return { error: visibility === 'contacts' ? 'contacts' : 'private', visibility }
  }

  const [listingsRes, parcelsRes, jobsRes, eventsRes, postsRes, businessRes, reviewsRes] =
    await Promise.all([
      supabase.from('listings').select('*').eq('owner_id', userId).eq('status', 'active'),
      supabase.from('parcels').select('*').eq('owner_id', userId).in('status', ['active', 'full']),
      supabase.from('jobs').select('*').eq('owner_id', userId).eq('status', 'active'),
      supabase.from('events').select('*').eq('owner_id', userId).eq('status', 'published'),
      supabase.from('posts').select('*').eq('author_id', userId).eq('status', 'published'),
      supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userId)
        .in('status', ['verified', 'approved', 'active'])
        .limit(1)
        .maybeSingle(),
      supabase.from('reviews').select('*').eq('status', 'published'),
    ])

  const publications = mapPublications({
    listings: listingsRes.data,
    parcels: parcelsRes.data,
    jobs: jobsRes.data,
    events: eventsRes.data,
    posts: postsRes.data,
  })

  const reviews = (reviewsRes.data || [])
    .map(reviewFromRemoteRow)
    .filter(
      (review) =>
        review &&
        (review.targetId === userId ||
          publications.listings.some((item) => item.id === review.targetId) ||
          publications.parcels.some((item) => item.id === review.targetId) ||
          publications.jobs.some((item) => item.id === review.targetId) ||
          publications.events.some((item) => item.id === review.targetId)),
    )

  return {
    profile: mapProfile(profileRes.data),
    publications,
    business: businessFromRemoteRow(businessRes.data),
    reviews,
    visibility,
  }
}

export async function fetchGuestBusinessPreview(businessId) {
  if (!supabase || !businessId) {
    return { error: 'unavailable' }
  }

  const businessRes = await supabase.from('businesses').select('*').eq('id', businessId).maybeSingle()
  if (businessRes.error) {
    console.warn('[MOXT] Aperçu invité entreprise:', businessRes.error.message)
    return { error: 'unavailable' }
  }
  if (!businessRes.data) {
    return { error: 'not_found' }
  }
  if (!['verified', 'approved', 'active'].includes(businessRes.data.status)) {
    return { error: 'unavailable' }
  }

  const visibility = businessRes.data.activity_visibility || 'public'
  if (visibility !== 'public') {
    return { error: visibility === 'contacts' ? 'contacts' : 'private', visibility }
  }

  const [listingsRes, parcelsRes, jobsRes, eventsRes, reviewsRes] = await Promise.all([
    supabase.from('listings').select('*').eq('business_id', businessId).eq('status', 'active'),
    supabase.from('parcels').select('*').eq('business_id', businessId).in('status', ['active', 'full']),
    supabase.from('jobs').select('*').eq('business_id', businessId).eq('status', 'active'),
    supabase.from('events').select('*').eq('business_id', businessId).eq('status', 'published'),
    supabase.from('reviews').select('*').eq('status', 'published'),
  ])

  const publications = mapPublications({
    listings: listingsRes.data,
    parcels: parcelsRes.data,
    jobs: jobsRes.data,
    events: eventsRes.data,
    posts: [],
  })

  const reviews = (reviewsRes.data || [])
    .map(reviewFromRemoteRow)
    .filter(
      (review) =>
        review &&
        (review.targetId === businessId ||
          publications.listings.some((item) => item.id === review.targetId) ||
          publications.parcels.some((item) => item.id === review.targetId) ||
          publications.jobs.some((item) => item.id === review.targetId) ||
          publications.events.some((item) => item.id === review.targetId)),
    )

  return {
    business: businessFromRemoteRow(businessRes.data),
    publications,
    reviews,
  }
}
