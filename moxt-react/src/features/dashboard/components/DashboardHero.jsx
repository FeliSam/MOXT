import { FiDownload } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../../../components/ui/Badge'
import { useLanguage } from '../../../contexts/useLanguage'
import { isNative } from '../../../platform/capacitor'
import { isProfileVerified } from '../../profile/userProfileUtils'

const heroBtnBase =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-[var(--app-surface)] px-4 text-sm font-semibold text-[var(--app-text)] shadow-[var(--shadow-card)] transition hover:bg-[color-mix(in_srgb,var(--app-teal)_10%,var(--app-surface))] hover:text-[var(--app-teal)]'

/**
 * Bienvenue + CTAs — destinés à vivre dans le bandeau calculette.
 */
export function DashboardHero({ user }) {
  const { t } = useLanguage()

  return (
    <div className="min-w-0">
      <div className="inline-flex max-w-full items-center gap-1.5">
        <h1 className="truncate text-xl font-black tracking-tight text-[var(--app-text)] sm:text-2xl">
          {t('dashboard.hero.welcome', { name: user?.firstName || 'MOXT' })}
        </h1>
        {isProfileVerified(user) ? <VerifiedBadge size="sm" /> : null}
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
        {!isNative ? (
          <Link to="/install" className={heroBtnBase}>
            <FiDownload aria-hidden /> {t('dashboard.hero.install')}
          </Link>
        ) : null}
        <Link to="/guide" className={heroBtnBase}>
          {t('dashboard.hero.guide')}
        </Link>
      </div>
    </div>
  )
}
