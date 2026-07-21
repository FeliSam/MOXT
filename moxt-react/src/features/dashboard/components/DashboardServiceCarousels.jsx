import { useLanguage } from '../../../contexts/useLanguage'
import { coreServices } from '../dashboardConfig'
import { DashboardBentoGrid } from './DashboardBentoGrid'

export function DashboardServiceCarousels() {
  const { t } = useLanguage()

  return (
    <section className="grid min-w-0 gap-3" aria-label={t('dashboard.services.title')}>
      <DashboardBentoGrid items={coreServices} />
    </section>
  )
}
