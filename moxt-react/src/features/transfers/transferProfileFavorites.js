/** Normalize phone for duplicate detection across transfer favorite profiles. */
export function normalizeTransferProfilePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

export function normalizeTransferProfile(profile) {
  if (!profile || typeof profile !== 'object') return profile
  return {
    ...profile,
    userId: profile.userId || profile.user_id || '',
    firstName: String(profile.firstName || profile.first_name || '').trim(),
    lastName: String(profile.lastName || profile.last_name || '').trim(),
    phone: String(profile.phone || '').trim(),
    country: String(profile.country || '').toUpperCase(),
    method: profile.method || '',
  }
}

/** RU ↔ Afrique : un profil BJ s’applique à tout pays d’origine hors Russie. */
export function transferProfileMatchesCountry(profile, country) {
  const profileCountry = String(profile?.country || '').toUpperCase()
  const target = String(country || '').toUpperCase()
  if (!profileCountry || !target) return false
  if (profileCountry === target) return true
  const profileIsRussia = profileCountry === 'RU'
  const targetIsRussia = target === 'RU'
  return profileIsRussia === targetIsRussia
}

export function findMatchingTransferProfile(profiles, party, userId) {
  const phone = normalizeTransferProfilePhone(party?.phone)
  if (!phone || !userId) return null
  return (profiles || []).find((item) => {
    const profile = normalizeTransferProfile(item)
    return profile.userId === userId && normalizeTransferProfilePhone(profile.phone) === phone
  })
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
