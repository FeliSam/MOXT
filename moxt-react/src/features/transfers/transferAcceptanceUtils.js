import { TRANSFER_CONFIG, TRANSFER_STATUS } from './transferConfig'

export function buildAcceptanceWindow(now = Date.now()) {
  const requestedAt = new Date(now).toISOString()
  return {
    acceptanceRequired: true,
    acceptanceRequestedAt: requestedAt,
    acceptanceExpiresAt: new Date(
      now + TRANSFER_CONFIG.acceptanceWindowMinutes * 60000,
    ).toISOString(),
    acceptanceResolvedAt: null,
  }
}

export function buildPaymentDeadline(now = Date.now()) {
  return new Date(now + TRANSFER_CONFIG.paymentWindowMinutes * 60000).toISOString()
}

export function isAwaitingBusinessAcceptance(transfer) {
  return transfer?.status === TRANSFER_STATUS.PENDING_ACCEPTANCE
}

export function needsAcceptanceResolution(transfer) {
  return transfer?.status === TRANSFER_STATUS.DECLINED
}

/** Coordonnées de versement masquées tant que l'échangeur n'a pas accepté. */
export function canRevealPaymentDetails(transfer) {
  if (!transfer) return false
  if (
    transfer.status === TRANSFER_STATUS.PENDING_ACCEPTANCE ||
    transfer.status === TRANSFER_STATUS.DECLINED
  ) {
    return false
  }
  if (
    transfer.acceptanceRequired &&
    !transfer.acceptanceResolvedAt &&
    transfer.status !== TRANSFER_STATUS.PENDING
  ) {
    // Filet de sécurité pour les états ambigus.
    return ![TRANSFER_STATUS.CANCELLED, TRANSFER_STATUS.EXPIRED].includes(transfer.status)
  }
  return true
}

export function acceptanceDeadlineReached(transfer, now = Date.now()) {
  if (!transfer?.acceptanceExpiresAt) return false
  return new Date(transfer.acceptanceExpiresAt).getTime() <= now
}

export function stripPaymentDetailsFromExchanger(exchanger) {
  if (!exchanger) return exchanger
  return {
    ...exchanger,
    paymentAccount: null,
    paymentDetails: null,
  }
}
