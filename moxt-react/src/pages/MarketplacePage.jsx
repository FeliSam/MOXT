import { FiGrid, FiPlus, FiShoppingBag } from 'react-icons/fi'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { RevealListItem } from '../components/ui/RevealListItem'
import { Select } from '../components/ui/Select'
import {
  categoriesForType,
  LISTING_TYPES_META,
  listingSpecificDetails,
} from '../config/listingConfig'
import { MarketplaceListingCard } from '../features/marketplace/MarketplaceListingCard'
import { MarketplaceDiscoveryRail } from '../features/marketplace/MarketplaceDiscoveryRail'
import { MarketplaceVideoCard, MarketplaceVideoRail } from '../features/marketplace/MarketplaceVideoRail'
import { MarketplaceFeedBanner } from '../features/marketplace/MarketplaceFeedBanner'
import {
  MARKETPLACE_DISCOVER_GRID_COLUMNS,
  MARKETPLACE_DISCOVER_GRID_GAP,
  MARKETPLACE_DISCOVERY_CARD_HEIGHT,
} from '../features/marketplace/marketplaceDiscoveryLayout'
import {
  buildMarketplaceDiscovery,
  rankMarketplaceVideos,
} from '../features/marketplace/marketplaceFeed'
import { pickShuffledWindow } from '../features/feed/feedDiscoveryUtils'
import { readSearchHistory, saveSearchTerm } from '../services/searchHistory.js'
import { loadFeedBoosts } from '../features/stars/starsSlice'
import {
  resetMarketplaceFilters,
  setMarketplaceFilters,
  setAll,
} from '../features/marketplace/marketplaceSlice'
import {
  listingOptionLabel,
  marketplaceText,
} from '../features/marketplace/marketplaceI18n'
import { countrySortRank, resolveUserCountryCode } from '@moxt/shared/utils/countryPriority.js'
import { resolveListingCountry } from '../features/marketplace/listingCatalogUtils'
import { resolveMediaDisplayUrl } from '../services/media/mediaUrlUtils'
import { readListingsFromIdb } from '../features/marketplace/marketplaceListingsIdb'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'
import { useLanguage } from '../contexts/useLanguage'
import { useGuestAction } from '../features/guest/useGuestAction'
import { useGuestMarketplaceListings } from '../features/guest/useGuestPreview'

const MARKETPLACE_COVER_PRELOAD = 40

function prefetchListingCovers(listings = []) {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return
  for (const listing of listings) {
    const raw = listing?.images?.[0]
    if (!raw || typeof raw !== 'string') continue
    const url = resolveMediaDisplayUrl(raw) || raw
    if (!url) continue
    const img = new Image()
    img.decoding = 'async'
    img.src = url
  }
}

