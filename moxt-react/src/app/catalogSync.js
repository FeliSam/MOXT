/** Délai avant un nouveau pull Supabase complet si le catalogue feed est déjà en cache. */
export const CATALOG_SYNC_TTL_MS = 20 * 60 * 1000

/** Durée max d’un refresh forcé avant de libérer l’UI (le reste continue en fond). */
export const CATALOG_SYNC_TIMEOUT_MS = 12_000

/** Démarrage quasi immédiat du warm catalogue (UI reste cache-first via Promise.resolve). */
export const CATALOG_SYNC_WARM_DELAY_MS = 50

/**
 * Cooldown entre deux force-resync déclenchés par un catalogue incomplet
 * (évite les boucles infinies si le réseau échoue).
 */
export const CATALOG_INCOMPLETE_RESYNC_COOLDOWN_MS = 15_000

/** Seuil relatif : en dessous, le catalogue local est considéré rétréci / stale. */
export const CATALOG_INCOMPLETE_RATIO = 0.7

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

let lastIncompleteResyncAt = 0

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

export function getCatalogSyncMeta() {
  return readCatalogSyncMeta()
}

export function countActiveListings(items = []) {
  let n = 0
  for (const item of items || []) {
    if (item?.status === 'active') n += 1
  }
  return n
}

export function isCatalogSyncFresh(userId, ttlMs = CATALOG_SYNC_TTL_MS) {
  if (!userId) return false
  const meta = readCatalogSyncMeta()
  if (!meta?.at || meta.userId !== userId) return false
  return Date.now() - Date.parse(meta.at) < ttlMs
}

/**
 * True when Redux marketplace looks thinner than the last successful sync
 * (or empty while cache keys claim a catalog exists).
 */
export function isMarketplaceCatalogIncomplete(state) {
  const userId = state?.auth?.user?.id
  if (!userId) return false

  const items = state?.marketplace?.items || []
  const active = countActiveListings(items)
  const meta = readCatalogSyncMeta()

  if (items.length === 0 && hasCachedFeedCatalog() && hasUsableFeedCatalog()) {
    const cachedListings = readCachedFeedArray('moxt-listings-v1')
    if ((cachedListings?.length ?? 0) > 0) return true
  }

  if (!meta || meta.userId !== userId) return false

  const knownActive = Number(meta.activeListingCount) || 0
  const knownTotal = Number(meta.listingCount) || 0

  if (knownActive > 0 && active === 0) return true
  if (knownTotal > 0 && items.length === 0) return true

  if (knownActive >= 5 && active < Math.floor(knownActive * CATALOG_INCOMPLETE_RATIO)) {
    return true
  }
  if (knownTotal >= 5 && items.length < Math.floor(knownTotal * CATALOG_INCOMPLETE_RATIO)) {
    return true
  }

  return false
}

/** @param {{ listingCount?: number, activeListingCount?: number }} [stats] */
export function markCatalogSynced(userId, stats = {}) {
  if (typeof localStorage === 'undefined' || !userId) return
  try {
    const listingCount = Number(stats.listingCount)
    const activeListingCount = Number(stats.activeListingCount)
    localStorage.setItem(
      CATALOG_SYNC_META_KEY,
      JSON.stringify({
        userId,
        at: new Date().toISOString(),
        listingCount: Number.isFinite(listingCount) ? listingCount : 0,
        activeListingCount: Number.isFinite(activeListingCount) ? activeListingCount : 0,
      }),
    )
  } catch {
    // quota / mode privé
  }
}

/** Test helper — reset incomplete-resync cooldown. */
export function resetIncompleteResyncCooldown() {
  lastIncompleteResyncAt = 0
}

function afterCatalogSettled(store) {
  void import('./prefetchCatalogMedia.js')
    .then(({ prefetchCatalogMedia }) => prefetchCatalogMedia(store))
    .catch(() => {})
}

/**
 * Charge loadAllData en arrière-plan (toute route, dès qu’un userId est présent).
 * L’UI reste cache-first : hors `force`, on renvoie Promise.resolve() tout de suite.
 * Si le catalogue Redux paraît incomplet vs la dernière sync, force un resync
 * (avec cooldown) même quand `skipIfFresh` est demandé.
 * @param {{ dispatch: Function, getState: Function }} store
 */
export function scheduleCatalogSync(store, { force = false, skipIfFresh = false } = {}) {
  const userId = store.getState()?.auth?.user?.id
  if (!userId) return Promise.resolve()

  const incomplete = isMarketplaceCatalogIncomplete(store.getState())
  let awaitNetwork = force
  if (!force && incomplete) {
    const now = Date.now()
    if (now - lastIncompleteResyncAt >= CATALOG_INCOMPLETE_RESYNC_COOLDOWN_MS) {
      lastIncompleteResyncAt = now
      awaitNetwork = true
    }
  }

  if (!awaitNetwork && skipIfFresh && isCatalogSyncFresh(userId) && !incomplete) {
    // Déjà chauffé : ne pas relancer loadAllData (évite remount Fil au retour).
    void import('./prefetchCatalogMedia.js')
      .then(({ prefetchCatalogMedia }) => prefetchCatalogMedia(store))
      .catch(() => {})
    return Promise.resolve()
  }

  // Freshness is owned by loadAllData (listings pull succeeded only).
  // Do NOT markSynced in finally — a failed/partial sync must stay stale so
  // skipIfFresh cannot block retries for CATALOG_SYNC_TTL_MS.
  const run = () =>
    import('./loadAllData.js').then(({ loadAllData }) =>
      store.dispatch(loadAllData()).finally(() => {
        afterCatalogSettled(store)
      }),
    )

  if (awaitNetwork) {
    // Explicit force (pull-to-refresh): drop IndexedDB so network is source of truth.
    // Incomplete auto-resync keeps IDB — setAll merge-only guards partial pages,
    // and a good IDB can still hydrate if the network fails.
    if (force) {
      void import('../features/marketplace/marketplaceListingsIdb.js').then(
        ({ invalidateListingsIdb }) => invalidateListingsIdb(),
      )
      void import('../features/feed/feedCatalogIdb.js').then(({ invalidateFeedIdb }) =>
        invalidateFeedIdb(),
      )
    } else if (incomplete) {
      // Best-effort: upgrade Redux from IDB before/while the network pull runs.
      void import('../features/marketplace/marketplaceListingsIdb.js').then(
        async ({ readListingsFromIdb }) => {
          const idbItems = await readListingsFromIdb()
          const current = store.getState()?.marketplace?.items || []
          if (idbItems.length > current.length) {
            const { setAll } = await import('../features/marketplace/marketplaceSlice.js')
            store.dispatch(setAll({ items: idbItems }))
          }
        },
      )
    }
    return awaitCatalogSync(run(), CATALOG_SYNC_TIMEOUT_MS, 'loadAllData')
  }

  // Warm immédiat (indépendant de la route) — UI déjà servie depuis le cache.
  setTimeout(() => void run(), CATALOG_SYNC_WARM_DELAY_MS)
  return Promise.resolve()
}
