import { useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { DashboardSearch } from '../components/ui/DashboardSearch'
import { Modal } from '../components/ui/Modal'
import { RevealOnScroll } from '../components/ui/RevealOnScroll'
import { DashboardDiscoverySection } from '../features/dashboard/components/DashboardDiscoverySection'
import { DashboardHero } from '../features/dashboard/components/DashboardHero'
import { DashboardOverviewPanels } from '../features/dashboard/components/DashboardOverviewPanels'
import { DashboardQuickActionsSection } from '../features/dashboard/components/DashboardQuickActionsSection'
import { DashboardServiceCarousels } from '../features/dashboard/components/DashboardServiceCarousels'
import { useDashboardStats } from '../features/dashboard/hooks/useDashboardStats'
import { TransferCalculator } from '../features/transfers/TransferCalculator'
import { useExchangeRate } from '../features/transfers/useExchangeRate'
import { useHorizontalScroll } from '../hooks/useHorizontalScroll'

export function DashboardPage() {
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const quickActionsRef = useHorizontalScroll()
  const trustHighlightsRef = useHorizontalScroll()
  const coreServicesRef = useHorizontalScroll()
  const listingsScrollRef = useHorizontalScroll()
  const user = useSelector((state) => state.auth.user)
  const authLoading = useSelector((state) => state.auth.status === 'loading')
  const listings = useSelector((state) => state.marketplace.items.slice(0, 4), shallowEqual)
  const parcels = useSelector((state) => state.parcels.items.slice(0, 5), shallowEqual)
  const jobs = useSelector((state) => state.jobs.items.slice(0, 5), shallowEqual)
  const events = useSelector((state) => state.events.items.slice(0, 5), shallowEqual)

  const stats = useDashboardStats(user)
  const rate = useExchangeRate()

  return (
    <div className="grid min-w-0 gap-6 overflow-x-clip sm:gap-8">
      <DashboardHero user={user} onOpenCalculator={() => setCalculatorOpen(true)} />

      <RevealOnScroll delay={60} className="lg:hidden">
        <DashboardSearch />
      </RevealOnScroll>

      <DashboardQuickActionsSection scrollRef={quickActionsRef} />

      <DashboardOverviewPanels
        {...stats}
        rate={rate}
        user={user}
      />

      <DashboardServiceCarousels
        coreServicesRef={coreServicesRef}
        trustHighlightsRef={trustHighlightsRef}
      />

      <DashboardDiscoverySection
        conversations={stats.conversations}
        events={events}
        eventsLoading={authLoading}
        jobs={jobs}
        jobsLoading={authLoading}
        listings={listings}
        listingsLoading={authLoading}
        listingsScrollRef={listingsScrollRef}
        myTransfers={stats.myTransfers}
        parcels={parcels}
        parcelsLoading={authLoading}
      />

      <Modal
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        title="Calculatrice de transfert"
        size="large"
      >
        <TransferCalculator verified={user.verified} />
      </Modal>
    </div>
  )
}
