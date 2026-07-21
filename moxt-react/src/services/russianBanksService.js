import { PAYMENT_METHODS } from '../features/transfers/transferConfig'

const NSPK_BANKS_URL = 'https://qr.nspk.ru/proxyapp/c2bmembers.json'
const CACHE_KEY = 'moxt-ru-banks-nspk-v1'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

let inFlight = null

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (!raw?.names?.length) return null
    return {
      names: raw.names,
      fresh: Date.now() - Number(raw.at || 0) <= CACHE_TTL_MS,
    }
  } catch {
    return null
  }
}

function writeCache(names) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), names }))
  } catch {
    /* ignore quota */
  }
}

function normalizeBankNames(payload) {
  const rows = Array.isArray(payload?.dictionary)
    ? payload.dictionary
    : Array.isArray(payload)
      ? payload
      : []
  const names = rows
    .map((row) => String(row?.bankName || row?.name || '').trim())
    .filter(Boolean)
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'ru'))
}

/** Liste des banques SBP/NSPK (API publique), avec cache + fallback local. */
export async function fetchRussianBanks() {
  const cached = readCache()
  if (cached?.fresh) return cached.names
  if (cached?.names?.length) {
    void refreshRussianBanks().catch(() => {})
    return cached.names
  }
  return refreshRussianBanks()
}

export async function refreshRussianBanks() {
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
      const timer = setTimeout(() => controller?.abort(), 8000)
      let response
      try {
        response = await fetch(NSPK_BANKS_URL, {
          headers: { Accept: 'application/json' },
          signal: controller?.signal,
        })
      } finally {
        clearTimeout(timer)
      }
      if (!response.ok) throw new Error('NSPK banks request failed')
      const data = await response.json()
      const names = normalizeBankNames(data)
      if (!names.length) throw new Error('Empty NSPK bank list')
      writeCache(names)
      return names
    } catch {
      const cached = readCache()
      if (cached?.names?.length) return cached.names
      return [...PAYMENT_METHODS.RU]
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}