export function MarketplacePage() {
  useScrollToSecondSection()
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const dispatch = useDispatch()
  const store = useStore()
  const navigate = useNavigate()
  const { guestMode = false } = useOutletContext() || {}
  const { requireAccount } = useGuestAction()
  const guestCatalog = useGuestMarketplaceListings(guestMode)
  const reduxListings = useSelector((state) => state.marketplace.items)
  const listings = guestMode ? guestCatalog.listings : reduxListings
  const filters = useSelector((state) => state.marketplace.filters)
  const categoryOptions = useMemo(
    () => (filters.type ? categoriesForType(filters.type) : []),
    [filters.type],
  )
  const user = useSelector((state) => state.auth.user)
  const subscriptions = useSelector((state) => state.account.subscriptions || [])
  const favorites = useSelector((state) => state.account.favorites || [])
  const viewedListings = useSelector((state) => state.account.viewedListings || [])
  const listingImpressions = useSelector((state) => state.account.listingImpressions || [])
  const feedBoosts = useSelector((state) => state.stars.feedBoosts || [])
  const videos = useSelector((state) => state.videos.items || [])
  const discoverRef = useRef(null)
  const preferredCountry = resolveUserCountryCode(user)
  const searching = Boolean(
    filters.query || filters.category || filters.city || filters.min || filters.max,
  )
  const searchTerms = useMemo(() => {
    const history = readSearchHistory()
    const live = String(filters.query || '').trim()
    if (live.length >= 2 && !history.some((term) => term.toLowerCase() === live.toLowerCase())) {
      return [live, ...history]
    }
    return history
  }, [filters.query])
  const suggestionSalt = `${user?.id || 'guest'}:${searchTerms.join('|')}:${favorites.length}`
  const feed = useMemo(() => {
    const filtered = listings.filter((item) => {
      if (item.status !== 'active') return false
      const searchText = [
        item.title,
        item.description,
        item.city,
        item.district,
        item.address,
        item.category,
        item.type,
        item.brand,
        item.model,
        item.sellerName,
        ...listingSpecificDetails(item, t).map((detail) => `${detail.label} ${detail.value}`),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        (!filters.query || searchText.includes(filters.query.toLowerCase())) &&
        (!filters.type || item.type === filters.type) &&
        (!filters.category || item.category === filters.category) &&
        (!filters.city ||
          `${item.city || ''} ${item.district || ''}`
            .toLowerCase()
            .includes(filters.city.toLowerCase())) &&
        (!filters.min || Number(item.price) >= Number(filters.min)) &&
        (!filters.max || Number(item.price) <= Number(filters.max))
      )
    })
    const local = []
    const elsewhere = []
    for (const item of filtered) {
      if (countrySortRank(resolveListingCountry(item), preferredCountry) === 0) local.push(item)
      else elsewhere.push(item)
    }
    const ctx = {
      userId: user?.id,
      userCity: user?.city,
      subscriptions,
      favorites,
      viewedListings,
      impressionListings: listingImpressions,
      feedBoosts,
      searching,
      showRails: true,
      searchTerms,
    }
    const localFeed = buildMarketplaceDiscovery(local.length ? local : filtered, ctx)
    const restFeed = local.length
      ? buildMarketplaceDiscovery(elsewhere, { ...ctx, showRails: false })
      : { discover: [] }
    return {
      forYou: pickShuffledWindow(localFeed.forYou, `${suggestionSalt}:fy`, 0, localFeed.forYou.length),
      trending: pickShuffledWindow(
        localFeed.trending,
        `${suggestionSalt}:tr`,
        1,
        localFeed.trending.length,
      ),
      fresh: pickShuffledWindow(localFeed.fresh, `${suggestionSalt}:fr`, 2, localFeed.fresh.length),
      discover: restFeed.discover
        ? [...localFeed.discover, ...restFeed.discover]
        : localFeed.discover,
      total: filtered.length,
      personalized: localFeed.personalized,
    }
  }, [
    favorites,
    feedBoosts,
    filters,
    listings,
    listingImpressions,
    preferredCountry,
    searching,
    searchTerms,
    subscriptions,
    suggestionSalt,
    t,
    user?.city,
    user?.id,
    viewedListings,
  ])
  const videoRail = useMemo(
    () =>
      pickShuffledWindow(
        rankMarketplaceVideos(videos, {
          userId: user?.id,
          searchTerms,
        }),
        `${suggestionSalt}:vid`,
        0,
        12,
      ),
    [searchTerms, suggestionSalt, user?.id, videos],
  )
  const visible = feed.discover

  const availableVideos = videoRail?.length > 0 ? videoRail : videos

  // Interleave videos into the discover feed stream in an arranged, pseudo-random organic rhythm
  const discoverFeedStream = useMemo(() => {
    const stream = []
    const videoPool = availableVideos || []
    let videoIndex = 0
    let nextVideoInterval = 5
    let listingsSinceVideo = 0

    for (let i = 0; i < visible.length; i++) {
      stream.push({ kind: 'listing', data: visible[i], id: `listing-${visible[i].id}` })
      listingsSinceVideo++

      if (
        videoPool.length > 0 &&
        listingsSinceVideo >= nextVideoInterval &&
        i < visible.length - 1
      ) {
        const video = videoPool[videoIndex % videoPool.length]
        stream.push({ kind: 'video', data: video, id: `video-${video.id}-${videoIndex}` })
        videoIndex++
        listingsSinceVideo = 0
        // Pseudo-random organic interval: cycles 5, 6, 7
        nextVideoInterval = 5 + ((i * 7 + 3) % 3)
      }
    }

    return stream
  }, [visible, availableVideos])

  const INITIAL_PAGE_SIZE = 16
  const PAGE_INCREMENT = 12
  const [displayCount, setDisplayCount] = useState(INITIAL_PAGE_SIZE)
  const sentinelRef = useRef(null)

  // Reset pagination when search query or filters change
  useEffect(() => {
    setDisplayCount(INITIAL_PAGE_SIZE)
  }, [filters.query, filters.type, filters.category, filters.city, filters.min, filters.max, filters.sort])

  const totalStreamItems = discoverFeedStream.length
  const renderedItems = useMemo(
    () => discoverFeedStream.slice(0, displayCount),
    [discoverFeedStream, displayCount]
  )
  const hasMore = displayCount < totalStreamItems

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setDisplayCount((prev) => Math.min(prev + PAGE_INCREMENT, totalStreamItems))
        }
      },
      { rootMargin: '400px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, totalStreamItems])

  // Cache-first: hydrate immediately from local IndexedDB if Redux is empty on mount.
  useEffect(() => {
    if (guestMode || reduxListings.length > 0) return
    let cancelled = false
    void readListingsFromIdb().then((cached) => {
      if (cancelled || !cached?.length) return
      const current = store.getState()?.marketplace?.items || []
      if (cached.length > current.length) {
        dispatch(setAll({ items: cached }))
      }
    })
    return () => {
      cancelled = true
    }
  }, [dispatch, guestMode, reduxListings.length, store])

  // Mount + incompleteness: scheduleCatalogSync auto-forces when Redux looks thinner
  // than the last successful sync (cooldown inside catalogSync).
  useEffect(() => {
    if (!user?.id || guestMode) return
    import('../app/catalogSync.js').then(({ scheduleCatalogSync }) => {
      void scheduleCatalogSync(store, { skipIfFresh: reduxListings.length > 0 })
    })
  }, [store, user?.id, guestMode, reduxListings.length])

  // When the displayed catalog shrinks (or stays thin after hydrate), re-check.
  useEffect(() => {
    if (!user?.id || guestMode) return undefined
    let cancelled = false
    void import('../app/catalogSync.js').then(
      ({ scheduleCatalogSync, isMarketplaceCatalogIncomplete }) => {
        if (cancelled) return
        if (isMarketplaceCatalogIncomplete(store.getState())) {
          // skipIfFresh + incomplete → awaited network pull without wiping IDB
          void scheduleCatalogSync(store, { skipIfFresh: true })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [store, user?.id, guestMode, reduxListings.length, feed.total])

  // Focus / tab re-entry: force full sync when incomplete; otherwise skipIfFresh.
  useEffect(() => {
    if (!user?.id || guestMode) return undefined
    const resyncIfNeeded = () => {
      void import('../app/catalogSync.js').then(({ scheduleCatalogSync }) => {
        // Incomplete auto-forces an awaited pull inside scheduleCatalogSync;
        // pull-to-refresh (softRefreshSession) remains the path that invalidates IDB.
        void scheduleCatalogSync(store, { skipIfFresh: true })
      })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') resyncIfNeeded()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', resyncIfNeeded)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', resyncIfNeeded)
    }
  }, [store, user?.id, guestMode])

  useEffect(() => {
    dispatch(loadFeedBoosts())
  }, [dispatch])

  useEffect(() => {
    const covers = renderedItems
      .filter((item) => item.kind === 'listing')
      .map((item) => item.data)
      .slice(0, MARKETPLACE_COVER_PRELOAD)
    prefetchListingCovers(covers)
  }, [renderedItems])

  function scrollToDiscover() {
    discoverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="community-warm-bg grid gap-5 rounded-[var(--radius-card-lg)]">
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <nav
          aria-label={mt('marketplace.common.type')}
          className="scrollbar-hidden -mx-1 grid grid-rows-2 grid-flow-col auto-cols-[135px] sm:auto-cols-[155px] gap-2.5 overflow-x-auto px-1 pb-1.5 touch-pan-x snap-x snap-mandatory"
        >
          <MarketplaceBentoTile
            featured
            active={!filters.type}
            icon={FiGrid}
            label={mt('marketplace.common.all')}
            hint="Tout le catalogue"
            surface={BENTO_SURFACES.all}
            iconColor="from-brand-600 to-teal-500"
            onClick={() => dispatch(setMarketplaceFilters({ type: '', category: '' }))}
          />
          {LISTING_TYPES_META.map((option) => (
            <MarketplaceBentoTile
              key={option.value}
              active={filters.type === option.value}
              icon={option.icon}
              label={listingOptionLabel(t, option)}
              hint={option.hint}
              surface={BENTO_SURFACES[option.value] || BENTO_SURFACES.other}
              iconColor={option.color}
              onClick={() =>
                dispatch(setMarketplaceFilters({ type: option.value, category: '' }))
              }
            />
          ))}
        </nav>

        <CatalogSearch
          advancedOpen={advancedOpen}
          count={feed.total}
          activeFilterCount={[filters.category, filters.city, filters.min, filters.max].filter(Boolean).length}
          query={filters.query}
          onQueryChange={(query) => {
            dispatch(setMarketplaceFilters({ query }))
            if (query.trim().length >= 2) saveSearchTerm(query)
          }}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={() => dispatch(resetMarketplaceFilters())}
          placeholder={mt('marketplace.page.searchPlaceholder')}
        >
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Select
              id="market-type"
              label={mt('marketplace.common.type')}
              value={filters.type}
              onChange={(event) =>
                dispatch(setMarketplaceFilters({ type: event.target.value, category: '' }))
              }
            >
              <option value="">{mt('marketplace.common.allPlural')}</option>
              {LISTING_TYPES_META.map((option) => (
                <option key={option.value} value={option.value}>
                  {listingOptionLabel(t, option)}
                </option>
              ))}
            </Select>
            <Select
              id="market-category"
              label={mt('marketplace.page.category')}
              value={filters.category || ''}
              disabled={!filters.type}
              onChange={(event) =>
                dispatch(setMarketplaceFilters({ category: event.target.value }))
              }
            >
              <option value="">
                {filters.type
                  ? mt('marketplace.common.allFeminine')
                  : mt('marketplace.page.chooseTypeFirst')}
              </option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {listingOptionLabel(t, option)}
                </option>
              ))}
            </Select>
            <Input
              id="market-city"
              label={mt('marketplace.page.cityDistrict')}
              value={filters.city}
              wrapperClass="col-span-2"
              onChange={(event) => dispatch(setMarketplaceFilters({ city: event.target.value }))}
            />
            <Input
              id="market-min"
              label={mt('marketplace.page.minPrice')}
              type="number"
              value={filters.min}
              onChange={(event) => dispatch(setMarketplaceFilters({ min: event.target.value }))}
            />
            <Input
              id="market-max"
              label={mt('marketplace.page.maxPrice')}
              type="number"
              value={filters.max}
              onChange={(event) => dispatch(setMarketplaceFilters({ max: event.target.value }))}
            />
          </div>
        </CatalogSearch>
        <section>
          {guestMode && guestCatalog.loading ? (
            <EmptyState
              icon={FiShoppingBag}
              tone="warm"
              title={mt('marketplace.page.emptyTitle')}
              description={mt('marketplace.page.searchPlaceholder')}
            />
          ) : visible.length ? (
            <>
              {!searching ? (
                <div className="grid gap-6">
                  <MarketplaceDiscoveryRail
                    railId="forYou"
                    title={mt('marketplace.page.feed.forYou')}
                    badgeLabel={mt('marketplace.page.feed.badgeForYou')}
                    viewAllLabel={mt('marketplace.page.feed.viewAll')}
                    listings={feed.forYou}
                    guestMode={guestMode}
                    onGuestInteract={() => requireAccount('aimer cette annonce')}
                    onViewAll={scrollToDiscover}
                    scrollPrevLabel={mt('marketplace.common.previous')}
                    scrollNextLabel={mt('marketplace.common.next')}
                  />
                  <MarketplaceDiscoveryRail
                    railId="trending"
                    title={mt('marketplace.page.feed.trending')}
                    badgeLabel={mt('marketplace.page.feed.badgeTrending')}
                    viewAllLabel={mt('marketplace.page.feed.viewAll')}
                    listings={feed.trending}
                    guestMode={guestMode}
                    onGuestInteract={() => requireAccount('aimer cette annonce')}
                    onViewAll={scrollToDiscover}
                    scrollPrevLabel={mt('marketplace.common.previous')}
                    scrollNextLabel={mt('marketplace.common.next')}
                  />
                  <MarketplaceVideoRail
                    title={mt('marketplace.page.feed.videos')}
                    badgeLabel={mt('marketplace.page.feed.badgeVideo')}
                    viewAllLabel={mt('marketplace.page.feed.viewAll')}
                    videos={videoRail}
                    onViewAll={() => navigate('/feed?type=video')}
                    scrollPrevLabel={mt('marketplace.common.previous')}
                    scrollNextLabel={mt('marketplace.common.next')}
                  />
                  <MarketplaceDiscoveryRail
                    railId="fresh"
                    title={mt('marketplace.page.feed.fresh')}
                    badgeLabel={mt('marketplace.page.feed.badgeFresh')}
                    viewAllLabel={mt('marketplace.page.feed.viewAll')}
                    listings={feed.fresh}
                    guestMode={guestMode}
                    onGuestInteract={() => requireAccount('aimer cette annonce')}
                    onViewAll={scrollToDiscover}
                    scrollPrevLabel={mt('marketplace.common.previous')}
                    scrollNextLabel={mt('marketplace.common.next')}
                  />
                </div>
              ) : null}
              <div
                ref={discoverRef}
                className={`grid gap-3 scroll-mt-24 lg:scroll-mt-28${!searching ? ' mt-6' : ''}`}
              >
                <div className="min-w-0">
                  <h2 className="text-sm font-black tracking-tight">
                    {searching
                      ? mt('marketplace.page.feed.results')
                      : mt('marketplace.page.feed.discover')}
                  </h2>
                  {searching ? (
                    <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                      {mt('marketplace.page.feed.resultsHint')}
                    </p>
                  ) : null}
                </div>
                <CatalogGrid
                  lazy={false}
                  columns={MARKETPLACE_DISCOVER_GRID_COLUMNS}
                  gap={MARKETPLACE_DISCOVER_GRID_GAP}
                  className="min-w-0 w-full"
                >
                {renderedItems.map((item, index) => {
                  const showBanner = (index + 1) % 4 === 0
                  const bannerSlot = Math.floor((index + 1) / 4) - 1

                  return (
                    <Fragment key={item.id}>
                      <RevealListItem
                        index={index}
                        className={`${MARKETPLACE_DISCOVERY_CARD_HEIGHT} min-w-0 overflow-hidden`}
                      >
                        {item.kind === 'video' ? (
                          <MarketplaceVideoCard
                            video={item.data}
                            badgeLabel={mt('marketplace.page.feed.badgeVideo')}
                          />
                        ) : (
                          <MarketplaceListingCard
                            listing={item.data}
                            guestMode={guestMode}
                            onGuestInteract={() => requireAccount('aimer cette annonce')}
                            layout="rail"
                          />
                        )}
                      </RevealListItem>

                      {showBanner ? (
                        <MarketplaceFeedBanner
                          key={`feed-banner-${bannerSlot}`}
                          bannerIndex={bannerSlot}
                          onInteract={() => {}}
                        />
                      ) : null}
                    </Fragment>
                  )
                })}
                </CatalogGrid>

                {hasMore ? (
                  <div ref={sentinelRef} className="col-span-full flex justify-center py-6">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setDisplayCount((prev) => Math.min(prev + PAGE_INCREMENT, totalStreamItems))
                      }
                      className="opacity-80 hover:opacity-100 cursor-pointer shadow-sm"
                    >
                      {mt('marketplace.page.feed.loadMore') || 'Charger plus d’annonces...'}
                    </Button>
                  </div>
                ) : null}
              </div>
</>
          ) : (
            <EmptyState
              icon={FiShoppingBag}
              tone="warm"
              title={mt('marketplace.page.emptyTitle')}
              description={mt('marketplace.page.emptyDescription')}
              action={
                <Button
                  icon={FiPlus}
                  onClick={() => {
                    if (requireAccount(mt('marketplace.page.publishListing').toLowerCase())) return
                    navigate('/marketplace/publish')
                  }}
                >
                  {mt('marketplace.page.publishListing')}
                </Button>
              }
            />
          )}
        </section>
      </ScrollSectionAnchor>
    </div>
  )
}

