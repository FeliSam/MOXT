import { coreServices, quickActions } from './dashboardConfig'

/** URLs déjà chauffées en mémoire (évite de relancer Image() à chaque navigation). */
const warmed = new Set()

export function collectDashboardServiceImageUrls() {
  const urls = new Set()
  for (const item of [...coreServices, ...quickActions]) {
    if (item.image) urls.add(item.image)
    if (item.imageLogo) urls.add(item.imageLogo)
  }
  return [...urls]
}

/**
 * Précharge les PNG services (3D + logos) une seule fois par session.
 * Le SW les met aussi en cache (cache-first) pour les retours sur l’accueil.
 */
export function preloadDashboardServiceImages() {
  if (typeof window === 'undefined') return Promise.resolve()

  const urls = collectDashboardServiceImageUrls().filter((src) => !warmed.has(src))
  if (urls.length === 0) return Promise.resolve()

  return Promise.all(
    urls.map(
      (src) =>
        new Promise((resolve) => {
          warmed.add(src)
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = src
        }),
    ),
  )
}
