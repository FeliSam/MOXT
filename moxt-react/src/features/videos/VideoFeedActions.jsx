import { FiHeart, FiMessageCircle, FiMoreHorizontal, FiShare2, FiUserPlus } from 'react-icons/fi'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { useLanguage } from '../../contexts/useLanguage'
import { useGuestAction } from '../guest/useGuestAction'
import {
  removePublisherSubscription,
  upsertPublisherSubscription,
} from '../account/accountSlice'
import { selectPublisherSubscription } from '../account/subscriptionSelectors'
import { phase3Text } from '../../i18n/phase3I18n'
import {
  FEED_ACTION_BTN_CLASS,
  FEED_ACTION_ICON_CLASS,
  FEED_ACTION_ICON_SM_CLASS,
  FEED_ACTION_ICON_WRAP_CLASS,
  feedActionRailClass,
  FeedActionCount,
} from '../feed/feedActionStyles.jsx'
import { liveFeedSocialStats } from '../feed/feedItemUtils'

/**
 * Bouton s’abonner icon-only — après le nom (overlay bas).
 */
export function VideoSubscribeChip({ business, video, className = '' }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const { requireAccount, promptAccount } = useGuestAction()
  const publisherId = video?.businessId || business?.id
  const publisherName = video?.businessName || business?.name || ''
  const publisherPath = publisherId ? `/businesses/${publisherId}` : ''
  const subscription = useSelector((state) =>
    selectPublisherSubscription(state, user?.id, 'business', publisherId),
  )
  const isOwner = Boolean(user?.id && business?.ownerId === user.id)
  const isSubscribed = Boolean(subscription)

  if (!publisherId || isOwner || isSubscribed) return null

  function toggle(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!user?.id) {
      if (requireAccount(p3('videos.feed.guestSubscribe'))) return
      promptAccount(p3('videos.feed.guestSubscribe'))
      return
    }
    if (isSubscribed) {
      dispatch(
        removePublisherSubscription({
          userId: user.id,
          publisherType: 'business',
          publisherId,
        }),
      )
      return
    }
    dispatch(
      upsertPublisherSubscription({
        userId: user.id,
        publisherType: 'business',
        publisherId,
        notifyPref: 'all',
        publisherName,
        publisherPath,
        id: subscription?.id,
        createdAt: subscription?.createdAt,
      }),
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={p3('subscriptions.subscribe')}
      className={`grid size-7 shrink-0 place-items-center rounded-full bg-[var(--app-accent)] text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)] backdrop-blur-sm transition active:scale-95 ${className}`}
    >
      <FiUserPlus className="text-sm" />
    </button>
  )
}

export function VideoFeedActions({
  video,
  item,
  liked,
  onLike,
  onComment,
  onShare,
  onMore,
  visible = true,
}) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const social = useSelector(
    (state) => liveFeedSocialStats(state, 'video', video?.id, ''),
    shallowEqual,
  )
  const likeCount = social.likeCount
  const commentCount = social.commentCount
  const shareCount = Number(video?.shareCount) || Number(item?.stats?.shares) || 0

  function stopTouchBubble(event) {
    event.stopPropagation()
  }

  return (
    <div
      className={feedActionRailClass(visible)}
      data-testid="feed-action-rail"
      data-kind="video"
      data-entity={video?.id || ''}
      aria-hidden={visible ? undefined : true}
    >
      <button
        type="button"
        onClick={onLike}
        onPointerDown={stopTouchBubble}
        onTouchStart={stopTouchBubble}
        className={FEED_ACTION_BTN_CLASS}
        aria-pressed={liked}
      >
        <span className={`${FEED_ACTION_ICON_WRAP_CLASS} ${liked ? 'text-red-500' : ''}`}>
          <FiHeart className={`${FEED_ACTION_ICON_CLASS} ${liked ? 'fill-current' : ''}`} />
          <FeedActionCount value={likeCount} />
        </span>
      </button>

      <button
        type="button"
        onClick={onComment}
        onPointerDown={stopTouchBubble}
        onTouchStart={stopTouchBubble}
        className={FEED_ACTION_BTN_CLASS}
      >
        <span className={FEED_ACTION_ICON_WRAP_CLASS}>
          <FiMessageCircle className={FEED_ACTION_ICON_CLASS} />
          <FeedActionCount value={commentCount} />
        </span>
      </button>

      <button
        type="button"
        onClick={onShare}
        onPointerDown={stopTouchBubble}
        onTouchStart={stopTouchBubble}
        className={FEED_ACTION_BTN_CLASS}
        aria-label={p3('common.share')}
      >
        <span className={FEED_ACTION_ICON_WRAP_CLASS}>
          <FiShare2 className={FEED_ACTION_ICON_SM_CLASS} />
          <FeedActionCount value={shareCount} />
        </span>
      </button>

      <button
        type="button"
        onClick={onMore}
        onPointerDown={stopTouchBubble}
        onTouchStart={stopTouchBubble}
        className={FEED_ACTION_BTN_CLASS}
        aria-label={p3('videos.feed.moreActions')}
      >
        <span className={FEED_ACTION_ICON_WRAP_CLASS}>
          <FiMoreHorizontal className={FEED_ACTION_ICON_SM_CLASS} />
        </span>
      </button>
    </div>
  )
}
