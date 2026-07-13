import { matchUserId } from '../businesses/businessVisibility'

export function selectOwnedBusinessIds(state, userId) {
  return (state.businesses?.items || [])
    .filter((business) => matchUserId(business.ownerId, userId))
    .map((business) => business.id)
}

export function selectTransfersVisibleToUser(state, userId) {
  const ownedBusinessIds = selectOwnedBusinessIds(state, userId)
  return (state.transfers?.items || []).filter(
    (transfer) =>
      matchUserId(transfer.userId, userId) ||
      matchUserId(transfer.businessOwnerId, userId) ||
      ownedBusinessIds.includes(transfer.businessId),
  )
}

export function canUserAccessTransfer(transfer, user, ownedBusinessIds = []) {
  if (!transfer || !user) return false
  if (['admin', 'superadmin'].includes(user.role)) return true
  if (matchUserId(transfer.userId, user.id)) return true
  if (matchUserId(transfer.businessOwnerId, user.id)) return true
  return ownedBusinessIds.includes(transfer.businessId)
}
