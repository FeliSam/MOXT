import { createSlice } from '@reduxjs/toolkit'
import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-platform-rates-v1')

const EMPTY_PAIR = Object.freeze({
  originToRub: null,
  rubToOrigin: null,
})

const emptyPair = () => ({
  originToRub: null,
  rubToOrigin: null,
})

function normalizePair(raw = {}) {
  const originToRub = Number(raw.originToRub)
  const rubToOrigin = Number(raw.rubToOrigin)
  return {
    originToRub: Number.isFinite(originToRub) && originToRub > 0 ? originToRub : null,
    rubToOrigin: Number.isFinite(rubToOrigin) && rubToOrigin > 0 ? rubToOrigin : null,
  }
}

function readInitial() {
  const saved = storage.read(null)
  if (!saved || typeof saved !== 'object') {
    return { pairs: {}, updatedAt: null, updatedBy: null }
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
  },
})

export const { setPlatformRates, clearPlatformRates } = platformRatesSlice.actions
export default platformRatesSlice.reducer

/** @param {'transfer'|'p2p'} kind */
export function selectPlatformPair(state, currency, kind = 'transfer') {
  return state.platformRates?.pairs?.[currency]?.[kind] || EMPTY_PAIR
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
