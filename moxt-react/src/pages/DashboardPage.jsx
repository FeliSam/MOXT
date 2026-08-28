import { useMemo } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { DashboardSearch } from '../components/ui/DashboardSearch'
import { SkeletonCard } from '../components/ui/Skeleton'
import { DashboardDiscoverySection } from '../features/dashboard/components/DashboardDiscoverySection'
import { DashboardCalcBand } from '../features/dashboard/components/DashboardCalcBand'
import { DashboardOverviewPanels } from '../features/dashboard/components/DashboardOverviewPanels'
import { DashboardQuickActionsSection } from '../features/dashboard/components/DashboardQuickActionsSection'
import { DashboardSectionHeading } from '../features/dashboard/components/DashboardSectionHeading'
import { DashboardStarsStrip } from '../features/dashboard/components/DashboardStarsStrip'
import { DashboardTodoInbox } from '../features/dashboard/components/DashboardTodoInbox'
import { DashboardServiceCarousels } from '../features/dashboard/components/DashboardServiceCarousels'
import { ScrollArrows } from '../features/dashboard/components/ScrollArrows'
import {
  dashboardListingItemClass,
  dashboardListingTrackClass,
  dashboardP2PItemClass,
  dashboardP2PTrackClass,
} from '../features/dashboard/dashboardConfig'
import {
  selectDashboardEvents,
  selectDashboardJobs,
  selectDashboardListings,
  selectDashboardP2POffers,
  selectDashboardParcels,
} from '../features/dashboard/dashboardBrowseUtils'
import { useDashboardStats } from '../features/dashboard/hooks/useDashboardStats'
import { MarketplaceListingCard } from '../features/marketplace/MarketplaceListingCard'
import { P2POfferCard } from '../features/p2p/components/P2POfferCard'
import { StatusRail } from '../features/statuses/StatusRail'
import { transferCurrenciesForCountry } from '../features/transfers/transferConfig'
import { useExchangeRate } from '../features/transfers/useExchangeRate'
import { useHorizontalScroll } from '../hooks/useHorizontalScroll'
import { useLanguage } from '../contexts/useLanguage'

export function DashboardPage() {
  const { t } = useLanguage()
  const listingsScrollRef = useHorizontalScroll()
  const p2pScrollRef = useHorizontalScroll()
  const user = useSelector((state) => state.auth.user)
  const authLoading = useSelector((state) => state.auth.status === 'loading')
  const listings = useSelector(
    (state) => selectDashboardListings(state.marketplace.items),
    shallowEqual,
  )
  const parcels = useSelector(
    (state) => selectDashboardParcels(state.parcels.items),
    shallowEqual,
  )
  const jobs = useSelector((state) => selectDashboardJobs(state.jobs.items), shallowEqual)
  const events = useSelector((state) => selectDashboardEvents(state.events.items), shallowEqual)
  const originCountry = user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ')
  const p2pCurrencies = useMemo(
    () => transferCurrenciesForCountry(originCountry),
    [originCountry],
  )
  const p2pOffers = useSelector(
    (state) => selectDashboardP2POffers(state.p2p.offers, { currencies: p2pCurrencies }),
    shallowEqual,
  )
  const p2pOrders = useSelector((state) => state.p2p.orders)
  const reviews = useSelector((state) => state.reviews.items)

  const stats = useDashboardStats(user)
  const rate = useExchangeRate()

  const listingsSection = authLoading || listings.length > 0 ? (
    <section className="grid min-w-0 gap-3">
      <DashboardSectionHeading
        title={t('dashboard.discovery.latestListings')}
        link="/marketplace"
        linkLabel={t('dashboard.discovery.viewMarket')}
      />
      <div className="relative min-w-0 pb-3">
        <div ref={listingsScrollRef} className={`${dashboardListingTrackClass} min-w-0`}>
          {authLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={dashboardListingItemClass}>
                  <SkeletonCard />
                </div>
              ))
            : listings.map((listing) => (
                <div key={listing.id} className={dashboardListingItemClass}>
                  <MarketplaceListingCard listing={listing} />
                </div>
              ))}
        </div>
        <ScrollArrows scrollRef={listingsScrollRef} />
      </div>
    </section>
  ) : null

  return (
    <div className="grid min-w-0 gap-6 overflow-x-clip sm:gap-7">
      <div className="min-w-0 overflow-x-clip">
        <StatusRail />
      </div>

      <DashboardStarsStrip />

      <DashboardServiceCarousels />

      <DashboardCalcBand user={user} />

      <div className="lg:hidden">
        <DashboardSearch />
      </div>

      {authLoading || p2pOffers.length > 0 ? (
        <section className="grid min-w-0 gap-3">
          <DashboardSectionHeading
            title={t('dashboard.discovery.latestP2P')}
            link="/p2p"
            linkLabel={t('dashboard.discovery.viewP2P')}
          />
          <div className="relative min-w-0 pb-3">
            <div ref={p2pScrollRef} className={`${dashboardP2PTrackClass} min-w-0`}>
              {authLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={dashboardP2PItemClass}>
                      <SkeletonCard />
                    </div>
                  ))
                : p2pOffers.map((offer) => (
                    <div key={offer.id} className={dashboardP2PItemClass}>
                      <P2POfferCard
                        offer={offer}
                        orders={p2pOrders}
                        reviews={reviews}
                        showActions={false}
                      />
                    </div>
                  ))}
            </div>
            <ScrollArrows scrollRef={p2pScrollRef} />
          </div>
        </section>
      ) : null}

      <DashboardQuickActionsSection />

      <DashboardTodoInbox todoItems={stats.todoItems} />

      <DashboardOverviewPanels {...stats} rate={rate} user={user} />

      <DashboardDiscoverySection
        conversations={stats.conversations}
        events={events}
        eventsLoading={authLoading}
        jobs={jobs}
        jobsLoading={authLoading}
        listingsSection={listingsSection}
        myTransfers={stats.myTransfers}
        parcels={parcels}
        parcelsLoading={authLoading}
      />
    </div>
  )
}
