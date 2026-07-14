const RATE_URL = 'https://api.frankfurter.dev/v2/rate/RUB/XOF'
const CACHE_KEY = 'moxt-rub-xof-rate-v1'
/** Shared online rate refresh for all `useExchangeRate` consumers. */
export const EXCHANGE_RATE_REFRESH_MS = 10 * 60 * 1000

const listeners = new Set()
let snapshot = { rate: null, loading: true }
let intervalId = null
let inFlight = null

function emit() {
  for (const listener of listeners) listener(snapshot)
}

function setSnapshot(next) {
  snapshot = next
  emit()
}

export async function getRubXofRate() {
  try {
    const response = await fetch(RATE_URL, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('Rate request failed')
    const data = await response.json()
    const rate = Number(data.rate)
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid rate')
    const result = {
      rubToXof: rate,
      xofToRub: 1 / rate,
      date: data.date || new Date().toISOString().slice(0, 10),
      source: 'Frankfurter',
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(result))
    return result
  } catch {
    const cached = readCachedRate()
    if (cached) return { ...cached, source: `${cached.source} · cache` }
    throw new Error('Exchange rate unavailable')
  }
}

export function readCachedRate() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
  } catch {
    return null
  }
}

export function getExchangeRateSnapshot() {
  return snapshot
}

async function refreshSharedRate() {
  if (inFlight) return inFlight
  inFlight = getRubXofRate()
    .then((result) => {
      setSnapshot({ rate: result, loading: false })
      return result
    })
    .catch(() => {
      // Keep last good rate (live or cache already in snapshot).
      setSnapshot({ rate: snapshot.rate, loading: false })
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

function startSharedRefresh() {
  if (intervalId != null) return
  void refreshSharedRate()
  intervalId = window.setInterval(() => {
    void refreshSharedRate()
  }, EXCHANGE_RATE_REFRESH_MS)
}

function stopSharedRefresh() {
  if (intervalId == null) return
  window.clearInterval(intervalId)
  intervalId = null
}

/**
 * Subscribe to the shared RUB/XOF rate. One fetch + one 10-minute timer
 * for the whole app, regardless of how many components call this.
 */
export function subscribeExchangeRate(listener) {
  if (snapshot.rate == null) {
    const cached = readCachedRate()
    if (cached) snapshot = { rate: cached, loading: true }
  }

  listeners.add(listener)
  listener(snapshot)
  startSharedRefresh()

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stopSharedRefresh()
  }
}
