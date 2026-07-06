import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export function DashboardSectionHeading({ link, linkLabel, title }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-700">
          Découvrir MOXT
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">{title}</h2>
      </div>
      <Link
        to={link}
        className="flex items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white px-3 py-2 text-xs font-black shadow-sm transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] sm:px-4 sm:text-sm dark:bg-[var(--app-surface)]"
      >
        <span className="hidden sm:inline">{linkLabel}</span>
        <FiArrowRight />
      </Link>
    </div>
  )
}
