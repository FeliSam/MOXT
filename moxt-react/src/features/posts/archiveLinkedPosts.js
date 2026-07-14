/** Live statuses that keep linked feed posts visible (aligned with RLS). */
export const LIVE_SOURCE_STATUSES = {
  listing: new Set(['active']),
  parcel: new Set(['active', 'full']),
  job: new Set(['active']),
  event: new Set(['published']),
  business: new Set(['verified', 'approved', 'active']),
}

export function shouldArchiveLinkedPosts(sourceType, status, { deletedByUserAt } = {}) {
  if (!sourceType || !(sourceType in LIVE_SOURCE_STATUSES)) return false
  if (sourceType === 'business' && deletedByUserAt) return true
  return !LIVE_SOURCE_STATUSES[sourceType].has(status)
}

/**
 * Collect source targets whose linked feed posts should be archived
 * after a Redux status/delete action (client mirror of DB triggers).
 */
export function collectCascadeArchiveTargets(action, before, after) {
  const targets = []
  const push = (sourceType, sourceId) => {
    if (sourceType && sourceId) targets.push({ sourceType, sourceId })
  }

  switch (action.type) {
    case 'marketplace/updateListingStatus': {
      if (shouldArchiveLinkedPosts('listing', action.payload.status)) {
        push('listing', action.payload.id)
      }
      break
    }
    case 'marketplace/deleteListing': {
      push('listing', action.payload?.id ?? action.payload)
      break
    }
    case 'parcels/updateParcelStatus': {
      if (shouldArchiveLinkedPosts('parcel', action.payload.status)) {
        push('parcel', action.payload.id)
      }
      break
    }
    case 'jobs/moderateJob': {
      if (shouldArchiveLinkedPosts('job', action.payload.status)) {
        push('job', action.payload.id)
      }
      break
    }
    case 'events/moderateEvent': {
      if (shouldArchiveLinkedPosts('event', action.payload.status)) {
        push('event', action.payload.id)
      }
      break
    }
    case 'businesses/deleteBusinessByUser': {
      push('business', action.payload.id)
      break
    }
    case 'businesses/moderateBusiness': {
      const business = after.businesses?.items?.find((item) => item.id === action.payload.id)
      if (
        business &&
        shouldArchiveLinkedPosts('business', business.status, {
          deletedByUserAt: business.deletedByUserAt,
        })
      ) {
        push('business', business.id)
      }
      break
    }
    case 'marketplace/expireListings': {
      const beforeById = new Map((before.marketplace?.items || []).map((item) => [item.id, item]))
      for (const item of after.marketplace?.items || []) {
        const prev = beforeById.get(item.id)
        if (
          prev &&
          LIVE_SOURCE_STATUSES.listing.has(prev.status) &&
          shouldArchiveLinkedPosts('listing', item.status)
        ) {
          push('listing', item.id)
        }
      }
      break
    }
    case 'jobs/expireJobs': {
      const beforeById = new Map((before.jobs?.items || []).map((item) => [item.id, item]))
      for (const item of after.jobs?.items || []) {
        const prev = beforeById.get(item.id)
        if (
          prev &&
          LIVE_SOURCE_STATUSES.job.has(prev.status) &&
          shouldArchiveLinkedPosts('job', item.status)
        ) {
          push('job', item.id)
        }
      }
      break
    }
    case 'events/expireEvents': {
      const beforeById = new Map((before.events?.items || []).map((item) => [item.id, item]))
      for (const item of after.events?.items || []) {
        const prev = beforeById.get(item.id)
        if (
          prev &&
          LIVE_SOURCE_STATUSES.event.has(prev.status) &&
          shouldArchiveLinkedPosts('event', item.status)
        ) {
          push('event', item.id)
        }
      }
      break
    }
    default:
      break
  }

  return targets
}
