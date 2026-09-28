import { fromRows } from '../utils/remoteRowMapper.js'
import { mergeRemoteById } from '../utils/mergeRemoteById.js'
import { REVIEW_TARGET_TYPES } from '../utils/reviewUtils.js'
import { rowsOrEmpty } from './rowUtils.js'

export const ACCOUNT_ROWS_LIMIT = 200

/**
 * Avis liés au profil (table `reviews`, comme le web) : reçus sur le profil + rédigés par le compte.
 * Remplace l’ancienne table mobile `ratings` qui n’existe pas côté web.
 */
export async function fetchProfileReviews(client, userId, { limit = ACCOUNT_ROWS_LIMIT } = {}) {
  if (!client || !userId) return { received: [], authored: [], average: null }
  const [receivedRes, authoredRes] = await Promise.all([
    client
      .from('reviews')
      .select('*')
      .eq('target_type', REVIEW_TARGET_TYPES.USER_PROFILE)
      .eq('target_id', userId)
      .limit(limit),
    client.from('reviews').select('*').eq('author_id', userId).limit(limit),
  ])
  const received = fromRows(rowsOrEmpty(receivedRes)).filter((item) => item.status !== 'rejected')
  const authored = fromRows(rowsOrEmpty(authoredRes))
  const scores = received.map((item) => Number(item.rating)).filter((value) => Number.isFinite(value))
  const average = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null
  return { received, authored, average }
}

/**
 * Vérification d’identité comme le web : `verification_requests` + `identity_profiles`
 * (remplace les tables mobiles `kyc` / `kyc_requests`).
 */
export async function fetchVerificationStatus(client, userId, { limit = ACCOUNT_ROWS_LIMIT } = {}) {
  if (!client || !userId) return { requests: [], identityProfiles: [], latest: null, verified: false }
  const [requestsRes, identityRes] = await Promise.all([
    client.from('verification_requests').select('*').eq('user_id', userId).limit(limit),
    client.from('identity_profiles').select('*').eq('user_id', userId).limit(limit),
  ])
  const requests = mergeRemoteById([], fromRows(rowsOrEmpty(requestsRes))).sort(
    (left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0),
  )
  const identityProfiles = fromRows(rowsOrEmpty(identityRes))
  const latest = requests[0] || null
  const verified = requests.some((item) => item.status === 'approved' || item.status === 'verified')
  return { requests, identityProfiles, latest, verified }
}