const BENTO_SURFACES = {
  all: 'bg-[linear-gradient(135deg,rgba(14,165,233,0.12)_0%,var(--app-surface)_100%)] dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.22)_0%,var(--app-surface)_100%)]',
  product: 'bg-[linear-gradient(135deg,rgba(59,130,246,0.12)_0%,var(--app-surface)_100%)] dark:bg-[linear-gradient(135deg,rgba(59,130,246,0.22)_0%,var(--app-surface)_100%)]',
  service: 'bg-[linear-gradient(135deg,rgba(168,85,247,0.12)_0%,var(--app-surface)_100%)] dark:bg-[linear-gradient(135deg,rgba(168,85,247,0.22)_0%,var(--app-surface)_100%)]',
  rental: 'bg-[linear-gradient(135deg,rgba(245,158,11,0.12)_0%,var(--app-surface)_100%)] dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.22)_0%,var(--app-surface)_100%)]',
  vehicle: 'bg-[linear-gradient(135deg,rgba(100,116,139,0.12)_0%,var(--app-surface)_100%)] dark:bg-[linear-gradient(135deg,rgba(100,116,139,0.22)_0%,var(--app-surface)_100%)]',
  digital: 'bg-[linear-gradient(135deg,rgba(16,185,129,0.12)_0%,var(--app-surface)_100%)] dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.22)_0%,var(--app-surface)_100%)]',
  real_estate: 'bg-[linear-gradient(135deg,rgba(244,63,94,0.12)_0%,var(--app-surface)_100%)] dark:bg-[linear-gradient(135deg,rgba(244,63,94,0.22)_0%,var(--app-surface)_100%)]',
  food: 'bg-[linear-gradient(135deg,rgba(132,204,22,0.12)_0%,var(--app-surface)_100%)] dark:bg-[linear-gradient(135deg,rgba(132,204,22,0.22)_0%,var(--app-surface)_100%)]',
  other: 'bg-[linear-gradient(135deg,rgba(120,113,108,0.12)_0%,var(--app-surface)_100%)] dark:bg-[linear-gradient(135deg,rgba(120,113,108,0.22)_0%,var(--app-surface)_100%)]',
}

