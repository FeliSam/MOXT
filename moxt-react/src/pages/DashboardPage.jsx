import { useState } from 'react'
import { useSelector } from 'react-redux'
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
import {
  useGetEventsQuery,
  useGetJobsQuery,
  useGetListingsQuery,
  useGetParcelsQuery,
} from '../services/baseApi'

export function DashboardPage() {
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const quickActionsRef = useHorizontalScroll()
  const trustHighlightsRef = useHorizontalScroll()
  const coreServicesRef = useHorizontalScroll()
  const listingsScrollRef = useHorizontalScroll()
  const user = useSelector((state) => state.auth.user)
  const { data: listingsData, isLoading: listingsLoading } = useGetListingsQuery({ limit: 4 })
  const { data: parcelsData, isLoading: parcelsLoading } = useGetParcelsQuery({ limit: 5 })
  const { data: jobsData, isLoading: jobsLoading } = useGetJobsQuery({ limit: 5 })
  const { data: eventsData, isLoading: eventsLoading } = useGetEventsQuery({ limit: 5 })

  const stats = useDashboardStats(user)
  const rate = useExchangeRate()

  return (
    <div className="grid min-w-0 gap-6 overflow-x-clip sm:gap-8">
      <DashboardHero user={user} onOpenCalculator={() => setCalculatorOpen(true)} />

      <RevealOnScroll delay={60} className="relative z-30 lg:hidden">
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
        events={eventsData?.items ?? []}
        eventsLoading={eventsLoading}
        jobs={jobsData?.items ?? []}
        jobsLoading={jobsLoading}
        listings={listingsData?.items ?? []}
        listingsLoading={listingsLoading}
        listingsScrollRef={listingsScrollRef}
        myTransfers={stats.myTransfers}
        parcels={parcelsData?.items ?? []}
        parcelsLoading={parcelsLoading}
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
