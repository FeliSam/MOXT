import { supabase } from '../../services/supabaseClient'
import { fromRow } from '../../services/remoteRowMapper'

export function businessFromRemoteRow(row) {
  if (!row) return null
  const base = fromRow(row)
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {}
  return {
    ...payload,
    ...base,
    ownerId: base.ownerId != null ? String(base.ownerId) : base.ownerId,
    deletedByUserAt: base.deletedByUserAt || payload.deletedByUserAt || null,
    hours: base.hours || payload.hours || base.scheduleSummary || '',
  }
}

export function businessToRemoteRow(business) {
  if (!business?.id || !business?.ownerId) {
    throw new Error('Entreprise incomplete : id ou ownerId manquant.')
  }

  return {
    id: business.id,
    owner_id: business.ownerId,
    name: business.name?.trim() || '',
    status: business.status || 'pending_review',
    primary_activity: business.primaryActivity || business.sector || 'services',
    secondary_activity: business.secondaryActivity || '',
    sector: business.sector?.trim() || business.primaryActivity || 'services',
    country: business.country || 'RU',
    city: business.city?.trim() || 'Moscou',
    address: business.address?.trim() || '',
    phone: business.phone?.trim() || '',
    origin_phone: business.originPhone?.trim() || '',
    email: business.email?.trim() || '',
    telegram: business.telegram?.trim() || '',
    description: business.description?.trim() || '',
    website: business.website?.trim() || '',
    logo_url: business.logoUrl?.trim() || '',
    banner_url: business.bannerUrl?.trim() || '',
    schedule_type: business.scheduleType || 'weekdays',
    schedule_summary: business.scheduleSummary || business.hours?.trim() || '',
    service_zones: business.serviceZones?.trim() || '',
    fee_percent: Number(business.feePercent) || 0,
    average_delay: business.averageDelay?.trim() || '',
    services: business.services || [],
    currencies: business.currencies || [],
    exchange_methods: business.exchangeMethods || [],
    transfer_accounts: business.transferAccounts || [],
    schedule: business.schedule || [],
    payload: {
      hours: business.hours?.trim() || business.scheduleSummary || '',
      ...(business.deletedByUserAt ? { deletedByUserAt: business.deletedByUserAt } : {}),
    },
    rating: Number(business.rating) || 0,
    activity_visibility: business.activityVisibility || 'public',
    created_at: business.createdAt || new Date().toISOString(),
    updated_at: business.updatedAt || new Date().toISOString(),
  }
}

export async function saveBusinessRemote(business) {
  const { error } = await supabase
    .from('businesses')
    .upsert(businessToRemoteRow(business), { onConflict: 'id' })
  if (error) throw error
}

export function businessMemberToRemoteRow(member) {
  return {
    id: member.id,
    business_id: member.businessId,
    name: member.name?.trim() || '',
    email: member.email?.trim() || '',
    role: member.role || 'editor',
    status: member.status || 'active',
    created_at: member.createdAt || new Date().toISOString(),
    updated_at: member.updatedAt || new Date().toISOString(),
  }
}

export function businessMemberFromRemoteRow(row) {
  return row ? fromRow(row) : null
}

export function businessDocumentToRemoteRow(document) {
  return {
    id: document.id,
    business_id: document.businessId,
    owner_id: document.ownerId,
    category: document.category || 'company',
    name: document.name || '',
    size: Number(document.size) || 0,
    type: document.type || 'application/octet-stream',
    url: document.url || null,
    storage_path: document.storagePath || null,
    status: document.status || 'pending_review',
    reviewed_by: document.reviewedBy || null,
    review_note: document.reviewNote || '',
    reviewed_at: document.reviewedAt || null,
    created_at: document.createdAt || new Date().toISOString(),
    updated_at: document.updatedAt || new Date().toISOString(),
  }
}

export function businessDocumentFromRemoteRow(row) {
  return row ? fromRow(row) : null
}

export function businessRequestToRemoteRow(request) {
  return {
    id: request.id,
    business_id: request.businessId,
    owner_id: request.ownerId,
    related_type: request.relatedType || '',
    related_id: request.relatedId || '',
    title: request.title || request.relatedType || '',
    requester_name: request.requesterName || '',
    status: request.status || 'submitted',
    timeline: request.timeline || [],
    created_at: request.createdAt || new Date().toISOString(),
    updated_at: request.updatedAt || new Date().toISOString(),
  }
}

export function businessRequestFromRemoteRow(row) {
  if (!row) return null
  const base = fromRow(row)
  return {
    ...base,
    timeline: Array.isArray(base.timeline) ? base.timeline : [],
  }
}

export async function upsertBusinessMemberRemote(member) {
  const { error } = await supabase
    .from('business_members')
    .upsert(businessMemberToRemoteRow(member), { onConflict: 'id' })
  if (error) throw error
}

export async function upsertBusinessDocumentRemote(document) {
  const { error } = await supabase
    .from('business_documents')
    .upsert(businessDocumentToRemoteRow(document), { onConflict: 'id' })
  if (error) throw error
}

export async function upsertBusinessRequestRemote(request) {
  const { error } = await supabase
    .from('business_requests')
    .upsert(businessRequestToRemoteRow(request), { onConflict: 'id' })
  if (error) throw error
}

export async function syncLocalBusinessesToRemote(businesses, ownerId) {
  if (!supabase || !ownerId || !businesses?.length) return []

  const owned = businesses.filter((item) => String(item.ownerId) === String(ownerId))
  if (!owned.length) return []

  const { data: remoteRows, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', ownerId)

  if (error) {
    console.warn('[MOXT] Lecture entreprises distantes:', error.message)
    return []
  }

  const remoteIds = new Set((remoteRows || []).map((row) => row.id))
  const pending = owned.filter((item) => item.id && !remoteIds.has(item.id))
  if (!pending.length) return []

  const results = await Promise.allSettled(pending.map((item) => saveBusinessRemote(item)))
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn('[MOXT] Sync entreprise locale:', pending[index]?.id, result.reason?.message)
    }
  })
  return pending.map((item) => item.id)
}
