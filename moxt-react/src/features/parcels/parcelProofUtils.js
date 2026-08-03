/** Normalize parcel document verification for UI badges. */
function resolveDocStatus(status, hasUrl) {
  if (status === 'verified') return 'verified'
  if (status === 'rejected') return 'rejected'
  if (status === 'pending_review' || hasUrl) return 'pending_review'
  if (status === 'missing') return 'missing'
  return hasUrl ? 'pending_review' : 'missing'
}

/** Travel / ticket proof status. */
export function resolveParcelProofStatus(parcel) {
  return resolveDocStatus(parcel?.proofStatus, Boolean(parcel?.travelProofUrl))
}

/** Passport proof status. */
export function resolveParcelPassportStatus(parcel) {
  return resolveDocStatus(parcel?.passportStatus, Boolean(parcel?.passportProofUrl))
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

export function parcelPassportLabelKey(status) {
  switch (status) {
    case 'verified':
      return 'parcels.card.passportVerified'
    case 'pending_review':
      return 'parcels.card.passportPending'
    case 'rejected':
      return 'parcels.card.passportRejected'
    default:
      return 'parcels.card.passportMissing'
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

export function initialParcelDocStatus(hasFile) {
  return hasFile ? 'pending_review' : 'missing'
}
