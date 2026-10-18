import { FiGrid, FiPlus, FiRefreshCw, FiShoppingBag } from 'react-icons/fi'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { addToast } from '../features/ui/uiSlice'
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
import { MarketplaceListingCard, GLOBAL_LOADED_IMAGES } from '../features/marketplace/MarketplaceListingCard'
import { syncMarketplaceCatalog } from '../features/marketplace/marketplaceSync'
import { supabase } from '../services/supabaseClient'
import { listingFromRemoteRow } from '../features/marketplace/marketplaceRemote'
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
  removeRemoteListing,
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
    if (GLOBAL_LOADED_IMAGES.has(url)) continue
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      GLOBAL_LOADED_IMAGES.add(url)
    }
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

  // Infinite progressive stream generator: guarantees continuous, seamless discovery without dead-ends.
  const INITIAL_PAGE_SIZE = 16
  const PAGE_INCREMENT = 12
  const [displayCount, setDisplayCount] = useState(INITIAL_PAGE_SIZE)
  const [refreshingCatalog, setRefreshingCatalog] = useState(false)
  const sentinelRef = useRef(null)
  const loadingMoreRef = useRef(false)

  // Reset pagination when search query or filters change
  const filterKey = `${filters.query}|${filters.type}|${filters.category}|${filters.city}|${filters.min}|${filters.max}|${filters.sort}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setDisplayCount(INITIAL_PAGE_SIZE)
  }

  // Endless progressive stream with organic video interleaving and deterministic cycle permutation
  const renderedItems = useMemo(() => {
    if (!visible?.length) return []

    const stream = []
    const videoPool = availableVideos || []
    let videoIndex = 0
    let cycle = 0
    let nextVideoInterval = 5
    let listingsSinceVideo = 0

    while (stream.length < displayCount) {
      const cycleListings =
        cycle === 0
          ? visible
          : pickShuffledWindow(visible, `${suggestionSalt}:c${cycle}`, 0, visible.length)

      for (let i = 0; i < cycleListings.length && stream.length < displayCount; i++) {
        const listing = cycleListings[i]
        stream.push({
          kind: 'listing',
          data: listing,
          id: cycle === 0 ? `listing-${listing.id}` : `listing-${listing.id}-c${cycle}-${i}`,
        })
        listingsSinceVideo++

        if (
          videoPool.length > 0 &&
          listingsSinceVideo >= nextVideoInterval &&
          stream.length < displayCount
        ) {
          const video = videoPool[videoIndex % videoPool.length]
          stream.push({
            kind: 'video',
            data: video,
            id: `video-${video.id}-c${cycle}-${videoIndex}`,
          })
          videoIndex++
          listingsSinceVideo = 0
          nextVideoInterval = 5 + (((i + cycle * 13) * 7 + 3) % 3)
        }
      }

      cycle++
      if (cycle > 500) break
    }

    return stream
  }, [visible, availableVideos, displayCount, suggestionSalt])

  const hasMore = visible.length > 0

  // Observer pour déclenchement automatique et progressif de l'infinite scroll (800px en avance)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMoreRef.current) {
          loadingMoreRef.current = true
          setDisplayCount((prev) => prev + PAGE_INCREMENT)
          setTimeout(() => {
            loadingMoreRef.current = false
          }, 250)
        }
      },
      { rootMargin: '800px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore])

  // Filet de sécurité défilement pour garantir le chargement continu sur tous les navigateurs / WebViews
  useEffect(() => {
    if (!hasMore) return undefined
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollPosition = window.innerHeight + window.scrollY
        const threshold = document.documentElement.scrollHeight - 900
        if (scrollPosition >= threshold && !loadingMoreRef.current) {
          loadingMoreRef.current = true
          setDisplayCount((prev) => prev + PAGE_INCREMENT)
          setTimeout(() => {
            loadingMoreRef.current = false
          }, 250)
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hasMore])

  // Actualiseur manuel du catalogue (force un re-fetch Supabase complet)
  async function handleRefreshCatalog() {
    if (refreshingCatalog) return
    setRefreshingCatalog(true)
    try {
      await syncMarketplaceCatalog(dispatch, store, { force: true })
      dispatch(addToast({ type: 'success', message: 'Catalogue d’annonces actualisé.' }))
    } catch {
      dispatch(addToast({ type: 'error', message: 'Erreur lors de l’actualisation du catalogue.' }))
    } finally {
      setRefreshingCatalog(false)
    }
  }

  // Cache-first: hydrate immediately from local IndexedDB if Redux is empty on mount.
  useEffect(() => {
    if (guestMode || reduxListings.length > 0) return
    let cancelled = false
    void readListingsFromIdb().then((cached) => {
      if (cancelled || !cached?.length) return
      const current = store.getState()?.marketplace?.items || []
      if (cached.length > current.length) {
        dispatch(setAll({ items: cached, mode: 'merge' }))
      }
    })
    return () => {
      cancelled = true
    }
  }, [dispatch, guestMode, reduxListings.length, store])

  // Actualisation automatique en arrière-plan dès l'arrivée sur la page Marketplace
  useEffect(() => {
    if (guestMode) return
    void syncMarketplaceCatalog(dispatch, store, { force: true })
  }, [dispatch, store, guestMode])

  // Actualisation silencieuse en arrière-plan lors du retour sur l'onglet/fenêtre
  useEffect(() => {
    if (guestMode) return undefined
    const resyncIfNeeded = () => {
      void syncMarketplaceCatalog(dispatch, store, { force: true })
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
  }, [dispatch, store, guestMode])

  // Supabase Realtime : actualisation en direct dès qu'une annonce est créée, modifiée ou supprimée
  useEffect(() => {
    if (guestMode || !supabase) return undefined

    const channel = supabase
      .channel('marketplace-live-feed-page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings' },
        (payload) => {
          if (payload.new?.id) {
            const item = listingFromRemoteRow(payload.new)
            dispatch(setAll({ items: [item], mode: 'merge' }))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings' },
        (payload) => {
          if (payload.new?.id) {
            const item = listingFromRemoteRow(payload.new)
            dispatch(setAll({ items: [item], mode: 'merge' }))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'listings' },
        (payload) => {
          if (payload.old?.id) {
            dispatch(removeRemoteListing(payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [dispatch, guestMode])

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
    <div className="bg-transparent min-w-0 max-w-full overflow-hidden grid gap-4 sm:gap-5">
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-4 lg:scroll-mt-28 min-w-0 max-w-full">
        <div className="min-w-0 max-w-full overflow-hidden bg-transparent">
          <nav
            aria-label={mt('marketplace.common.type')}
            className="scrollbar-hidden flex items-stretch gap-2 overflow-x-auto touch-pan-x snap-x snap-mandatory min-w-0 max-w-full lg:overflow-visible lg:w-full"
          >
            <MarketplaceBentoTile
              featured
              active={!filters.type}
              icon={FiGrid}
              label={mt('marketplace.common.all')}
              hint="Tout le catalogue"
              typeKey="all"
              onClick={() => dispatch(setMarketplaceFilters({ type: '', category: '' }))}
            />
            <div className="grid grid-rows-2 grid-flow-col auto-cols-[142px] sm:auto-cols-[158px] lg:grid-flow-row lg:grid-cols-3 lg:grid-rows-2 lg:auto-cols-auto lg:flex-1 min-w-0 gap-2">
              {LISTING_TYPES_META.map((option) => (
                <MarketplaceBentoTile
                  key={option.value}
                  active={filters.type === option.value}
                  icon={option.icon}
                  label={listingOptionLabel(t, option)}
                  hint={option.hint}
                  typeKey={option.value}
                  iconColor={option.color}
                  onClick={() =>
                    dispatch(setMarketplaceFilters({ type: option.value, category: '' }))
                  }
                />
              ))}
            </div>
          </nav>
        </div>

        <CatalogSearch
          className="border-0 bg-transparent shadow-none !p-0"
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
                          key={`feed-banner-${item.id}`}
                          bannerIndex={bannerSlot}
                          onInteract={() => {}}
                        />
                      ) : null}
                    </Fragment>
                  )
                })}
                </CatalogGrid>

                {/* Sentinelle pour l'infinite scroll automatique et progressif */}
                {hasMore ? (
                  <div
                    ref={sentinelRef}
                    className="h-10 w-full flex items-center justify-center my-4"
                    aria-hidden="true"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--app-text-muted)] animate-pulse">
                      <span className="inline-block size-2 rounded-full bg-brand-500 animate-ping shrink-0" />
                      <span>Recharge progressive des annonces...</span>
                    </div>
                  </div>
                ) : null}

                {/* Actualiseur & barre de statut en bas de liste */}
                <div className="mt-8 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/80 p-4 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--app-text-muted)]">
                    <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>
                      Flux continu en direct • {visible.length} annonce{visible.length > 1 ? 's' : ''} au catalogue ({renderedItems.length} affichée{renderedItems.length > 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setDisplayCount((prev) => prev + PAGE_INCREMENT)}
                      className="cursor-pointer shadow-sm font-bold text-xs"
                    >
                      {mt('marketplace.page.feed.loadMore') || 'Afficher la suite'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshCatalog}
                      disabled={refreshingCatalog}
                      className="cursor-pointer shadow-sm font-bold text-xs inline-flex items-center gap-1.5"
                    >
                      <FiRefreshCw className={`size-3.5 ${refreshingCatalog ? 'animate-spin text-brand-600' : ''}`} aria-hidden="true" />
                      <span>{refreshingCatalog ? 'Actualisation...' : 'Actualiser le catalogue'}</span>
                    </Button>
                  </div>
                </div>
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

const BENTO_THEMES = {
  all: {
    bg: 'bg-emerald-50/95 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60',
    border: 'border-emerald-300/90 dark:border-emerald-700/70',
    activeRing: 'ring-2 ring-emerald-600 border-emerald-500 bg-emerald-100/90 dark:bg-emerald-900/60 shadow-md',
    iconGradient: 'from-emerald-600 to-teal-500 shadow-emerald-500/25',
  },
  product: {
    bg: 'bg-blue-50/95 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-950/60',
    border: 'border-blue-300/90 dark:border-blue-700/70',
    activeRing: 'ring-2 ring-blue-600 border-blue-500 bg-blue-100/90 dark:bg-blue-900/60 shadow-md',
    iconGradient: 'from-blue-600 to-cyan-500 shadow-blue-500/25',
  },
  service: {
    bg: 'bg-purple-50/95 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:hover:bg-purple-950/60',
    border: 'border-purple-300/90 dark:border-purple-700/70',
    activeRing: 'ring-2 ring-purple-600 border-purple-500 bg-purple-100/90 dark:bg-purple-900/60 shadow-md',
    iconGradient: 'from-purple-600 to-indigo-500 shadow-purple-500/25',
  },
  rental: {
    bg: 'bg-amber-50/95 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-950/60',
    border: 'border-amber-300/90 dark:border-amber-700/70',
    activeRing: 'ring-2 ring-amber-600 border-amber-500 bg-amber-100/90 dark:bg-amber-900/60 shadow-md',
    iconGradient: 'from-amber-500 to-orange-500 shadow-amber-500/25',
  },
  vehicle: {
    bg: 'bg-slate-100/95 hover:bg-slate-200/80 dark:bg-slate-800/70 dark:hover:bg-slate-800/90',
    border: 'border-slate-350 dark:border-slate-600',
    activeRing: 'ring-2 ring-slate-600 border-slate-500 bg-slate-200/90 dark:bg-slate-700/60 shadow-md',
    iconGradient: 'from-slate-600 to-slate-800 shadow-slate-500/25',
  },
  digital: {
    bg: 'bg-teal-50/95 hover:bg-teal-100/80 dark:bg-teal-950/40 dark:hover:bg-teal-950/60',
    border: 'border-teal-300/90 dark:border-teal-700/70',
    activeRing: 'ring-2 ring-teal-600 border-teal-500 bg-teal-100/90 dark:bg-teal-900/60 shadow-md',
    iconGradient: 'from-teal-600 to-emerald-500 shadow-teal-500/25',
  },
  real_estate: {
    bg: 'bg-rose-50/95 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-950/60',
    border: 'border-rose-300/90 dark:border-rose-700/70',
    activeRing: 'ring-2 ring-rose-600 border-rose-500 bg-rose-100/90 dark:bg-rose-900/60 shadow-md',
    iconGradient: 'from-rose-500 to-pink-600 shadow-rose-500/25',
  },
  food: {
    bg: 'bg-lime-50/95 hover:bg-lime-100/80 dark:bg-lime-950/40 dark:hover:bg-lime-950/60',
    border: 'border-lime-300/90 dark:border-lime-700/70',
    activeRing: 'ring-2 ring-lime-600 border-lime-500 bg-lime-100/90 dark:bg-lime-900/60 shadow-md',
    iconGradient: 'from-lime-600 to-green-600 shadow-lime-500/25',
  },
  other: {
    bg: 'bg-stone-100/95 hover:bg-stone-200/80 dark:bg-stone-800/70 dark:hover:bg-stone-800/90',
    border: 'border-stone-350 dark:border-stone-600',
    activeRing: 'ring-2 ring-stone-600 border-stone-500 bg-stone-200/90 dark:bg-stone-700/60 shadow-md',
    iconGradient: 'from-stone-500 to-stone-700 shadow-stone-500/25',
  },
}

function MarketplaceBentoTile({
  active,
  featured,
  icon: Icon,
  label,
  hint,
  typeKey = 'other',
  iconColor,
  onClick,
}) {
  const theme = BENTO_THEMES[typeKey] || BENTO_THEMES.other
  const gradient = iconColor || theme.iconGradient

  if (featured) {
    return (
      <button
        type="button"
        title={label}
        aria-pressed={active}
        onClick={onClick}
        className={`group relative flex h-[132px] w-[110px] sm:w-[124px] lg:w-[136px] xl:w-[152px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl p-3 text-left transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md border ${
          active
            ? theme.activeRing
            : `${theme.bg} ${theme.border}`
        }`}
      >
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-md transition-transform group-hover:scale-105 ${
            active
              ? 'bg-emerald-600'
              : `bg-gradient-to-br ${gradient}`
          }`}
        >
          <Icon className="size-[1.125rem]" aria-hidden="true" />
        </span>
        <div className="mt-2 min-w-0">
          <p className="line-clamp-1 text-xs sm:text-[13px] font-black tracking-tight text-slate-900 dark:text-white">
            {label}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[10px] sm:text-[10.5px] font-semibold text-slate-600 dark:text-slate-300">
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
      className={`group relative flex h-[62px] w-[142px] sm:w-[158px] lg:w-full shrink-0 lg:shrink snap-start items-center gap-2.5 overflow-hidden rounded-xl px-3 transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md border ${
        active
          ? theme.activeRing
          : `${theme.bg} ${theme.border}`
      }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg text-white shadow-md transition-transform group-hover:scale-105 ${
          active
            ? 'bg-brand-600'
            : `bg-gradient-to-br ${gradient}`
        }`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-xs sm:text-[13px] font-black tracking-tight leading-snug text-slate-900 dark:text-white">
          {label}
        </p>
        <p className="truncate text-[9.5px] sm:text-[10px] font-semibold text-slate-600 dark:text-slate-300 leading-tight">
          {hint}
        </p>
      </div>
    </button>
  )
}
