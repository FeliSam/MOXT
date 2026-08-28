import { FiUserPlus } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { EntityAvatar } from '../account/EntityAvatar'
import {
  removePublisherSubscription,
  upsertPublisherSubscription,
} from '../account/accountSlice'
import { selectPublisherSubscription } from '../account/subscriptionSelectors'
import { useGuestAction } from '../guest/useGuestAction'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { FeedBoostBadge } from './FeedBoostBadge'
import { FeedPromoBadge, FeedTrendBadge } from './FeedTrendBadge'
import { FeedCaption } from './FeedCaption'
import { FeedItemActions } from './FeedItemActions'
import { StarsGiftButton } from '../stars/StarsGiftSheet'
import {
  FEED_META_INTERACTIVE_CLASS,
  FEED_META_OVERLAY_CLASS,
  FEED_SLIDE_FRAME_CLASS,
  FEED_SLIDE_SECTION_CLASS,
} from './feedActionStyles.jsx'
export function FeedSubscribeChip({ publisher, guestKey = 'videos.feed.guestSubscribe' }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const { requireAccount, promptAccount } = useGuestAction()
  const publisherType = publisher?.type === 'user' ? 'user' : 'business'
  const publisherId = publisher?.id
  const subscription = useSelector((state) =>
    selectPublisherSubscription(state, user?.id, publisherType, publisherId),
  )
  const isOwner = Boolean(
    user?.id && (publisher?.ownerId === user.id || (publisherType === 'user' && publisherId === user.id)),
  )
  const isSubscribed = Boolean(subscription)

  if (!publisherId || isOwner || isSubscribed) return null

  function toggle(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!user?.id) {
      if (requireAccount(p3(guestKey))) return
      promptAccount(p3(guestKey))
      return
    }
    if (isSubscribed) {
      dispatch(
        removePublisherSubscription({
          userId: user.id,
          publisherType,
          publisherId,
        }),
      )
      return
    }
    dispatch(
      upsertPublisherSubscription({
        userId: user.id,
        publisherType,
        publisherId,
        notifyPref: 'all',
        publisherName: publisher?.name || '',
        publisherPath: publisher?.path || '',
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
      className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--app-accent)] text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)] backdrop-blur-sm transition active:scale-95"
    >
      <FiUserPlus className="text-sm" />
    </button>
  )
}

/**
 * Cadre commun d’une slide feed : media arrondi + meta + rail actions + subscribe.
 */
export function FeedSlideShell({
  index,
  children,
  item,
  publisher,
  title,
  caption,
  captionLines = 1,
  metaExtra,
  ctaLabel,
  ctaTo,
  showSubscribe = true,
  showActions = true,
  active = true,
  className = '',
}) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const name = publisher?.name || p3('feed.publisherFallback')
  const avatar = (
    <EntityAvatar
      name={name}
      src={publisher?.avatarUrl || ''}
      size="sm"
      shape={publisher?.type === 'business' ? 'business' : 'user'}
      ring={false}
      className="!size-8 !rounded-full ring-2 ring-white/70"
    />
  )

  const nameEl = (
    <span className="block max-w-[8.5rem] truncate text-sm font-black tracking-tight text-white sm:max-w-[11rem]">
      {name}
    </span>
  )

  return (
    <section
      data-feed-slide
      data-index={index}
      className={`${FEED_SLIDE_SECTION_CLASS} ${className}`}
    >
      <div className={FEED_SLIDE_FRAME_CLASS}>
        {item?.isFeatured || item?.isTrending || item?.isPromoted ? (
          <div className="pointer-events-none absolute right-3 z-[2] flex flex-col items-end gap-1.5 top-[calc(env(safe-area-inset-top,0px)+3.35rem)]">
            {item.isFeatured ? <FeedBoostBadge boost={item.boost} /> : null}
            {!item.isFeatured && item.isTrending ? <FeedTrendBadge /> : null}
            {!item.isFeatured && item.isPromoted ? <FeedPromoBadge /> : null}
          </div>
        ) : null}
        {children}
        <div className={FEED_META_OVERLAY_CLASS}>
          <div className={`${FEED_META_INTERACTIVE_CLASS} flex min-w-0 max-w-full items-center gap-2`}>
            {publisher?.path ? (
              <Link to={publisher.path} className="shrink-0 hover:opacity-95">
                {avatar}
              </Link>
            ) : (
              avatar
            )}
            {publisher?.path ? (
              <Link to={publisher.path} className="min-w-0 shrink hover:opacity-95">
                {nameEl}
              </Link>
            ) : (
              <span className="min-w-0 shrink">{nameEl}</span>
            )}
            {showSubscribe ? <FeedSubscribeChip publisher={publisher} /> : null}
            {showSubscribe && publisher?.id ? (
              <StarsGiftButton
                publisherType={publisher.type === 'business' ? 'business' : 'user'}
                publisherId={publisher.id}
                publisherName={publisher.name || ''}
                size="sm"
              />
            ) : null}
          </div>
          {title ? (
            <h2 className={`${FEED_META_INTERACTIVE_CLASS} mt-2 truncate text-[1.05rem] font-black leading-snug`}>
              {title}
            </h2>
          ) : null}
          {caption ? (
            <div className={FEED_META_INTERACTIVE_CLASS}>
              <FeedCaption text={caption} lines={captionLines} />
            </div>
          ) : null}
          {metaExtra ? <div className={FEED_META_INTERACTIVE_CLASS}>{metaExtra}</div> : null}
          {ctaTo && ctaLabel ? (
            <Link
              to={ctaTo}
              className={`${FEED_META_INTERACTIVE_CLASS} mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-black shadow-lg transition active:scale-95`}
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
        {showActions && item && active ? (
          <FeedItemActions key={item.id} item={item} />
        ) : null}
      </div>
    </section>
  )
}
