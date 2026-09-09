import { useRef, useState } from 'react'
import { FiHeart } from 'react-icons/fi'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { useGuestAction } from '../guest/useGuestAction'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { toggleListingLike } from '../marketplace/marketplaceSlice'
import { toggleLike } from '../posts/postsSlice'
import { toggleVideoLike } from '../videos/videosSlice'
import { liveFeedSocialStats } from './feedItemUtils'

const LIKEABLE = new Set(['listing', 'post', 'video'])
const DOUBLE_MS = 420
const TAP_PX = 56

export function FeedDoubleTapLike({ item, children }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const { requireAccount, promptAccount } = useGuestAction()
  const liked = useSelector(
    (state) => liveFeedSocialStats(state, item?.kind, item?.entityId, state.auth.user?.id).liked,
    shallowEqual,
  )
  const lastTap = useRef(null)
  const [burst, setBurst] = useState(null)

  if (!item || !LIKEABLE.has(item.kind) || !item.entityId) {
    return children
  }

  function likeItem() {
    if (!user?.id) {
      if (requireAccount(p3('videos.feed.guestLike'))) return false
      promptAccount(p3('videos.feed.guestLike'))
      return false
    }
    if (liked) return true
    if (item.kind === 'listing') {
      dispatch(toggleListingLike({ listingId: item.entityId, userId: user.id }))
    } else if (item.kind === 'post') {
      dispatch(toggleLike({ postId: item.entityId, userId: user.id }))
    } else if (item.kind === 'video') {
      dispatch(toggleVideoLike({ videoId: item.entityId, userId: user.id }))
    }
    return true
  }

  function showBurst(clientX, clientY, currentTarget) {
    const ok = likeItem()
    if (!ok) return
    const rect = currentTarget.getBoundingClientRect()
    const id = `${Date.now()}`
    setBurst({ id, x: clientX - rect.left, y: clientY - rect.top })
    window.setTimeout(() => {
      setBurst((current) => (current?.id === id ? null : current))
    }, 700)
  }

  function ignoreTarget(event) {
    return Boolean(event.target.closest?.('a, button, input, textarea, [data-feed-no-like]'))
  }

  function onPointerUp(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (ignoreTarget(event)) return

    const now = Date.now()
    const x = event.clientX
    const y = event.clientY
    const prev = lastTap.current
    lastTap.current = { t: now, x, y }

    if (
      !prev ||
      now - prev.t > DOUBLE_MS ||
      Math.hypot(x - prev.x, y - prev.y) > TAP_PX
    ) {
      return
    }

    lastTap.current = null
    showBurst(x, y, event.currentTarget)
  }

  function onDoubleClick(event) {
    if (ignoreTarget(event)) return
    lastTap.current = null
    showBurst(event.clientX, event.clientY, event.currentTarget)
  }

  return (
    <div className="relative h-full w-full touch-manipulation" onPointerUp={onPointerUp} onDoubleClick={onDoubleClick}>
      {children}
      {burst ? (
        <span
          className="pointer-events-none absolute z-[45] -translate-x-1/2 -translate-y-1/2 text-red-500"
          style={{ left: burst.x, top: burst.y }}
        >
          <FiHeart className="feed-double-tap-heart fill-current drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]" />
        </span>
      ) : null}
    </div>
  )
}
