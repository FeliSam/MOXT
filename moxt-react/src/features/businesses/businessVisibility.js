export function matchUserId(left, right) {
  if (left == null || right == null) return false
  return String(left) === String(right)
}

export function isBusinessOwnedBy(business, userId) {
  return matchUserId(business?.ownerId, userId)
}

export function isBusinessDeletedByUser(business) {
  return Boolean(business?.deletedByUserAt)
}

export function selectActiveBusinessForOwner(businesses, ownerId) {
  if (!ownerId) return null
  return (
    businesses.find(
      (item) => matchUserId(item.ownerId, ownerId) && !isBusinessDeletedByUser(item),
    ) || null
  )
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
