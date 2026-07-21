import { transferLimitsForCurrency } from '../transfers/transferConfig'

export const P2P_CONFIG = {
  /** Frais plateforme P2P (0 %). */
  platformFeePercent: 0,
  /** Marge utilisateur sur le taux Frankfurter (−15 % … +15 %). */
  maxRateMarginPercent: 15,
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
