import { useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { DashboardSearch } from '../components/ui/DashboardSearch'
import { Modal } from '../components/ui/Modal'
import { SkeletonCard } from '../components/ui/Skeleton'
import { DashboardDiscoverySection } from '../features/dashboard/components/DashboardDiscoverySection'
import { DashboardHero } from '../features/dashboard/components/DashboardHero'
import { DashboardOverviewPanels } from '../features/dashboard/components/DashboardOverviewPanels'
import { DashboardQuickActionsSection } from '../features/dashboard/components/DashboardQuickActionsSection'
import { DashboardSectionHeading } from '../features/dashboard/components/DashboardSectionHeading'
import { DashboardServiceCarousels } from '../features/dashboard/components/DashboardServiceCarousels'
import { ScrollArrows } from '../features/dashboard/components/ScrollArrows'
import {
  dashboardListingItemClass,
  dashboardListingTrackClass,
} from '../features/dashboard/dashboardConfig'
import { useDashboardStats } from '../features/dashboard/hooks/useDashboardStats'
import { MarketplaceListingCard } from '../features/marketplace/MarketplaceListingCard'
import { TransferCalculator } from '../features/transfers/TransferCalculator'
import { useExchangeRate } from '../features/transfers/useExchangeRate'
import { useHorizontalScroll } from '../hooks/useHorizontalScroll'
import { useLanguage } from '../contexts/useLanguage'

export function DashboardPage() {
  const { t } = useLanguage()
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const coreServicesRef = useHorizontalScroll()
  const quickActionsScrollRef = useHorizontalScroll()
  const listingsScrollRef = useHorizontalScroll()
  const user = useSelector((state) => state.auth.user)
  const authLoading = useSelector((state) => state.auth.status === 'loading')
  const listings = useSelector((state) => state.marketplace.items.slice(0, 4), shallowEqual)
  const parcels = useSelector((state) => state.parcels.items.slice(0, 5), shallowEqual)
  const jobs = useSelector((state) => state.jobs.items.slice(0, 5), shallowEqual)
  const events = useSelector((state) => state.events.items.slice(0, 5), shallowEqual)

  const stats = useDashboardStats(user)
  const rate = useExchangeRate()

  const listingsSection = (
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
  )

  return (
    <div className="grid min-w-0 gap-6 overflow-x-clip sm:gap-7">
      <DashboardHero user={user} onOpenCalculator={() => setCalculatorOpen(true)} />

      <div className="lg:hidden">
        <DashboardSearch />
      </div>

      <DashboardQuickActionsSection scrollRef={quickActionsScrollRef} />

      <DashboardOverviewPanels {...stats} rate={rate} user={user} />

      <DashboardServiceCarousels coreServicesRef={coreServicesRef} />

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

      <Modal
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        title={t('dashboard.calculatorTitle')}
        size="large"
      >
        <TransferCalculator verified={user.verified} />
      </Modal>
    </div>
  )
}
