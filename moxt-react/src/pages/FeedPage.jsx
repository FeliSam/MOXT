import { useEffect, useMemo, useRef } from 'react'
import { buildFeedRankContext } from '../features/feed/feedRankUtils'
import { FiLayers } from 'react-icons/fi'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useLanguage } from '../contexts/useLanguage'
import { FeedSnapScroller } from '../features/feed/FeedSnapScroller'
import { FeedTypeChips } from '../features/feed/FeedTypeChips'
import {
  FEED_KINDS,
  buildUnifiedFeedItems,
  countFeedKinds,
  feedOrderSignature,
  feedPath,
  pickInitialFeedIndex,
  preserveFeedOrder,
  resolveFeedDesktopRedirect,
} from '../features/feed/feedItemUtils'
import { loadFeedBoosts } from '../features/stars/starsSlice'
import { injectFeedDiscoverySlides } from '../features/feed/feedDiscoveryUtils'
import { useIsFeedViewport } from '../features/feed/feedViewport'
import { CoverFeedSlide } from '../features/feed/slides/CoverFeedSlide'
import { DiscoveryFeedSlide } from '../features/feed/slides/DiscoveryFeedSlide'
import { ListingFeedSlide } from '../features/feed/slides/ListingFeedSlide'
import { ParcelFeedSlide } from '../features/feed/slides/ParcelFeedSlide'
import { VideoFeedSlide } from '../features/feed/slides/VideoFeedSlide'
import { phase3Text } from '../i18n/phase3I18n'

function renderFeedSlide(item, { index, active }) {
  if (item.kind === 'discovery') {
    return <DiscoveryFeedSlide item={item} index={index} active={active} />
  }
  if (item.kind === 'video') {
    return <VideoFeedSlide item={item} index={index} active={active} />
  }
  if (item.kind === 'listing') {
    return <ListingFeedSlide item={item} index={index} active={active} />
  }
  if (item.kind === 'parcel') {
    return <ParcelFeedSlide item={item} index={index} active={active} />
  }
  return <CoverFeedSlide item={item} index={index} active={active} />
}

export function FeedPage() {
  const dispatch = useDispatch()
  const store = useStore()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [searchParams] = useSearchParams()
  const isFeedViewport = useIsFeedViewport()
  const rawType = searchParams.get('type') || 'all'
  const requestedType = rawType === 'all' || FEED_KINDS.includes(rawType) ? rawType : 'all'
  const itemParam = searchParams.get('item') || ''
  const feedBoosts = useSelector((s) => s.stars.feedBoosts)
  const user = useSelector((s) => s.auth.user)
  const subscriptions = useSelector((s) => s.account.subscriptions)
  const favorites = useSelector((s) => s.account.favorites)
  const viewedListings = useSelector((s) => s.account.viewedListings)
  const videos = useSelector((s) => s.videos)
  const marketplace = useSelector((s) => s.marketplace)
  const parcels = useSelector((s) => s.parcels)
  const jobs = useSelector((s) => s.jobs)
  const events = useSelector((s) => s.events)
  const posts = useSelector((s) => s.posts)
  const businesses = useSelector((s) => s.businesses)

  useEffect(() => {
    dispatch(loadFeedBoosts())
  }, [dispatch])

  useEffect(() => {
    if (!user?.id) return
    import('../app/catalogSync.js').then(({ hasUsableFeedCatalog, scheduleCatalogSync }) => {
      if (hasUsableFeedCatalog()) return
      void scheduleCatalogSync(store)
    })
  }, [store, user?.id])

  const feedState = useMemo(
    () => ({
      videos,
      marketplace,
      parcels,
      jobs,
      events,
      posts,
      businesses,
      account: { subscriptions, favorites, viewedListings },
    }),
    [videos, marketplace, parcels, jobs, events, posts, businesses, subscriptions, favorites, viewedListings],
  )

  const rankCtx = useMemo(() => buildFeedRankContext(feedState, user), [feedState, user])

  const desktopRedirect = useMemo(
    () =>
      resolveFeedDesktopRedirect({
        typeFilter: requestedType,
        itemParam,
        state: feedState,
        boosts: feedBoosts,
        rankCtx,
        user,
      }),
    [requestedType, itemParam, feedState, feedBoosts, rankCtx, user],
  )

  const allItems = useMemo(
    () => buildUnifiedFeedItems(feedState, { typeFilter: 'all', boosts: feedBoosts, rankCtx, user }),
    [feedState, feedBoosts, rankCtx, user],
  )
  const kindCounts = useMemo(() => countFeedKinds(allItems), [allItems])
  const filteredItems = useMemo(
    () =>
      requestedType === 'all'
        ? allItems
        : buildUnifiedFeedItems(feedState, { typeFilter: requestedType, boosts: feedBoosts, rankCtx, user }),
    [allItems, feedState, requestedType, feedBoosts, rankCtx, user],
  )

  const filterEmpty = requestedType !== 'all' && filteredItems.length === 0 && allItems.length > 0
  const typeFilter = filterEmpty ? 'all' : requestedType
  const rawItems = filterEmpty ? allItems : filteredItems
  const orderSignature = useMemo(() => feedOrderSignature(rawItems), [rawItems])
  const orderCacheRef = useRef({ signature: '', items: [] })
  /* eslint-disable react-hooks/refs -- stable feed order cache between re-ranks */
  const organicItems = useMemo(() => {
    const next = preserveFeedOrder(orderCacheRef.current, rawItems, orderSignature)
    orderCacheRef.current = next
    return next.items
  }, [rawItems, orderSignature])
  /* eslint-enable react-hooks/refs */
  const items = useMemo(() => {
    if (typeFilter !== 'all') return organicItems
    return injectFeedDiscoverySlides(organicItems, { feedState, rankCtx, user })
  }, [organicItems, typeFilter, feedState, rankCtx, user])

  const initialIndex = pickInitialFeedIndex(items, itemParam, feedState)

  if (!isFeedViewport) {
    return <Navigate to={desktopRedirect} replace />
  }

  if (filterEmpty) {
    return <Navigate to={feedPath({ item: itemParam || undefined })} replace />
  }

  if (!allItems.length) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={FiLayers}
          title={p3('feed.emptyTitle')}
          description={p3('feed.emptyDescription')}
          action={
            <Link to="/publications/mine">
              <Button icon={FiLayers}>{p3('feed.emptyCta')}</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="relative max-md:bg-[var(--app-bg)]">
      <div className="feed-mobile-shell md:contents">
        <FeedTypeChips counts={kindCounts} totalCount={allItems.length} showPublish />
        <FeedSnapScroller items={items} initialIndex={initialIndex} renderSlide={renderFeedSlide} />
      </div>
    </div>
  )
}
