import { useMediaQuery } from '../../hooks/useMediaQuery'

/** Fil TikTok — mobile uniquement (< 768 px, aligné sur `md:` Tailwind). */
export const FEED_VIEWPORT_MEDIA_QUERY = '(max-width: 767px)'

export function useIsFeedViewport() {
  return useMediaQuery(FEED_VIEWPORT_MEDIA_QUERY)
}
