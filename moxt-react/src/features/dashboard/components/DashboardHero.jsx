import { FiArrowRight } from 'react-icons/fi'
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
    <section className="relative overflow-hidden rounded-[var(--radius-card-lg)] bg-[linear-gradient(125deg,#07594d_0%,#08705f_42%,#245de8_100%)] px-5 py-7 text-white shadow-[var(--shadow-card-lg)] sm:px-10 sm:py-10 lg:px-14">
      <div className="absolute -right-24 -top-32 size-96 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div className="min-w-0">
          <div className="inline-flex max-w-full items-center gap-1.5 text-sm font-bold text-white/90">
            <span className="truncate">{t('dashboard.hero.welcome', { name: user.firstName })}</span>
            {isProfileVerified(user) ? (
              <VerifiedBadge size="sm" className="!text-emerald-200" />
            ) : null}
          </div>
          <h1 className="font-display mt-4 max-w-4xl text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
            {t('dashboard.hero.title')}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
            {t('dashboard.hero.subtitleShort')}
          </p>
          <div className="mt-7 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <Link
              to="/transfers"
              className={`${heroBtnBase} bg-white text-emerald-950 shadow-xl hover:bg-emerald-50`}
            >
              {t('dashboard.hero.createTransfer')} <FiArrowRight />
            </Link>
            <Link
              to="/news"
              className={`${heroBtnBase} border border-white/45 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20`}
            >
              {t('dashboard.hero.news')}
            </Link>
            <Link
              to="/guide"
              className={`${heroBtnBase} border border-white/45 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20`}
            >
              {t('dashboard.hero.guide')}
            </Link>
          </div>
        </div>
        <DashboardTransferCalculator onOpen={onOpenCalculator} />
      </div>
    </section>
  )
}
