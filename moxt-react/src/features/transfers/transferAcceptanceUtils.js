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

/** Vrai tant que la pré-acceptation entreprise n'a pas été tranchée (acceptation ou refus). */
export function isBusinessAcceptanceBlocking(transfer) {
  if (!transfer?.acceptanceRequired) return false
  return !transfer.acceptanceResolvedAt
}

function hasUnresolvedPendingPaymentDetails(transfer) {
  if (transfer?.acceptanceResolvedAt) return false
  return Boolean(transfer?.pendingPaymentDetails || transfer?.pendingPaymentAccount)
}

/** Coordonnées de versement masquées tant que l'échangeur n'a pas accepté. */
export function canRevealPaymentDetails(transfer) {
  if (!transfer) return false
  if (
    [
      TRANSFER_STATUS.PENDING_ACCEPTANCE,
      TRANSFER_STATUS.DECLINED,
      TRANSFER_STATUS.CANCELLED,
      TRANSFER_STATUS.EXPIRED,
    ].includes(transfer.status)
  ) {
    return false
  }
  if (isBusinessAcceptanceBlocking(transfer)) {
    return false
  }
  if (hasUnresolvedPendingPaymentDetails(transfer)) {
    return false
  }
  return true
}

/** Compte destinataire (versement entreprise) visible uniquement après réception du paiement client. */
export function canShowPayoutRecipientAccount(transfer) {
  if (!transfer || !canRevealPaymentDetails(transfer)) return false
  return [
    TRANSFER_STATUS.RECEIVED,
    TRANSFER_STATUS.PROCESSING,
    TRANSFER_STATUS.PAID_OUT,
    TRANSFER_STATUS.COMPLETED,
  ].includes(transfer.status)
}

/** Le client peut déclarer un paiement uniquement après acceptation (si requise). */
export function canClientDeclarePayment(transfer) {
  if (!transfer || transfer.status !== TRANSFER_STATUS.PENDING) return false
  return canRevealPaymentDetails(transfer)
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

/** Masque les coordonnées côté client si la pré-acceptation bloque encore le paiement. */
export function sanitizeTransferPaymentVisibility(transfer) {
  if (!transfer || canRevealPaymentDetails(transfer)) return transfer
  return {
    ...transfer,
    exchanger: stripPaymentDetailsFromExchanger(transfer.exchanger),
  }
}
