const RATE_BASE_URL = 'https://api.frankfurter.dev/v2/rate'
/** Shared online rate refresh for all `useExchangeRate` consumers. */
export const EXCHANGE_RATE_REFRESH_MS = 10 * 60 * 1000

const pairs = new Map()

function cacheKey(base, quote) {
  return `moxt-rate-${base}-${quote}-v1`
}

function pairKey(base, quote) {
  return `${base}_${quote}`
}

function getPairState(base, quote) {
  const key = pairKey(base, quote)
  if (!pairs.has(key)) {
    pairs.set(key, {
      listeners: new Set(),
      snapshot: { rate: null, loading: true },
      intervalId: null,
      inFlight: null,
    })
  }
  return pairs.get(key)
}

function emit(state) {
  for (const listener of state.listeners) listener(state.snapshot)
}

function setSnapshot(state, next) {
  state.snapshot = next
  emit(state)
}

const RATE_FETCH_TIMEOUT_MS = 3000

/** Live rate for base->quote (e.g. fetchRate('RUB', 'NGN')). */
export async function fetchRate(base, quote) {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer = setTimeout(() => controller?.abort(), RATE_FETCH_TIMEOUT_MS)
    let response
    try {
      response = await fetch(`${RATE_BASE_URL}/${base}/${quote}`, {
        headers: { Accept: 'application/json' },
        signal: controller?.signal,
      })
    } finally {
      clearTimeout(timer)
    }
    if (!response.ok) throw new Error('Rate request failed')
    const data = await response.json()
    const rate = Number(data.rate)
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid rate')
    const result = {
      baseToQuote: rate,
      quoteToBase: 1 / rate,
      date: data.date || new Date().toISOString().slice(0, 10),
      source: 'Frankfurter',
    }
    localStorage.setItem(cacheKey(base, quote), JSON.stringify(result))
    return result
  } catch {
    const cached = readCachedRate(base, quote)
    if (cached) return { ...cached, source: `${cached.source} · cache` }
    throw new Error('Exchange rate unavailable')
  }
}

export function readCachedRate(base, quote) {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(base, quote)) || 'null')
  } catch {
    return null
  }
}

export function getExchangeRateSnapshot(base, quote) {
  return getPairState(base, quote).snapshot
}

async function refreshSharedRate(base, quote) {
  const state = getPairState(base, quote)
  if (state.inFlight) return state.inFlight
  state.inFlight = fetchRate(base, quote)
    .then((result) => {
      setSnapshot(state, { rate: result, loading: false })
      return result
    })
    .catch(() => {
      // Keep last good rate (live or cache already in snapshot).
      setSnapshot(state, { rate: state.snapshot.rate, loading: false })
    })
    .finally(() => {
      state.inFlight = null
    })
  return state.inFlight
}

function startSharedRefresh(base, quote) {
  const state = getPairState(base, quote)
  if (state.intervalId != null) return
  void refreshSharedRate(base, quote)
  state.intervalId = window.setInterval(() => {
    void refreshSharedRate(base, quote)
  }, EXCHANGE_RATE_REFRESH_MS)
}

function stopSharedRefresh(base, quote) {
  const state = getPairState(base, quote)
  if (state.intervalId == null) return
  window.clearInterval(state.intervalId)
  state.intervalId = null
}

/**
 * Subscribe to the shared base/quote rate. One fetch + one 10-minute timer
 * per currency pair for the whole app, regardless of how many components call this.
 */
export function subscribeExchangeRate(base, quote, listener) {
  const state = getPairState(base, quote)
  if (state.snapshot.rate == null) {
    const cached = readCachedRate(base, quote)
    if (cached) state.snapshot = { rate: cached, loading: true }
  }

  state.listeners.add(listener)
  listener(state.snapshot)
  startSharedRefresh(base, quote)

  return () => {
    state.listeners.delete(listener)
    if (state.listeners.size === 0) stopSharedRefresh(base, quote)
  }
}
