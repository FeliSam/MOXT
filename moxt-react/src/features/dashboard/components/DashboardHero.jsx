import { FiArrowRight, FiDownload } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../../../components/ui/Badge'
import { useLanguage } from '../../../contexts/useLanguage'
import { isProfileVerified } from '../../profile/userProfileUtils'
import { DashboardTransferCalculator } from '../../transfers/DashboardTransferCalculator'

const heroBtnBase =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] px-5 text-sm font-black transition sm:w-auto'

export function DashboardHero({ user, onOpenCalculator }) {
  const { t } = useLanguage()

  return (
    <section className="relative min-w-0 max-w-full overflow-hidden rounded-[var(--radius-card-lg)] bg-[linear-gradient(125deg,#07594d_0%,#08705f_42%,#245de8_100%)] px-4 py-6 text-white shadow-[var(--shadow-card-lg)] sm:px-10 sm:py-10 lg:px-14">
      <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 size-96 rounded-full bg-blue-400/25 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div className="min-w-0">
          <div className="inline-flex max-w-full items-center gap-1.5 text-sm font-bold text-white/90">
            <h1 className="truncate font-bold">
              {t('dashboard.hero.welcome', { name: user.firstName })}
            </h1>
            {isProfileVerified(user) ? (
              <VerifiedBadge size="sm" className="!text-emerald-200" />
            ) : null}
          </div>
          <div className="mt-5 grid min-w-0 grid-cols-1 gap-2.5 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <Link
              to="/transfers"
              className={`${heroBtnBase} bg-white text-emerald-950 shadow-xl hover:bg-emerald-50`}
            >
              {t('dashboard.hero.createTransfer')} <FiArrowRight />
            </Link>
            <Link
              to="/install"
              className={`${heroBtnBase} border border-white/45 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20`}
            >
              <FiDownload aria-hidden /> {t('dashboard.hero.install')}
            </Link>
            <Link
              to="/guide"
              className={`${heroBtnBase} border border-white/45 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20`}
            >
              {t('dashboard.hero.guide')}
            </Link>
          </div>
        </div>
        <div className="min-w-0">
          <DashboardTransferCalculator onOpen={onOpenCalculator} />
        </div>
      </div>
    </section>
  )
}
