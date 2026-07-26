import { FiCheckCircle, FiChevronRight, FiInbox } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'

export function DashboardTodoInbox({ todoItems = [] }) {
  const { t } = useLanguage()

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <FiInbox />
        </span>
        <div>
          <h2 className="font-black">{t('dashboard.overview.todoTitle')}</h2>
          <p className="text-xs text-[var(--app-text-muted)]">
            {t('dashboard.overview.todoDescription')}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {todoItems.length ? (
          todoItems.map((item) => (
            <Link
              key={item.labelKey}
              to={item.to}
              className="flex items-center gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-3 transition hover:bg-[var(--app-accent-soft)]"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-surface)] text-[var(--app-accent)]">
                <item.icon />
              </span>
              <span className="min-w-0 flex-1 text-sm font-bold">
                {t(item.labelKey, { count: item.count })}
              </span>
              <FiChevronRight className="shrink-0 text-[var(--app-text-muted)]" />
            </Link>
          ))
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <FiCheckCircle /> {t('dashboard.overview.allUpToDate')}
          </p>
        )}
      </div>
    </Card>
  )
}
