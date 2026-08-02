import { useLanguage } from '../../../contexts/useLanguage'
import { DashboardTransferCalculator } from '../../transfers/DashboardTransferCalculator'
import { DashboardHero } from './DashboardHero'

/** Bandeau bienvenue + calculette — même teinte soft que la tuile Transferts. */
export function DashboardCalcBand({ user }) {
  const { t } = useLanguage()

  return (
    <section
      className="relative min-w-0 overflow-hidden rounded-[1.35rem] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-teal)_11.86%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] p-[5%] shadow-[var(--shadow-card)] dark:bg-[linear-gradient(135deg,rgba(8,112,95,0.237)_0%,var(--app-surface-muted)_100%)]"
      aria-label={t('transfers.dashboardCalc.title')}
    >
      <div className="relative z-10 grid min-w-0 gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-5">
        <DashboardHero user={user} />
        <DashboardTransferCalculator />
      </div>
    </section>
  )
}
