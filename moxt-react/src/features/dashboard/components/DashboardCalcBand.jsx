import { useLanguage } from '../../../contexts/useLanguage'
import { DashboardTransferCalculator } from '../../transfers/DashboardTransferCalculator'
import { DashboardHero } from './DashboardHero'

/** Bandeau bienvenue + calculette — même teinte soft que la tuile Transferts. */
export function DashboardCalcBand({ user }) {
  const { t } = useLanguage()

  return (
    <section
      className="relative min-w-0 overflow-hidden rounded-[1.35rem] bg-[linear-gradient(125deg,color-mix(in_srgb,#07594d_68%,var(--app-surface))_0%,color-mix(in_srgb,#08705f_60%,var(--app-surface))_42%,color-mix(in_srgb,#245de8_48%,var(--app-surface-muted))_100%)] p-[5%] shadow-[var(--shadow-card)] dark:bg-[linear-gradient(125deg,rgba(7,89,77,0.78)_0%,rgba(8,112,95,0.68)_42%,rgba(36,93,232,0.55)_100%)]"
      aria-label={t('transfers.dashboardCalc.title')}
    >
      <div className="relative z-10 grid min-w-0 gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-5">
        <DashboardHero user={user} />
        <DashboardTransferCalculator />
      </div>
    </section>
  )
}
