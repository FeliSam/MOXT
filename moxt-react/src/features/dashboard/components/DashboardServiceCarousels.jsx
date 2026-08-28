import { useMemo } from 'react'
import { useLanguage } from '../../../contexts/useLanguage'
import { useDevModuleNavAccess } from '../../../hooks/useDevModuleAccess'
import { coreServices } from '../dashboardConfig'
import { DashboardBentoGrid } from './DashboardBentoGrid'

export function DashboardServiceCarousels() {
  const { t } = useLanguage()
  const canModule = useDevModuleNavAccess()
  const items = useMemo(
    () => coreServices.filter((item) => !item.devModule || canModule(item.devModule)),
    [canModule],
  )

  return (
    <section className="grid min-w-0 gap-3" aria-label={t('dashboard.services.title')}>
      <DashboardBentoGrid items={items} />
    </section>
  )
}
