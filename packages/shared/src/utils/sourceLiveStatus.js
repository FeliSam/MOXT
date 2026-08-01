/** Un colis est archivé côté navigation dès qu'il est terminé ou que le départ est passé,
 * même si son `status` reste littéralement 'active' (cf. features/parcels/parcelUtils.js). */
function isParcelBrowseArchived(parcel, today = new Date().toISOString().slice(0, 10)) {
  const departure = parcel?.departureDate ?? parcel?.departure_date ?? null
  return parcel?.status === 'completed' || Boolean(departure && departure < today)
}

/** Live statuses that keep a catalog item visible to users other than its owner (aligned with RLS). */
export const LIVE_SOURCE_STATUSES = {
  listing: new Set(['active']),
  parcel: new Set(['active', 'full']),
  job: new Set(['active']),
  event: new Set(['published']),
  business: new Set(['verified', 'approved', 'active']),
}

/**
 * True if `item` (a listing/parcel/job/event/business) should still be visible to
 * someone other than its owner: not deleted, not archived/expired/sold/rejected.
 * Used to hide stale references (favorites, feed posts, related content) once the
 * source item is deleted or leaves its "live" status — otherwise a cached local
 * copy or a favorite snapshot would keep showing it after removal.
 */
export function isSourceItemLive(sourceType, item) {
  if (!(sourceType in LIVE_SOURCE_STATUSES)) return true
  if (!item) return false
  if (sourceType === 'business' && item.deletedByUserAt) return false
  if (sourceType === 'parcel' && isParcelBrowseArchived(item)) return false
  return LIVE_SOURCE_STATUSES[sourceType].has(item.status)
}
