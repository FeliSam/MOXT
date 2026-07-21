/** Normalize phone for duplicate detection across transfer favorite profiles. */
export function normalizeTransferProfilePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

export function findMatchingTransferProfile(profiles, party, userId) {
  const phone = normalizeTransferProfilePhone(party?.phone)
  if (!phone || !userId) return null
  return (profiles || []).find(
    (item) =>
      item.userId === userId &&
      normalizeTransferProfilePhone(item.phone) === phone,
  )
}

export function partyToTransferProfileInput(party, { userId, country, method }) {
  return {
    userId,
    firstName: String(party?.firstName || '').trim(),
    lastName: String(party?.lastName || '').trim(),
    phone: String(party?.phone || '').trim(),
    country: country || party?.country || 'RU',
    method: method || party?.method || 'mobile_money',
  }
}

/** Motifs de réclamation transfert (alignés mobile, adaptés au flux argent). */
export const TRANSFER_CLAIM_MOTIVES = [
  { key: 'non_received', labelKey: 'transfers.detail.claim.motives.nonReceived' },
  { key: 'wrong_amount', labelKey: 'transfers.detail.claim.motives.wrongAmount' },
  { key: 'fraud', labelKey: 'transfers.detail.claim.motives.fraud' },
  { key: 'delay', labelKey: 'transfers.detail.claim.motives.delay' },
  { key: 'payment_issue', labelKey: 'transfers.detail.claim.motives.paymentIssue' },
  { key: 'other', labelKey: 'transfers.detail.claim.motives.other' },
]

export function buildTransferClaimReason({ motiveKey, motiveLabel, transferId, message }) {
  const lines = [
    `[${motiveKey}] ${motiveLabel}`,
    `N° transfert : ${transferId}`,
    '',
    String(message || '').trim(),
  ]
  return lines.join('\n').trim()
}
