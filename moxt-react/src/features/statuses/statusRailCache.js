import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-statuses-rail-v1')
/** Réseau : resync si le cache a plus de 5 min. */
export const STATUS_RAIL_CACHE_TTL_MS = 5 * 60 * 1000
/** UI : afficher le cache jusqu’à 30 min en attendant le réseau. */
export const STATUS_RAIL_CACHE_STALE_MS = 30 * 60 * 1000

function cacheKey(userId) {
  return String(userId || '')
}

function readCacheMap() {
  const raw = storage.read({})
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
}

function readEntry(userId) {
  const key = cacheKey(userId)
  if (!key) return null
  return readCacheMap()[key] || null
}

export function isStatusRailCacheFresh(userId, ttlMs = STATUS_RAIL_CACHE_TTL_MS) {
  const entry = readEntry(userId)
  if (!entry?.savedAt) return false
  return Date.now() - entry.savedAt <= ttlMs
}

export function readStatusRailCache(userId, { allowStale = false } = {}) {
  const entry = readEntry(userId)
  if (!entry || !Array.isArray(entry.items)) return null
  const maxAge = allowStale ? STATUS_RAIL_CACHE_STALE_MS : STATUS_RAIL_CACHE_TTL_MS
  if (!entry.savedAt || Date.now() - entry.savedAt > maxAge) return null
  return entry.items.filter((item) => new Date(item.expiresAt).getTime() > Date.now())
}

export function writeStatusRailCache(userId, items) {
  const key = cacheKey(userId)
  if (!key || !Array.isArray(items)) return
  const next = readCacheMap()
  next[key] = { savedAt: Date.now(), items }
  storage.write(next)
}
