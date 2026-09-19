import { resolveMediaDisplayUrl } from '../services/media/mediaUrlUtils.js'

/** URLs déjà chauffées en mémoire (évite de relancer Image() à chaque sync). */
const warmed = new Set()

const LISTING_COVER_CAP = 40
const VIDEO_THUMB_CAP = 24
const PREFETCH_CONCURRENCY = 6

/**
 * Cover listing typique :
 * - images[0] (marketplace)
 * - cover / coverUrl / imageUrl / thumbnailUrl (formes legacy / feed)
 */
function listingCoverUrl(listing) {
  if (!listing || typeof listing !== 'object') return ''
  const raw =
    (Array.isArray(listing.images) && listing.images[0]) ||
    listing.cover ||
    listing.coverUrl ||
    listing.imageUrl ||
    listing.thumbnailUrl ||
    ''
  if (!raw) return ''
  const asString =
    typeof raw === 'string' ? raw : raw?.url || raw?.src || raw?.path || ''
  return resolveMediaDisplayUrl(asString) || String(asString).trim() || ''
}

function videoThumbUrl(video) {
  if (!video || typeof video !== 'object') return ''
  const raw = video.thumbnailUrl || video.coverUrl || video.posterUrl || ''
  if (!raw) return ''
  return resolveMediaDisplayUrl(raw) || String(raw).trim() || ''
}

function collectUniqueUrls(items, pickUrl, cap) {
  const out = []
  const seen = new Set()
  for (const item of items || []) {
    if (out.length >= cap) break
    const url = pickUrl(item)
    if (!url || seen.has(url) || warmed.has(url)) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

export function collectCatalogMediaUrls(state) {
  const listings = state?.marketplace?.items || []
  const videos = state?.videos?.items || []
  return [
    ...collectUniqueUrls(listings, listingCoverUrl, LISTING_COVER_CAP),
    ...collectUniqueUrls(videos, videoThumbUrl, VIDEO_THUMB_CAP),
  ]
}

function preloadOne(src) {
  return new Promise((resolve) => {
    warmed.add(src)
    if (typeof Image === 'undefined') {
      resolve()
      return
    }
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

async function preloadWithConcurrency(urls, concurrency = PREFETCH_CONCURRENCY) {
  if (!urls.length) return
  let index = 0
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (index < urls.length) {
      const current = urls[index]
      index += 1
      await preloadOne(current)
    }
  })
  await Promise.all(workers)
}

/**
 * Précharge les covers Marketplace + vignettes vidéos depuis le store
 * (après un sync catalogue), avec concurrence limitée.
 */
export function prefetchCatalogMedia(store) {
  if (typeof window === 'undefined') return Promise.resolve()
  let state
  try {
    state = store?.getState?.()
  } catch {
    return Promise.resolve()
  }
  const urls = collectCatalogMediaUrls(state)
  if (!urls.length) return Promise.resolve()
  return preloadWithConcurrency(urls)
}

/** Test / reset session helper. */
export function resetPrefetchCatalogMediaCache() {
  warmed.clear()
}
