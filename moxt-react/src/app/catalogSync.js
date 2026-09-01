/** Délai avant un nouveau pull Supabase complet si le catalogue feed est déjà en cache. */
export const CATALOG_SYNC_TTL_MS = 20 * 60 * 1000

/** Durée max d’un refresh forcé (pull-to-refresh) avant de libérer l’UI. */
export const CATALOG_SYNC_TIMEOUT_MS = 45_000

function awaitCatalogSync(promise, ms = CATALOG_SYNC_TIMEOUT_MS, label = 'catalogSync') {
  let timer
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => {
        console.warn(`[${label}] timeout après ${ms}ms — sync en arrière-plan`)
        resolve(undefined)
      }, ms)
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

const CATALOG_SYNC_META_KEY = 'moxt-catalog-sync-v1'

const FEED_CACHE_KEYS = ['moxt-listings-v1', 'moxt-videos-v1', 'moxt-businesses-v1']

function readCatalogSyncMeta() {
  if (typeof localStorage === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(CATALOG_SYNC_META_KEY) || 'null')
  } catch {
    return null
  }
}

function readCachedFeedArray(key) {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Présence des clés localStorage (même tableaux vides). */
export function hasCachedFeedCatalog() {
  if (typeof localStorage === 'undefined') return false
  return FEED_CACHE_KEYS.every((key) => readCachedFeedArray(key) != null)
}

/** Cache exploitable pour afficher le fil sans pull immédiat. */
export function hasUsableFeedCatalog() {
  if (!hasCachedFeedCatalog()) return false
  return FEED_CACHE_KEYS.some((key) => (readCachedFeedArray(key)?.length ?? 0) > 0)
}

export function isCatalogSyncFresh(userId, ttlMs = CATALOG_SYNC_TTL_MS) {
  if (!userId) return false
  const meta = readCatalogSyncMeta()
  if (!meta?.at || meta.userId !== userId) return false
  return Date.now() - Date.parse(meta.at) < ttlMs
}

export function markCatalogSynced(userId) {
  if (typeof localStorage === 'undefined' || !userId) return
  try {
    localStorage.setItem(
      CATALOG_SYNC_META_KEY,
      JSON.stringify({ userId, at: new Date().toISOString() }),
    )
  } catch {
    // quota / mode privé
  }
}

/**
 * Charge loadAllData en arrière-plan sauf sync forcée (login explicite).
 * @param {{ dispatch: Function, getState: Function }} store
 */
export function scheduleCatalogSync(store, { force = false } = {}) {
  const userId = store.getState()?.auth?.user?.id
  if (!userId) return Promise.resolve()

  const usable = hasUsableFeedCatalog()

  if (!force && usable && isCatalogSyncFresh(userId)) {
    return Promise.resolve()
  }

  const run = () =>
    import('./loadAllData.js').then(({ loadAllData }) =>
      store.dispatch(loadAllData()).finally(() => markCatalogSynced(userId)),
    )

  if (force) {
    return awaitCatalogSync(run(), CATALOG_SYNC_TIMEOUT_MS, 'loadAllData')
  }

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => void run(), { timeout: usable ? 12000 : 2000 })
  } else {
    setTimeout(() => void run(), usable ? 2500 : 350)
  }
  return Promise.resolve()
}
