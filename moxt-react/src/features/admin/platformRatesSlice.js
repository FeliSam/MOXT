import { createSlice } from '@reduxjs/toolkit'
import { createLocalStorage } from '../../services/createLocalStorage'
import { TRANSFER_CONFIG } from '../transfers/transferConfig'
import { P2P_CONFIG } from '../p2p/p2pUtils'

const storage = createLocalStorage('moxt-platform-rates-v1')

const EMPTY_PAIR = Object.freeze({
  originToRub: null,
  rubToOrigin: null,
})

const emptyPair = () => ({
  originToRub: null,
  rubToOrigin: null,
})

const DEFAULT_FEES = Object.freeze({
  feePercent: TRANSFER_CONFIG.feePercent,
  transferFeePercent: TRANSFER_CONFIG.rateMarginPercent,
  p2pFeePercent: P2P_CONFIG.platformFeePercent,
})

function normalizePair(raw = {}) {
  const originToRub = Number(raw.originToRub)
  const rubToOrigin = Number(raw.rubToOrigin)
  return {
    originToRub: Number.isFinite(originToRub) && originToRub > 0 ? originToRub : null,
    rubToOrigin: Number.isFinite(rubToOrigin) && rubToOrigin > 0 ? rubToOrigin : null,
  }
}

function normalizeFeeValue(value, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.min(100, n)
}

function normalizeFees(raw = {}) {
  return {
    feePercent: normalizeFeeValue(raw.feePercent, DEFAULT_FEES.feePercent),
    transferFeePercent: normalizeFeeValue(
      raw.transferFeePercent ?? raw.transferMarginPercent,
      DEFAULT_FEES.transferFeePercent,
    ),
    p2pFeePercent: normalizeFeeValue(raw.p2pFeePercent, DEFAULT_FEES.p2pFeePercent),
  }
}

function readInitial() {
  const saved = storage.read(null)
  if (!saved || typeof saved !== 'object') {
    return { pairs: {}, fees: { ...DEFAULT_FEES }, updatedAt: null, updatedBy: null }
  }
  const pairs = {}
  for (const [currency, value] of Object.entries(saved.pairs || {})) {
    pairs[currency] = {
      transfer: normalizePair(value?.transfer),
      p2p: normalizePair(value?.p2p),
    }
  }
  return {
    pairs,
    fees: normalizeFees(saved.fees),
    updatedAt: saved.updatedAt || null,
    updatedBy: saved.updatedBy || null,
  }
}

const platformRatesSlice = createSlice({
  name: 'platformRates',
  initialState: readInitial(),
  reducers: {
    setPlatformRates(state, action) {
      const { currency, kind, originToRub, rubToOrigin, updatedBy } = action.payload || {}
      if (!currency || (kind !== 'transfer' && kind !== 'p2p')) return
      if (!state.pairs[currency]) {
        state.pairs[currency] = { transfer: emptyPair(), p2p: emptyPair() }
      }
      state.pairs[currency][kind] = normalizePair({ originToRub, rubToOrigin })
      state.updatedAt = new Date().toISOString()
      state.updatedBy = updatedBy || null
    },
    clearPlatformRates(state, action) {
      const { currency, kind, updatedBy } = action.payload || {}
      if (!currency || !state.pairs[currency]) return
      if (kind === 'transfer' || kind === 'p2p') {
        state.pairs[currency][kind] = emptyPair()
      } else {
        delete state.pairs[currency]
      }
      state.updatedAt = new Date().toISOString()
      state.updatedBy = updatedBy || null
    },
    setPlatformFees(state, action) {
      const { feePercent, transferFeePercent, p2pFeePercent, updatedBy } = action.payload || {}
      state.fees = normalizeFees({
        feePercent: feePercent ?? state.fees?.feePercent,
        transferFeePercent: transferFeePercent ?? state.fees?.transferFeePercent,
        p2pFeePercent: p2pFeePercent ?? state.fees?.p2pFeePercent,
      })
      state.updatedAt = new Date().toISOString()
      state.updatedBy = updatedBy || null
    },
  },
})

export const { setPlatformRates, clearPlatformRates, setPlatformFees } = platformRatesSlice.actions
export default platformRatesSlice.reducer

/** @param {'transfer'|'p2p'} kind */
export function selectPlatformPair(state, currency, kind = 'transfer') {
  return state.platformRates?.pairs?.[currency]?.[kind] || EMPTY_PAIR
}

export function selectPlatformFees(state) {
  return normalizeFees(state.platformRates?.fees)
}

/**
 * Prefer admin-set rate for from→to, else Frankfurter fallback.
 * `pair` = { originToRub, rubToOrigin } for originCurrency ↔ RUB.
 */
export function resolveDirectedPlatformRate(
  pair,
  fromCurrency,
  toCurrency,
  originCurrency,
  frankfurterFallback,
) {
  if (!pair || !fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    return frankfurterFallback ?? null
  }
  if (fromCurrency === originCurrency && toCurrency === 'RUB') {
    return pair.originToRub || frankfurterFallback || null
  }
  if (fromCurrency === 'RUB' && toCurrency === originCurrency) {
    return pair.rubToOrigin || frankfurterFallback || null
  }
  return frankfurterFallback ?? null
}

export function platformRateSource(pair, fromCurrency, toCurrency, originCurrency, fallbackSource) {
  if (!pair) return fallbackSource
  if (fromCurrency === originCurrency && toCurrency === 'RUB' && pair.originToRub) {
    return 'Admin'
  }
  if (fromCurrency === 'RUB' && toCurrency === originCurrency && pair.rubToOrigin) {
    return 'Admin'
  }
  return fallbackSource
}
