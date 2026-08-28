import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FiBriefcase,
  FiCalendar,
  FiCopy,
  FiExternalLink,
  FiFlag,
  FiHeart,
  FiMessageCircle,
  FiMoreHorizontal,
  FiPackage,
  FiShare2,
  FiX,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/useLanguage'
import { useGuestAction } from '../guest/useGuestAction'
import { toggleListingFavorite } from '../marketplace/marketplaceSlice'
import { toggleLike } from '../posts/postsSlice'
import { useShareEntity } from '../share/useShareEntity'
import { addToast } from '../ui/uiSlice'
import { phase3Text } from '../../i18n/phase3I18n'
import { liveFeedSocialStats } from './feedItemUtils'
import {
  FEED_ACTION_BTN_CLASS,
  FEED_ACTION_ICON_CLASS,
  FEED_ACTION_ICON_SM_CLASS,
  FEED_ACTION_ICON_WRAP_CLASS,
  FEED_ACTION_RAIL_CLASS,
  FeedActionCount,
} from './feedActionStyles.jsx'

function stopTouchBubble(event) {
  event.stopPropagation()
}

function FeedMoreSheet({ item, open, onClose }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function requestClose() {
    setClosing(true)
    setTimeout(() => {
      onClose()
      setClosing(false)
    }, 220)
  }

  async function copyLink() {
    const path = item.feedHref || item.href || '/feed'
    const url =
      typeof window === 'undefined' ? path : `${window.location.origin}${path}`
    try {
      await navigator.clipboard?.writeText(url)
      dispatch(
        addToast({
          title: p3('videos.feed.linkCopiedTitle'),
          message: p3('feed.linkCopiedBody'),
          tone: 'success',
        }),
      )
    } catch {
      dispatch(
        addToast({
          title: p3('videos.feed.linkCopyFailed'),
          tone: 'error',
        }),
      )
    }
    requestClose()
  }

  if (!open && !closing) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)]">
      <button
        type="button"
        aria-label={p3('videos.feed.closeMore')}
        onClick={requestClose}
        className={`absolute inset-0 bg-black/55 ${
          closing ? 'animate-[fadeOut_200ms_ease-in_forwards]' : 'animate-[fadeIn_200ms_ease-out_forwards]'
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 rounded-t-[1.4rem] border border-b-0 border-white/10 bg-[#121212] text-white ${
          closing ? 'drawer-leave' : 'drawer-enter'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full bg-white/25" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2 pt-1">
          <p className="text-sm font-black">{p3('videos.feed.moreTitle')}</p>
          <button
            type="button"
            onClick={requestClose}
            className="grid size-9 place-items-center rounded-full bg-white/10"
            aria-label={p3('videos.feed.closeMore')}
          >
            <FiX />
          </button>
        </div>
        <div className="grid gap-1 px-3 pb-4">
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold hover:bg-white/8"
          >
            <FiCopy className="text-lg opacity-80" />
            {p3('videos.feed.copyLink')}
          </button>
          {item.href ? (
            <Link
              to={item.href}
              onClick={requestClose}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold hover:bg-white/8"
            >
              <FiShare2 className="text-lg opacity-80" />
              {p3('feed.openDetail')}
            </Link>
          ) : null}
          <Link
            to={`/support?topic=${encodeURIComponent(item.kind)}&id=${encodeURIComponent(item.entityId || '')}`}
            onClick={requestClose}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold hover:bg-white/8"
          >
            <FiFlag className="text-lg opacity-80" />
            {p3('videos.feed.report')}
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  )
}

const OPEN_ICON = {
  parcel: FiPackage,
  job: FiBriefcase,
  event: FiCalendar,
  discovery: FiExternalLink,
}

function railKeysForKind(kind) {
  if (kind === 'post' || kind === 'listing') return ['like', 'comment', 'share', 'more']
  if (kind === 'parcel' || kind === 'job' || kind === 'event' || kind === 'discovery') {
    return ['open', 'share', 'more']
  }
  return ['open', 'share', 'more']
}

/**
 * Rail d’actions par type de publication (annonce ≠ colis ≠ découverte).
 * Monté seulement sur la slide active (position fixed hors shell mobile).
 */
export function FeedItemActions({ item }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const { requireAccount, promptAccount } = useGuestAction()
  const [moreOpen, setMoreOpen] = useState(false)
  const entityKey = `${item.kind}:${item.entityId || item.id}`
  const railKeys = railKeysForKind(item.kind)
  const social = useSelector((state) =>
    liveFeedSocialStats(state, item.kind, item.entityId, user?.id),
  )

  const liked = social.liked
  const likeCount = social.likeCount
  const commentCount = social.commentCount

  const shareUrl =
    typeof window === 'undefined'
      ? item.feedHref || item.href || '/feed'
      : `${window.location.origin}${item.feedHref || item.href || '/feed'}`

  const share = useShareEntity({
    title: item.title || 'MOXT',
    url: shareUrl,
  })

  const OpenIcon = OPEN_ICON[item.kind] || FiExternalLink
  const openLabel =
    item.kind === 'listing'
      ? p3('feed.cta.listing')
      : item.kind === 'parcel'
        ? p3('feed.cta.parcel')
        : item.kind === 'job'
          ? p3('feed.cta.job')
          : item.kind === 'event'
            ? p3('feed.cta.event')
            : item.kind === 'post'
              ? p3('feed.cta.post')
              : p3('feed.openDetail')

  function goDetail() {
    if (item.href) navigate(item.href)
  }

  function handleLike() {
    if (item.kind === 'post' && item.entityId) {
      if (!user?.id) {
        if (requireAccount(p3('videos.feed.guestLike'))) return
        promptAccount(p3('videos.feed.guestLike'))
        return
      }
      dispatch(toggleLike({ postId: item.entityId, userId: user.id }))
      return
    }
    if (item.kind === 'listing' && item.entityId) {
      if (!user?.id) {
        if (requireAccount(p3('videos.feed.guestLike'))) return
        promptAccount(p3('videos.feed.guestLike'))
        return
      }
      dispatch(toggleListingFavorite({ listingId: item.entityId, userId: user.id }))
    }
  }

  function renderAction(key) {
    if (key === 'like') {
      return (
        <button
          key={key}
          type="button"
          onClick={handleLike}
          onPointerDown={stopTouchBubble}
          onTouchStart={stopTouchBubble}
          className={FEED_ACTION_BTN_CLASS}
          aria-pressed={liked}
          aria-label={p3('feed.actions.like')}
        >
          <span className={`${FEED_ACTION_ICON_WRAP_CLASS} ${liked ? 'text-red-500' : ''}`}>
            <FiHeart className={`${FEED_ACTION_ICON_CLASS} ${liked ? 'fill-current' : ''}`} />
            <FeedActionCount key={`${entityKey}-likes`} value={likeCount} />
          </span>
        </button>
      )
    }
    if (key === 'comment') {
      return (
        <button
          key={key}
          type="button"
          onClick={goDetail}
          onPointerDown={stopTouchBubble}
          onTouchStart={stopTouchBubble}
          className={FEED_ACTION_BTN_CLASS}
          aria-label={p3('feed.actions.comment')}
        >
          <span className={FEED_ACTION_ICON_WRAP_CLASS}>
            <FiMessageCircle className={FEED_ACTION_ICON_CLASS} />
            <FeedActionCount key={`${entityKey}-comments`} value={commentCount} />
          </span>
        </button>
      )
    }
    if (key === 'open') {
      return (
        <button
          key={key}
          type="button"
          onClick={goDetail}
          onPointerDown={stopTouchBubble}
          onTouchStart={stopTouchBubble}
          className={FEED_ACTION_BTN_CLASS}
          aria-label={openLabel}
        >
          <span className={FEED_ACTION_ICON_WRAP_CLASS}>
            <OpenIcon className={FEED_ACTION_ICON_CLASS} />
          </span>
        </button>
      )
    }
    if (key === 'share') {
      return (
        <button
          key={key}
          type="button"
          onClick={share}
          onPointerDown={stopTouchBubble}
          onTouchStart={stopTouchBubble}
          className={FEED_ACTION_BTN_CLASS}
          aria-label={p3('common.share')}
        >
          <span className={FEED_ACTION_ICON_WRAP_CLASS}>
            <FiShare2 className={FEED_ACTION_ICON_SM_CLASS} />
          </span>
        </button>
      )
    }
    return (
      <button
        key={key}
        type="button"
        onClick={() => setMoreOpen(true)}
        onPointerDown={stopTouchBubble}
        onTouchStart={stopTouchBubble}
        className={FEED_ACTION_BTN_CLASS}
        aria-label={p3('videos.feed.moreActions')}
      >
        <span className={FEED_ACTION_ICON_WRAP_CLASS}>
          <FiMoreHorizontal className={FEED_ACTION_ICON_SM_CLASS} />
        </span>
      </button>
    )
  }

  return (
    <>
      <div
        className={FEED_ACTION_RAIL_CLASS}
        data-testid="feed-action-rail"
        data-kind={item.kind}
        data-entity={item.entityId || item.id}
      >
        {railKeys.map(renderAction)}
      </div>
      <FeedMoreSheet item={item} open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
