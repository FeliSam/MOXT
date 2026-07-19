/** Normalize parcel travel-proof verification for UI badges. */
export function resolveParcelProofStatus(parcel) {
  const status = parcel?.proofStatus
  if (status === 'verified') return 'verified'
  if (status === 'rejected') return 'rejected'
  if (status === 'pending_review' || parcel?.travelProofUrl) return 'pending_review'
  return 'missing'
}

export function parcelProofLabelKey(status) {
  switch (status) {
    case 'verified':
      return 'parcels.card.proofVerified'
    case 'pending_review':
      return 'parcels.card.proofPending'
    case 'rejected':
      return 'parcels.card.proofRejected'
    default:
      return 'parcels.card.proofMissing'
  }
}

export function parcelProofTone(status) {
  switch (status) {
    case 'verified':
      return 'success'
    case 'pending_review':
      return 'warning'
    case 'rejected':
      return 'danger'
    default:
      return 'info'
  }
}
