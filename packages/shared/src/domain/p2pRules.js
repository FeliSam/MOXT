import { isReviewVisible } from '../utils/reviewUtils.js'
import { fromRow } from '../utils/remoteRowMapper.js'

/** Copie de moxt-react/src/features/p2p/p2pUtils.js (règles d’affichage des offres). */
export const P2P_PLATFORM_FEE_PERCENT = 0

function parseJson(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

/** Même lecture que le web (features/sync/entityRemote.p2pOfferFromRemoteRow). */
export function p2pOfferFromRemoteRow(row) {
  if (!row) return null
  const base = fromRow(row)
  const payload = parseJson(row.payload ?? base.payload, {})
  return {
    ...payload,
    ...base,
    status: base.status || payload.status || 'active',
  }
}

export function p2pOrderFromRemoteRow(row) {
  if (!row) return null
  return fromRow(row)
}

/**
 * Web dashboardBrowseUtils.selectDashboardP2POffers.
 * @param {any[]} [offers]
 * @param {{ currencies?: string[], limit?: number }} [options]
 */
export function selectDashboardP2POffers(offers = [], { currencies, limit = 8 } = {}) {
  const list = Array.isArray(offers) ? offers : []
  return list
    .filter((offer) => offer?.status === 'active')
    .filter(
      (offer) =>
        !currencies?.length ||
        (currencies.includes(offer.fromCurrency) && currencies.includes(offer.toCurrency)),
    )
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit)
}

/**
 * @param {string | undefined | null} userId
 * @param {{ orders?: any[], reviews?: any[] }} [options]
 */
export function computeP2PReputation(userId, { orders = [], reviews = [] } = {}) {
  if (!userId) {
    return { avgRating: null, ratingCount: 0, completed: 0, total: 0, successRate: null }
  }
  const relevant = (orders || []).filter(
    (order) =>
      (order.buyerId === userId || order.sellerId === userId) &&
      ['completed', 'cancelled', 'disputed'].includes(order.status),
  )
  const completed = relevant.filter((order) => order.status === 'completed').length
  const total = relevant.length
  const successRate = total ? Math.round((completed / total) * 100) : null

  const profileReviews = (reviews || []).filter(
    (review) =>
      isReviewVisible(review) &&
      review.targetId === userId &&
      (review.targetType === 'user_profile' || review.targetType === 'USER_PROFILE'),
  )
  const ratingCount = profileReviews.length
  const avgRating = ratingCount
    ? Math.round(
        (profileReviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) /
          ratingCount) *
          10,
      ) / 10
    : null

  return { avgRating, ratingCount, completed, total, successRate }
}

export function calculateP2PFee(amount, _currency, feePercent = P2P_PLATFORM_FEE_PERCENT) {
  return Math.max(0, Number(amount || 0) * (Number(feePercent) / 100))
}

export function formatP2PAmountInput(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return ''
  if (numeric >= 1) {
    const rounded = Math.round(numeric * 100) / 100
    return String(rounded).replace(/\.0+$/, '')
  }
  return numeric.toFixed(6).replace(/\.?0+$/, '')
}

export function p2pReceivedFromOffered(amount, rate) {
  const offered = Number(amount)
  const numericRate = Number(rate)
  if (!(offered > 0) || !(numericRate > 0)) return ''
  return formatP2PAmountInput(offered * numericRate)
}
