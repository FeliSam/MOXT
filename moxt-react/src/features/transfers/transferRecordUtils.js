import { sanitizeTransferPaymentVisibility } from './transferAcceptanceUtils'

/** Fusionne un transfert distant sans écraser les champs locaux avec `undefined`. */
export function mergeTransferRecord(prev, next) {
  const merged = { ...prev }
  for (const [key, value] of Object.entries(next || {})) {
    if (value !== undefined) merged[key] = value
  }
  if (next?.paymentProof == null && prev?.paymentProof != null) {
    merged.paymentProof = prev.paymentProof
  }
  if (next?.businessProof == null && prev?.businessProof != null) {
    merged.businessProof = prev.businessProof
  }
  if (next?.receivedProof == null && prev?.receivedProof != null) {
    merged.receivedProof = prev.receivedProof
  }
  if (next?.noteToExchanger == null && prev?.noteToExchanger != null) {
    merged.noteToExchanger = prev.noteToExchanger
  }
  if (next?.pendingPaymentAccount == null && prev?.pendingPaymentAccount != null) {
    merged.pendingPaymentAccount = prev.pendingPaymentAccount
  }
  if (next?.pendingPaymentDetails == null && prev?.pendingPaymentDetails != null) {
    merged.pendingPaymentDetails = prev.pendingPaymentDetails
  }
  return merged
}

export function mergeTransferItems(localItems = [], remoteItems = []) {
  const merged = new Map(
    (localItems || []).map((item) => [item.id, sanitizeTransferPaymentVisibility(item)]),
  )
  for (const remote of remoteItems || []) {
    if (!remote?.id) continue
    const local = merged.get(remote.id)
    const combined = local ? mergeTransferRecord(local, remote) : remote
    merged.set(remote.id, sanitizeTransferPaymentVisibility(combined))
  }
  return [...merged.values()]
}
