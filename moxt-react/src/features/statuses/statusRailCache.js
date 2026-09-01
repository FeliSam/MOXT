import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-statuses-rail-v1')
const CACHE_TTL_MS = 5 * 60 * 1000

function cacheKey(userId) {
  return String(userId || '')
}

export function readStatusRailCache(userId) {
  const key = cacheKey(userId)
  if (!key) return null
  const entry = storage.get(key)
  if (!entry || !Array.isArray(entry.items)) return null
  if (!entry.savedAt || Date.now() - entry.savedAt > CACHE_TTL_MS) return null
  return entry.items.filter((item) => new Date(item.expiresAt).getTime() > Date.now())
}

export function writeStatusRailCache(userId, items) {
  const key = cacheKey(userId)
  if (!key || !Array.isArray(items)) return
  storage.set(key, { savedAt: Date.now(), items })
}
