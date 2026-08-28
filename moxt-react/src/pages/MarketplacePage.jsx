import { FiGrid, FiList, FiPlus, FiShoppingBag } from 'react-icons/fi'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { HeaderIslandButton, PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { Select } from '../components/ui/Select'
import {
  categoriesForType,
  LISTING_TYPES_META,
  listingSpecificDetails,
} from '../config/listingConfig'
import { MarketplaceListingCard } from '../features/marketplace/MarketplaceListingCard'
import { MarketplaceDiscoveryRail } from '../features/marketplace/MarketplaceDiscoveryRail'
import {
  MARKETPLACE_DISCOVER_GRID_COLUMNS,
  MARKETPLACE_DISCOVERY_CARD_HEIGHT,
} from '../features/marketplace/marketplaceDiscoveryLayout'
import { buildMarketplaceDiscovery } from '../features/marketplace/marketplaceFeed'
import { loadFeedBoosts } from '../features/stars/starsSlice'
import {
  resetMarketplaceFilters,
  setMarketplaceFilters,
} from '../features/marketplace/marketplaceSlice'
import {
  listingOptionLabel,
  marketplaceText,
} from '../features/marketplace/marketplaceI18n'
import { countrySortRank, resolveUserCountryCode } from '@moxt/shared/utils/countryPriority.js'
import { resolveListingCountry } from '../features/marketplace/listingCatalogUtils'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'
import { useProgressiveReveal } from '../hooks/useProgressiveReveal'
import { useLanguage } from '../contexts/useLanguage'
import { useGuestAction } from '../features/guest/useGuestAction'
import { useGuestMarketplaceListings } from '../features/guest/useGuestPreview'

const MARKETPLACE_PRELOAD = 20
const MARKETPLACE_BATCH = 20

function prefetchListingCovers(listings = []) {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return
  for (const listing of listings) {
    const url = listing?.images?.[0]
    if (!url || typeof url !== 'string') continue
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
  const discoverRef = useRef(null)
  const preferredCountry = resolveUserCountryCode(user)
  const searching = Boolean(
    filters.query || filters.category || filters.city || filters.min || filters.max,
  )
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
    }
    const localFeed = buildMarketplaceDiscovery(local.length ? local : filtered, ctx)
    const restFeed = local.length
      ? buildMarketplaceDiscovery(elsewhere, { ...ctx, showRails: false })
      : { discover: [] }
    return {
      forYou: localFeed.forYou,
      trending: localFeed.trending,
      fresh: localFeed.fresh,
      discover: [...localFeed.discover, ...restFeed.discover],
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
    subscriptions,
    t,
    user?.city,
    user?.id,
    viewedListings,
  ])
  const visible = feed.discover

  const { visibleItems, sentinelRef, hasMore, shownCount } = useProgressiveReveal(visible, {
    initial: MARKETPLACE_PRELOAD,
    step: MARKETPLACE_BATCH,
  })

  useEffect(() => {
    dispatch(loadFeedBoosts())
  }, [dispatch])

  useEffect(() => {
    prefetchListingCovers(visibleItems.slice(0, MARKETPLACE_PRELOAD))
  }, [visibleItems])

  function scrollToDiscover() {
    discoverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!hasMore) return undefined
    const nextBatch = visible.slice(shownCount, shownCount + MARKETPLACE_BATCH)
    prefetchListingCovers(nextBatch)
    return undefined
  }, [hasMore, shownCount, visible])

  return (
    <div className="community-warm-bg grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        title={mt('marketplace.common.name')}
        stats={[
          { label: mt('marketplace.page.stats.activeListings'), value: feed.total },
          { label: mt('marketplace.page.stats.categories'), value: LISTING_TYPES_META.length },
        ]}
        actions={
          <>
            <HeaderIslandButton
              icon={FiList}
              label={mt('marketplace.page.myPublications')}
              to="/publications/mine"
              onClick={(event) => {
                if (requireAccount(mt('marketplace.page.myPublications').toLowerCase())) {
                  event.preventDefault()
                }
              }}
            />
            <HeaderIslandButton
              icon={FiPlus}
              label={mt('marketplace.page.publishListing')}
              onClick={() => {
                if (requireAccount(mt('marketplace.page.publishListing').toLowerCase())) return
                navigate('/marketplace/publish')
              }}
            />
          </>
        }
      />
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <nav
          aria-label={mt('marketplace.common.type')}
          className="scrollbar-hidden -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 touch-pan-x"
        >
          <MarketplaceTypeChip
            active={!filters.type}
            icon={FiGrid}
            label={mt('marketplace.common.all')}
            onClick={() => dispatch(setMarketplaceFilters({ type: '', category: '' }))}
          />
          {LISTING_TYPES_META.map((option) => (
            <MarketplaceTypeChip
              key={option.value}
              active={filters.type === option.value}
              icon={option.icon}
              label={listingOptionLabel(t, option)}
              color={option.color}
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
          onQueryChange={(query) => dispatch(setMarketplaceFilters({ query }))}
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
                    subtitle={
                      feed.personalized
                        ? mt('marketplace.page.feed.forYouHint')
                        : mt('marketplace.page.feed.forYouColdHint')
                    }
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
                    subtitle={mt('marketplace.page.feed.trendingHint')}
                    badgeLabel={mt('marketplace.page.feed.badgeTrending')}
                    viewAllLabel={mt('marketplace.page.feed.viewAll')}
                    listings={feed.trending}
                    guestMode={guestMode}
                    onGuestInteract={() => requireAccount('aimer cette annonce')}
                    onViewAll={scrollToDiscover}
                    scrollPrevLabel={mt('marketplace.common.previous')}
                    scrollNextLabel={mt('marketplace.common.next')}
                  />
                  <MarketplaceDiscoveryRail
                    railId="fresh"
                    title={mt('marketplace.page.feed.fresh')}
                    subtitle={mt('marketplace.page.feed.freshHint')}
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
                  <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                    {searching
                      ? mt('marketplace.page.feed.resultsHint')
                      : mt('marketplace.page.feed.discoverHint')}
                  </p>
                </div>
                <CatalogGrid
                  lazy={false}
                  columns={MARKETPLACE_DISCOVER_GRID_COLUMNS}
                  className="min-w-0 w-full"
                >
                {visibleItems.map((listing, index) => (
                  <RevealListItem
                    key={listing.id}
                    index={index}
                    className={`${MARKETPLACE_DISCOVERY_CARD_HEIGHT} min-w-0 overflow-hidden`}
                  >
                    <MarketplaceListingCard
                      listing={listing}
                      guestMode={guestMode}
                      onGuestInteract={() => requireAccount('aimer cette annonce')}
                      layout="rail"
                    />
                  </RevealListItem>
                ))}
                </CatalogGrid>
              </div>
              {hasMore ? (
                <div
                  ref={sentinelRef}
                  className="flex h-10 items-center justify-center"
                  aria-hidden
                >
                  <span className="size-5 animate-pulse rounded-full bg-[var(--app-border)]" />
                </div>
              ) : (
                <div ref={sentinelRef} className="h-px w-full" aria-hidden />
              )}
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

function MarketplaceTypeChip({ active, icon: Icon, label, color, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-[5.35rem] w-[5rem] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-[1.1rem] px-1.5 transition duration-[var(--transition-fast)] ${
        active
          ? 'bg-brand-700 text-white shadow-sm dark:bg-brand-600'
          : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] shadow-sm ring-1 ring-[var(--app-border)] hover:text-[var(--app-text)]'
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-xl leading-none ${
          active
            ? 'bg-white/20 text-white'
            : `bg-gradient-to-br text-white ${color || 'from-brand-500 to-teal-500'}`
        }`}
      >
        <Icon aria-hidden="true" className="block size-[1.125rem] shrink-0" />
      </span>
      <span className="flex h-[1.7rem] w-full items-center justify-center text-center text-[10px] font-black leading-tight tracking-wide">
        <span className="line-clamp-2">{label}</span>
      </span>
    </button>
  )
}
