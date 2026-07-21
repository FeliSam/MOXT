/**
 * Helpers de filtrage Realtime (côté client — défense en profondeur).
 * Les filtres server-side scalaires (eq) sont appliqués dans realtimeService.
 */

/** Transfert visible pour l’utilisateur (client / propriétaire entreprise / businessId). */
export function isTransferRelevantToUser(transfer, userId, ownedBusinessIds = []) {
  if (!transfer || !userId) return false
  const uid = String(userId)
  if (String(transfer.userId ?? '') === uid) return true
  if (String(transfer.businessOwnerId ?? '') === uid) return true
  const businessId = transfer.businessId
  if (!businessId) return false
  return ownedBusinessIds.some((id) => String(id) === String(businessId))
}

const PUBLIC_LISTING_STATUSES = new Set(['active', 'published'])
const HIDDEN_LISTING_STATUSES = new Set(['draft', 'pending', 'pending_review', 'archived', 'expired'])

/**
 * Accepte une annonce realtime si publique, ou si elle appartient à l’utilisateur
 * (suivi multi-appareil de ses brouillons).
 */
export function shouldAcceptRealtimeListing(listing, userId) {
  if (!listing?.id) return false
  const ownerId = listing.ownerId ?? listing.owner_id
  if (userId && ownerId != null && String(ownerId) === String(userId)) return true
  const status = String(listing.status || '')
  if (HIDDEN_LISTING_STATUSES.has(status)) return false
  return PUBLIC_LISTING_STATUSES.has(status) || !status
}

export function userParticipatesInConversation(conversation, userId) {
  if (!conversation || !userId) return false
  const ids = conversation.participantIds || conversation.participant_ids || []
  return ids.map(String).includes(String(userId))
}

export function ownedBusinessIdsForUser(businesses = [], userId) {
  if (!userId) return []
  const uid = String(userId)
  return (businesses || [])
    .filter((item) => String(item.ownerId ?? item.owner_id ?? '') === uid)
    .map((item) => item.id)
    .filter(Boolean)
}
