const RATE_URL = 'https://api.frankfurter.dev/v2/rate/RUB/XOF'
const CACHE_KEY = 'moxt-rub-xof-rate-v1'

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