function MarketplaceBentoTile({
  active,
  featured,
  icon: Icon,
  label,
  hint,
  surface,
  iconColor,
  onClick,
}) {
  if (featured) {
    return (
      <button
        type="button"
        title={label}
        aria-pressed={active}
        onClick={onClick}
        className={`group relative flex row-span-2 h-[132px] w-[105px] sm:w-[125px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[1.3rem] p-3 text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${surface} ${
          active
            ? 'ring-2 ring-brand-500 shadow-md border-transparent bg-brand-500/20 text-brand-900 dark:text-brand-100'
            : 'border border-[var(--app-border)]/70 hover:border-brand-500/40 text-[var(--app-text)] shadow-sm'
        }`}
      >
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105 ${
            active
              ? 'bg-brand-600'
              : `bg-gradient-to-br ${iconColor || 'from-brand-600 to-teal-500'}`
          }`}
        >
          <Icon className="size-[1.125rem]" aria-hidden="true" />
        </span>
        <div className="mt-2 min-w-0">
          <p className="line-clamp-1 text-xs font-black tracking-tight">{label}</p>
          <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-[var(--app-text-muted)]">
            {hint || 'Toutes les offres'}
          </p>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`group relative flex h-[61px] w-[138px] sm:w-[155px] shrink-0 snap-start items-center gap-2.5 overflow-hidden rounded-[1.2rem] px-3 transition-all duration-200 active:scale-[0.98] cursor-pointer ${surface} ${
        active
          ? 'ring-2 ring-brand-500 shadow-md border-transparent bg-brand-500/20 text-brand-900 dark:text-brand-100'
          : 'border border-[var(--app-border)]/70 hover:border-brand-500/40 text-[var(--app-text)] shadow-sm'
      }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg text-white shadow-sm transition-transform group-hover:scale-105 ${
          active
            ? 'bg-brand-600'
            : `bg-gradient-to-br ${iconColor || 'from-brand-500 to-teal-500'}`
        }`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-xs font-black tracking-tight leading-snug">{label}</p>
        <p className="truncate text-[9.5px] font-medium text-[var(--app-text-muted)] leading-tight">
          {hint}
        </p>
      </div>
    </button>
  )
}
