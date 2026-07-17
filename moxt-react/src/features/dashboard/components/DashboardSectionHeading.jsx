import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'

export function DashboardSectionHeading({ link, linkLabel, title }) {
  const { t } = useLanguage()

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
          {t('dashboard.discovery.eyebrow')}
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">{title}</h2>
      </div>
      <Link
        to={link}
        className="group/link flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white px-3 py-2 text-xs font-black shadow-sm transition-all duration-[var(--transition-base)] hover:-translate-y-0.5 hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] hover:shadow-[var(--shadow-card-hover)] active:translate-y-0 sm:px-4 sm:text-sm dark:bg-[var(--app-surface)]"
      >
        <span className="hidden sm:inline">{linkLabel}</span>
        <FiArrowRight className="transition-transform duration-[var(--transition-base)] group-hover/link:translate-x-0.5" />
      </Link>
    </div>
  )
}
