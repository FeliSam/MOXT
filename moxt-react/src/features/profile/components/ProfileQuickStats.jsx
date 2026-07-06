import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'

export function ProfileQuickStats({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {stats.map(({ icon: Icon, label, to, value }) => (
        <Link key={label} to={to} className="group block min-w-0">
          <Card
            variant="finance"
            className="flex h-full items-center gap-3 p-3 transition-colors duration-[var(--transition-fast)] group-hover:border-brand-200 dark:group-hover:border-brand-800 sm:p-4"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-[var(--app-surface-muted)] text-[var(--app-accent)] dark:text-[var(--app-teal)]">
              <Icon className="text-lg" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <strong className="block text-xl font-black tabular-nums text-[var(--app-text)]">{value}</strong>
              <span className="text-[11px] font-semibold text-[var(--app-text-faint)]">{label}</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
