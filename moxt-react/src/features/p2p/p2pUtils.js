import { transferLimitsForCurrency } from '../transfers/transferConfig'

export const P2P_CONFIG = {
  /** Frais plateforme P2P (0 %). */
  platformFeePercent: 0,
  /** Marge utilisateur sur le taux Frankfurter (−15 % … +15 %). */
  maxRateMarginPercent: 15,
  /** Délai acheteur pour payer + preuve (ms). */
  paymentWindowMs: 30 * 60 * 1000,
  /** Délai vendeur pour confirmer après paiement déclaré (ms). */
  confirmWindowMs: 60 * 60 * 1000,
}

/** Étapes UX de la barre de progression (clés techniques stables). */
export const P2P_ORDER_STEPS = ['engagement', 'payment', 'confirmation', 'done']

export function p2pOrderStepIndex(status) {
  switch (status) {
    case 'created':
      return 0
    case 'waiting_payment':
      return 1
    case 'completed':
      return 3
    case 'cancelled':
    case 'disputed':
      return status === 'disputed' ? 1 : 0
    default:
      return 0
  }
}

export function addMs(iso, ms) {
  const base = Date.parse(iso || '')
  if (!Number.isFinite(base)) return new Date(Date.now() + ms).toISOString()
  return new Date(base + ms).toISOString()
}

export function remainingMs(dueAt, now = Date.now()) {
  const due = Date.parse(dueAt || '')
  if (!Number.isFinite(due)) return null
  return Math.max(0, due - now)
}

export function isPastDue(dueAt, now = Date.now()) {
  const due = Date.parse(dueAt || '')
  if (!Number.isFinite(due)) return false
  return now >= due
}

export function formatCountdown(ms) {
  if (ms == null) return '--:--'
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Réputation publique d’un utilisateur à partir des commandes P2P + avis profil.
 * % = completed / (completed + cancelled + disputed) — 100 % si aucun historique.
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

export function calculateP2PFee(
  amount,
  _currency,
  feePercent = P2P_CONFIG.platformFeePercent,
) {
  return Math.max(0, Number(amount || 0) * (Number(feePercent) / 100))
}

export function clampP2PRateMargin(marginPercent) {
  const value = Number(marginPercent)
  if (!Number.isFinite(value)) return 0
  return Math.min(
    P2P_CONFIG.maxRateMarginPercent,
    Math.max(-P2P_CONFIG.maxRateMarginPercent, value),
  )
}

/** Taux affiché = Frankfurter × (1 + marge%/100). Marge positive ou négative. */
export function applyP2PRateMargin(frankfurterRate, marginPercent = 0) {
  const raw = Number(frankfurterRate)
  if (!Number.isFinite(raw) || raw <= 0) return null
  return raw * (1 + clampP2PRateMargin(marginPercent) / 100)
}

export function formatP2PRate(rate) {
  const value = Number(rate)
  if (!Number.isFinite(value) || value <= 0) return ''
  if (value >= 1) return value.toFixed(4).replace(/\.?0+$/, '')
  return value.toFixed(6).replace(/\.?0+$/, '')
}

/**
 * Taux Frankfurter pour la paire from→to (RUB ↔ devise d’origine).
 * `liveRate` vient de `useExchangeRate(originCurrency)`.
 */
export function frankfurterRateForPair(liveRate, fromCurrency, toCurrency, originCurrency) {
  if (!liveRate || !fromCurrency || !toCurrency || fromCurrency === toCurrency) return null
  if (fromCurrency === originCurrency && toCurrency === 'RUB') {
    return Number(liveRate.originToRub) || null
  }
  if (fromCurrency === 'RUB' && toCurrency === originCurrency) {
    return Number(liveRate.rubToOrigin) || null
  }
  return null
}

export function p2pLimit(user, currency) {
  const limits = transferLimitsForCurrency(currency)
  return user?.verified ? limits.verified : limits.unverified
}
