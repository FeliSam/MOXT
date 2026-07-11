export function selectOwnedBusinessIds(state, userId) {
  return (state.businesses?.items || [])
    .filter((business) => business.ownerId === userId)
    .map((business) => business.id)
}

export function selectTransfersVisibleToUser(state, userId) {
  const ownedBusinessIds = selectOwnedBusinessIds(state, userId)
  return (state.transfers?.items || []).filter(
    (transfer) =>
      transfer.userId === userId ||
      transfer.businessOwnerId === userId ||
      ownedBusinessIds.includes(transfer.businessId),
  )
}

export function canUserAccessTransfer(transfer, user, ownedBusinessIds = []) {
  if (!transfer || !user) return false
  if (['admin', 'superadmin'].includes(user.role)) return true
  if (transfer.userId === user.id) return true
  if (transfer.businessOwnerId === user.id) return true
  return ownedBusinessIds.includes(transfer.businessId)
}
