import { useMemo } from 'react'
import { useLanguage } from '../../../contexts/useLanguage'
import { useDevModuleNavAccess } from '../../../hooks/useDevModuleAccess'
import { quickActions } from '../dashboardConfig'
import { DashboardBentoGrid } from './DashboardBentoGrid'

export function DashboardQuickActionsSection() {
  const { t } = useLanguage()
  const canModule = useDevModuleNavAccess()
  const items = useMemo(
    () => quickActions.filter((item) => !item.devModule || canModule(item.devModule)),
    [canModule],
  )

  if (items.length === 0) return null

  return (
    <section className="hidden min-w-0 gap-3 lg:grid" aria-label={t('dashboard.quickActions.title')}>
      <h2 className="text-2xl font-black tracking-[-0.035em] text-[var(--app-text)]">
        {t('dashboard.quickActions.title')}
      </h2>
      <DashboardBentoGrid items={items} />
    </section>
  )
}
