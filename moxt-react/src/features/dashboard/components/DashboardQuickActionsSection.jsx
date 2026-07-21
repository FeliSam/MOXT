import { useLanguage } from '../../../contexts/useLanguage'
import { quickActions } from '../dashboardConfig'
import { DashboardBentoGrid } from './DashboardBentoGrid'

export function DashboardQuickActionsSection() {
  const { t } = useLanguage()

  return (
    <section className="grid min-w-0 gap-3" aria-label={t('dashboard.quickActions.title')}>
      <h2 className="text-2xl font-black tracking-[-0.035em] text-[var(--app-text)]">
        {t('dashboard.quickActions.title')}
      </h2>
      <DashboardBentoGrid items={quickActions} />
    </section>
  )
}
