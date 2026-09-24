import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'
import { publicationTotalCount } from './publicationCatalogUtils'

const PUBLICATION_KEYS = ['listings', 'parcels', 'jobs', 'events', 'videos', 'posts', 'others']

export function emptyPublications() {
  return {
    listings: [],
    parcels: [],
    jobs: [],
    events: [],
    videos: [],
    posts: [],
    others: [],
  }
}

/** Merge publication buckets by id (remote wins on conflict). Never drops local-only rows. */
export function mergePublications(local, remote) {
  const base = emptyPublications()
  const left = local || base
  const right = remote || base
  const out = { ...base }
  for (const key of PUBLICATION_KEYS) {
    out[key] = mergeRemoteById(left[key] || [], right[key] || [])
  }
  return out
}

/**
 * Prefer the richer of two publication maps, then merge so neither side is lost.
 * Used when a thin/failed network response must not wipe a warm local cache.
 */
export function preferRicherPublications(local, remote) {
  if (!remote && !local) return emptyPublications()
  if (!remote) return local || emptyPublications()
  if (!local) return remote
  const localCount = publicationTotalCount(local)
  const remoteCount = publicationTotalCount(remote)
  // Always merge — richer side first so order is stable for identical ids.
  if (remoteCount >= localCount) return mergePublications(local, remote)
  return mergePublications(remote, local)
}

/**
 * True when remote looks dramatically thinner than local (partial/failed pull).
 * Callers should keep local and skip marking the cache "fresh".
 */
export function isPublicationsShrink(local, remote, { minLocal = 3, ratio = 0.7 } = {}) {
  if (!local || !remote) return false
  const localCount = publicationTotalCount(local)
  const remoteCount = publicationTotalCount(remote)
  if (localCount < minLocal) return false
  if (remoteCount === 0 && localCount > 0) return true
  return remoteCount < Math.floor(localCount * ratio)
}

/**
 * Merge scoped public-page catalogs into Redux without pruning the global window.
 * Keeps Découvrir / Fil caches intact while filling gaps for this business/user.
 */
export function applyScopedPublicationsToStore(dispatch, getState, publications) {
  if (!publications || typeof dispatch !== 'function') return

  const state = typeof getState === 'function' ? getState() : null
  const pubs = publications

  void import('../marketplace/marketplaceSlice.js').then(({ setAll }) => {
    if (pubs.listings?.length) {
      dispatch(setAll({ items: pubs.listings, mode: 'merge' }))
    }
  })
  void import('../videos/videosSlice.js').then(({ setAll }) => {
    if (pubs.videos?.length) {
      dispatch(setAll({ items: pubs.videos, mode: 'merge' }))
    }
  })
  void import('../parcels/parcelSlice.js').then(({ setAll }) => {
    if (!pubs.parcels?.length) return
    const current = state?.parcels?.items || []
    dispatch(setAll({ items: mergeRemoteById(current, pubs.parcels) }))
  })
  void import('../jobs/jobSlice.js').then(({ setAll }) => {
    if (pubs.jobs?.length) {
      dispatch(setAll({ items: pubs.jobs, mode: 'merge' }))
    }
  })
  void import('../events/eventSlice.js').then(({ setAll }) => {
    if (pubs.events?.length) {
      dispatch(setAll({ items: pubs.events, mode: 'merge' }))
    }
  })
  void import('../posts/postsSlice.js').then(({ setAll }) => {
    if (!pubs.posts?.length) return
    const current = state?.posts?.items || []
    dispatch(setAll({ items: mergeRemoteById(current, pubs.posts) }))
  })

  // Persist marketplace + videos into existing IDB catalogs (best-effort).
  if (pubs.listings?.length) {
    void import('../marketplace/marketplaceListingsIdb.js')
      .then(async ({ readListingsFromIdb, writeListingsToIdb }) => {
        const current = await readListingsFromIdb()
        await writeListingsToIdb(mergeRemoteById(current, pubs.listings))
      })
      .catch(() => {})
  }
  if (pubs.videos?.length) {
    void import('../feed/feedCatalogIdb.js')
      .then(async ({ readVideosFromIdb, writeVideosToIdb }) => {
        const current = await readVideosFromIdb()
        await writeVideosToIdb(mergeRemoteById(current, pubs.videos))
      })
      .catch(() => {})
  }
  if (pubs.posts?.length) {
    void import('../feed/feedCatalogIdb.js')
      .then(async ({ readPostsFromIdb, writePostsToIdb }) => {
        const current = await readPostsFromIdb()
        await writePostsToIdb(mergeRemoteById(current, pubs.posts))
      })
      .catch(() => {})
  }
}
