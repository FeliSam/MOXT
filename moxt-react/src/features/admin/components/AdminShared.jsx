import { FiCheckCircle, FiFilter, FiSearch, FiTrendingUp, FiX } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { CARD, CHIP, VIEW_FILTERS } from '../adminConfig'
import { adminText } from '../adminI18n'

export function SectionTitle({ count, icon: Icon, label, tone = 'default', action }) {
  const tones = {
    default: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  }
  return (
    <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="text-sm" />
      </span>
      <h2 className="font-black">{label}</h2>
      {count != null && (
        <span className="rounded-full bg-[var(--app-surface-muted)] px-2.5 py-0.5 text-xs font-black text-[var(--app-text-muted)]">
          {count}
        </span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

export function Empty({ icon: Icon = FiCheckCircle, label, sub }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-[var(--app-border)] px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
        <Icon className="text-xl" />
      </span>
      <div>
        <p className="font-bold text-[var(--app-text-muted)]">{label}</p>
        {sub && <p className="mt-1 text-xs text-[var(--app-text-muted)] opacity-70">{sub}</p>}
      </div>
    </div>
  )
}

export function MetricCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className={`${CARD} flex items-center gap-3 p-4`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white`}>
        <Icon className="text-sm" />
      </span>
      <div>
        <strong className="block text-xl font-black">{value}</strong>
        <p className="text-xs text-[var(--app-text-muted)]">{label}</p>
      </div>
    </div>
  )
}

export function TrendChip({ trend, value }) {
  if (trend === 'up') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
        <FiTrendingUp className="text-xs" />
        {value}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-text-muted)]">
      {value}
    </span>
  )
}

function StatusChip({ label, value }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="opacity-70">{label}</span>
      <strong>{value}</strong>
    </span>
  )
}

export function GlobalFilterBar({ query, setQuery, statusFilter, setStatusFilter, view }) {
  const { t } = useLanguage()
  const filters = VIEW_FILTERS[view] || []
  return (
    <div className={`${CARD} flex min-w-0 flex-wrap items-center gap-3 p-3`}>
      <div className="flex min-w-0 flex-1 basis-full items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2.5 sm:min-w-[16rem]">
        <FiSearch className="shrink-0 text-sm text-[var(--app-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={adminText(t, 'admin.filters.searchPlaceholder')}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--app-text-muted)]"
        />
        {query ? (
          <button type="button" onClick={() => setQuery('')} className="text-[var(--app-text-muted)] hover:text-[var(--app-text)]">
            <FiX className="text-sm" />
          </button>
        ) : null}
      </div>
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <FiFilter className="text-xs text-[var(--app-text-muted)]" />
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`${CHIP} ${
                statusFilter === f
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface)]'
              }`}
            >
              {f === 'all' ? adminText(t, 'admin.filters.all') : f}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function SystemStatusBar({ metrics, queues, onOpenQueues }) {
  const { t } = useLanguage()
  const hasAlert = queues.urgent > 0
  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-2xl px-5 py-3 text-xs font-bold ${
        hasAlert
          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
          : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
      }`}
    >
      <span className="flex items-center gap-2">
        <span className={`relative inline-flex size-2.5 rounded-full ${hasAlert ? 'bg-amber-500' : 'bg-emerald-500'}`}>
          <span className={`absolute inset-0 animate-ping rounded-full ${hasAlert ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`} />
        </span>
        {hasAlert ? adminText(t, 'admin.shell.alertsPending') : adminText(t, 'admin.shell.systemOk')}
      </span>
      <span className="text-[var(--app-text-muted)]">|</span>
      <StatusChip label={adminText(t, 'admin.shell.kpi.transfersPending')} value={metrics.transfers.pending} />
      <StatusChip label={adminText(t, 'admin.shell.kpi.contentPending')} value={metrics.content.pending} />
      {onOpenQueues ? (
        <button type="button" onClick={onOpenQueues} className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <StatusChip label={adminText(t, 'admin.shell.kpi.urgentQueues')} value={queues.urgent} />
        </button>
      ) : (
        <StatusChip label={adminText(t, 'admin.shell.kpi.urgentQueues')} value={queues.urgent} />
      )}
      <StatusChip label={adminText(t, 'admin.shell.kpi.auditLogs')} value={metrics.audit.total} />
      <span className="ml-auto text-[var(--app-text-muted)]">
        {new Date().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
      </span>
    </div>
  )
}
