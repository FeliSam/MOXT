import { TRANSFER_STATUS, TRANSFER_TRANSITIONS } from './transferConfig'

const DONE_STATUSES = new Set([
  TRANSFER_STATUS.DECLARED,
  TRANSFER_STATUS.RECEIVED,
  TRANSFER_STATUS.PROCESSING,
  TRANSFER_STATUS.PAID_OUT,
  TRANSFER_STATUS.COMPLETED,
])

export function hasClientDeclaredPayment(transfer) {
  if (!transfer) return false
  return (
    Boolean(transfer.paymentProof) ||
    transfer.timeline?.some((event) => event.status === TRANSFER_STATUS.DECLARED) ||
    DONE_STATUSES.has(transfer.status)
  )
}

export function hasBusinessConfirmedReception(transfer) {
  if (!transfer) return false
  if (transfer.timeline?.some((event) => event.status === TRANSFER_STATUS.RECEIVED)) return true
  if (transfer.status === TRANSFER_STATUS.RECEIVED) return true
  if (hasBusinessPayoutWithProof(transfer)) return true
  if (transfer.status === TRANSFER_STATUS.COMPLETED) return true
  return false
}

/** Étape 2 entreprise : transfert confirmé avec preuve obligatoire. */
export function hasBusinessPayoutWithProof(transfer) {
  if (!transfer?.businessProof) return false
  return Boolean(
    transfer.timeline?.some((event) => event.status === TRANSFER_STATUS.PAID_OUT),
  )
}

export function hasRecipientDeclaredReception(transfer) {
  return Boolean(transfer?.receivedAt)
}

/** Réception déclarée + virement entreprise confirmé avec preuve → seule la réclamation reste possible. */
export function isClaimOnlyPhase(transfer) {
  if (!transfer) return false
  if ([TRANSFER_STATUS.CANCELLED, TRANSFER_STATUS.EXPIRED].includes(transfer.status)) return false
  return hasRecipientDeclaredReception(transfer) && hasBusinessPayoutWithProof(transfer)
}

export function canClientDeclareReception(transfer, isSender) {
  if (!isSender || !transfer || isClaimOnlyPhase(transfer)) return false
  // Client confirms fund receipt only after the business has:
  // 1) confirmed payment reception, and 2) confirmed payout with proof.
  return (
    transfer.status === TRANSFER_STATUS.PAID_OUT &&
    hasBusinessConfirmedReception(transfer) &&
    hasBusinessPayoutWithProof(transfer) &&
    !hasRecipientDeclaredReception(transfer)
  )
}

export function transferNeedsBusinessAction(transfer) {
  if (!transfer || isClaimOnlyPhase(transfer)) return false
  return [TRANSFER_STATUS.DECLARED, TRANSFER_STATUS.RECEIVED].includes(transfer.status)
}

export function transferNeedsClientAction(transfer) {
  if (!transfer || isClaimOnlyPhase(transfer)) return false
  if (transfer.status === TRANSFER_STATUS.PENDING) return true
  return (
    transfer.status === TRANSFER_STATUS.PAID_OUT &&
    hasBusinessPayoutWithProof(transfer) &&
    !hasRecipientDeclaredReception(transfer)
  )
}

export function canApplyModerateTransfer(transfer, targetStatus, proof = null) {
  if (!transfer) return false
  const expectedStatus = TRANSFER_TRANSITIONS[transfer.status]
  if (!expectedStatus || expectedStatus !== targetStatus) return false
  if (expectedStatus === TRANSFER_STATUS.PAID_OUT && !proof) return false
  return true
}

/**
 * True only for the partner business (owner / owned business id).
 * Never true for the transfer sender — even if they also own another business.
 * `business` arg kept for call-site compatibility; must not grant access by catalog match.
 */
export function isBusinessViewerForTransfer(transfer, user, _business, ownedBusinessIds = []) {
  if (!transfer || !user) return false
  // Client who created the transfer cannot act as the business on that same transfer.
  if (transfer.userId === user.id) return false
  return (
    transfer.businessOwnerId === user.id || ownedBusinessIds.includes(transfer.businessId)
  )
}

/** Client-only status changes (declare / cancel / receive→complete). */
export function canActorPerformClientTransferAction(transfer, actorId) {
  if (!transfer || !actorId) return false
  return transfer.userId === actorId
}

/** Business-only status changes (confirm reception / payout). Admin/moderator override. */
export function canActorPerformBusinessTransferAction(transfer, actorId, actorRole) {
  if (!transfer || !actorId) return false
  if (transfer.userId === actorId) return false
  if (['admin', 'superadmin', 'moderator'].includes(actorRole)) return true
  return transfer.businessOwnerId === actorId
}
