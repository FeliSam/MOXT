import { useLayoutEffect } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { setFeedPlaybackAllowed } from '../videos/feedPlaybackSession'

/** Fil TikTok — mobile uniquement (< 768 px, aligné sur `md:` Tailwind). */
export const FEED_VIEWPORT_MEDIA_QUERY = '(max-width: 767px)'

export function useIsFeedViewport() {
  return useMediaQuery(FEED_VIEWPORT_MEDIA_QUERY)
}

/**
 * Sync plein-écran Fil : hauteur visualViewport + classe immersive + autorisation autoplay.
 * Requis aussi pour les invités (pas d’AppLayout) — sinon le scroller a une hauteur
 * nulle/instable et le snap + l’autoplay cassent.
 *
 * Sur session authentifiée, AppLayout gère déjà immersive/allowed : on ne les retire
 * pas au cleanup pour éviter une course au Strict Mode (démontage/remontage).
 */
export function useFeedMobileChrome(enabled) {
  useLayoutEffect(() => {
    if (!enabled) return undefined

    const root = document.documentElement
    root.classList.add('feed-mobile-immersive')
    setFeedPlaybackAllowed(true)

    function syncFeedViewport() {
      const vv = window.visualViewport
      const height = Math.max(1, Math.round(vv?.height ?? window.innerHeight ?? 0))
      const offsetTop = Math.round(vv?.offsetTop ?? 0)
      root.style.setProperty('--feed-viewport-height', `${height}px`)
      root.style.setProperty('--feed-viewport-offset-top', `${offsetTop}px`)
    }

    syncFeedViewport()
    window.visualViewport?.addEventListener('resize', syncFeedViewport)
    window.visualViewport?.addEventListener('scroll', syncFeedViewport)
    window.addEventListener('resize', syncFeedViewport)
    window.addEventListener('orientationchange', syncFeedViewport)
    void import('../../platform/capacitor').then(({ syncCapacitorStatusBar }) => {
      syncCapacitorStatusBar?.()
    })

    return () => {
      window.visualViewport?.removeEventListener('resize', syncFeedViewport)
      window.visualViewport?.removeEventListener('scroll', syncFeedViewport)
      window.removeEventListener('resize', syncFeedViewport)
      window.removeEventListener('orientationchange', syncFeedViewport)
      // AppLayout (#main-content) conserve immersive/allowed pour les comptes connectés.
      const appLayoutOwnsChrome = Boolean(document.getElementById('main-content'))
      if (!appLayoutOwnsChrome) {
        root.classList.remove('feed-mobile-immersive')
        root.style.removeProperty('--feed-viewport-height')
        root.style.removeProperty('--feed-viewport-offset-top')
        setFeedPlaybackAllowed(false)
      }
    }
  }, [enabled])
}
