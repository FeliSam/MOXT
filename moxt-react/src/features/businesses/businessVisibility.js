export function isBusinessDeletedByUser(business) {
  return Boolean(business?.deletedByUserAt)
}

export function selectActiveBusinessForOwner(businesses, ownerId) {
  return businesses.find((item) => item.ownerId === ownerId && !isBusinessDeletedByUser(item))
}

export function isBusinessVisibleToViewer(business, viewer) {
  if (!business) return false
  if (isBusinessDeletedByUser(business)) {
    return ['admin', 'superadmin'].includes(viewer?.role)
  }
  return true
}

export function filterDirectoryBusinesses(businesses) {
  return businesses.filter((business) => !isBusinessDeletedByUser(business))
}
