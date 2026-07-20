import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../../../components/ui/Badge'
import { useLanguage } from '../../../contexts/useLanguage'
import { isProfileVerified } from '../../profile/userProfileUtils'
import { DashboardTransferCalculator } from '../../transfers/DashboardTransferCalculator'

export function DashboardHero({ user, onOpenCalculator }) {
  const { t } = useLanguage()

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card-lg)] bg-[linear-gradient(125deg,#07594d_0%,#08705f_42%,#245de8_100%)] px-6 py-8 text-white shadow-[var(--shadow-card-lg)] sm:px-10 sm:py-10 lg:px-14">
      <div className="absolute -right-24 -top-32 size-96 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 text-sm font-bold text-white/90">
            <span>{t('dashboard.hero.welcome', { name: user.firstName })}</span>
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
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              to="/transfers"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-white px-5 text-sm font-black text-emerald-950 shadow-xl transition hover:bg-emerald-50"
            >
              {t('dashboard.hero.createTransfer')} <FiArrowRight />
            </Link>
            <Link to="/news" className="text-sm font-bold text-white/85 underline-offset-4 hover:underline">
              {t('dashboard.hero.news')}
            </Link>
            <Link to="/guide" className="text-sm font-bold text-white/85 underline-offset-4 hover:underline">
              {t('dashboard.hero.guide')}
            </Link>
          </div>
        </div>
        <DashboardTransferCalculator onOpen={onOpenCalculator} />
      </div>
    </section>
  )
}
