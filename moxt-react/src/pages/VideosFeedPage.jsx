import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { feedItemKey, feedPath, resolveFeedDesktopRedirect } from '../features/feed/feedItemUtils'
import { useIsFeedViewport } from '../features/feed/feedViewport'

/**
 * Compat : `/videos` et `/videos?v=` redirigent vers le fil unifié (mobile uniquement).
 */
export function VideosFeedPage() {
  const isFeedViewport = useIsFeedViewport()
  const [searchParams] = useSearchParams()
  const videoId = searchParams.get('v') || ''

  if (!isFeedViewport) {
    const to = resolveFeedDesktopRedirect({
      typeFilter: 'video',
      itemParam: videoId ? feedItemKey('video', videoId) : '',
    })
    return <Navigate to={to} replace />
  }

  const to = videoId
    ? feedPath({ type: 'video', item: feedItemKey('video', videoId) })
    : feedPath({ type: 'video' })
  return <Navigate to={to} replace />
}

/** Anciens liens partagés `/videos/:videoId` → fil vidéo. */
export function VideoShareRedirect() {
  const { videoId } = useParams()
  const to = videoId
    ? feedPath({ type: 'video', item: feedItemKey('video', videoId) })
    : feedPath({ type: 'video' })
  return <Navigate to={to} replace />
}
