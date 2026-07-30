import { createSelector } from '@reduxjs/toolkit'
import { matchUserId } from '../businesses/businessVisibility'

const EMPTY = []

export function selectOwnedBusinessIds(state, userId) {
  return (state.businesses?.items || [])
    .filter((business) => matchUserId(business.ownerId, userId))
    .map((business) => business.id)
}

/** Plus récent en premier (createdAt, sinon updatedAt). */
export function sortTransfersByNewest(transfers = []) {
  return [...transfers].sort((a, b) => {
    const tb = new Date(b.createdAt || b.updatedAt || 0).getTime()
    const ta = new Date(a.createdAt || a.updatedAt || 0).getTime()
    return tb - ta
  })
}

const selectTransfersItems = (state) => state.transfers?.items || EMPTY
const selectBusinessItems = (state) => state.businesses?.items || EMPTY
const selectUserId = (_state, userId) => userId
const selectBusinessIdArg = (_state, businessId) => businessId

export const selectTransfersVisibleToUser = createSelector(
  [selectTransfersItems, selectBusinessItems, selectUserId],
  (items, businesses, userId) => {
    if (!userId) return EMPTY
    const owned = new Set(
      businesses
        .filter((business) => matchUserId(business.ownerId, userId))
        .map((business) => business.id),
    )
    const next = items.filter(
      (transfer) =>
        matchUserId(transfer.userId, userId) ||
        matchUserId(transfer.businessOwnerId, userId) ||
        owned.has(transfer.businessId),
    )
    if (!next.length) return EMPTY
    return sortTransfersByNewest(next)
  },
)

/** Transferts d’une entreprise (dashboard échangeur). */
export const selectBusinessTransfers = createSelector(
  [selectTransfersItems, selectBusinessIdArg],
  (items, businessId) => {
    if (!businessId) return EMPTY
    const next = items.filter((transfer) => transfer.businessId === businessId)
    if (!next.length) return EMPTY
    return sortTransfersByNewest(next)
  },
)

export function canUserAccessTransfer(transfer, user, ownedBusinessIds = []) {
  if (!transfer || !user) return false
  if (['admin', 'superadmin'].includes(user.role)) return true
  if (matchUserId(transfer.userId, user.id)) return true
  if (matchUserId(transfer.businessOwnerId, user.id)) return true
  return ownedBusinessIds.includes(transfer.businessId)
}
