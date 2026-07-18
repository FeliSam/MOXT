import { FiActivity, FiDownload } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { formatDate } from '../../transfers/transferUtils'
import { CARD } from '../adminConfig'
import { adminText } from '../adminI18n'
import { Empty, SectionTitle } from './AdminShared'

function severityColor(action = '') {
  const a = action.toLowerCase()
  if (a.includes('delete') || a.includes('suspend') || a.includes('reject')) {
    return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
  }
  if (a.includes('update') || a.includes('moderate') || a.includes('resolve')) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
  }
  if (a.includes('create') || a.includes('verify') || a.includes('publish')) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
  }
  return 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
}

function formatActionLabel(action = '') {
  return String(action).replace(/\//g, ' · ')
}

export function exportAuditItems(items) {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `moxt-audit-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function AdminAuditPanel({ auditItems, selectedId, setSelected }) {
  const { t } = useLanguage()

  return (
    <div className={`${CARD} grid min-w-0 gap-4 overflow-hidden p-4 sm:p-5`}>
      <SectionTitle
        icon={FiActivity}
        label={adminText(t, 'admin.audit.title')}
        count={auditItems.length}
        action={
          auditItems.length ? (
            <Button
              variant="secondary"
              size="sm"
              icon={FiDownload}
              className="max-w-full"
              onClick={() => exportAuditItems(auditItems)}
            >
              <span className="hidden sm:inline">{adminText(t, 'admin.audit.export')}</span>
              <span className="sm:hidden">{adminText(t, 'admin.page.export')}</span>
            </Button>
          ) : null
        }
      />

      {auditItems.length ? (
        <>
          {/* Mobile / tablette : cartes empilées */}
          <div className="grid min-w-0 gap-2 md:hidden">
            {auditItems.map((item, idx) => {
              const active = selectedId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected({ kind: 'audit', item })}
                  className={`grid min-w-0 gap-2 rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? 'border-brand-300 bg-[var(--app-accent-soft)]/35 shadow-sm'
                      : 'border-[var(--app-border)] hover:bg-[var(--app-surface-muted)]'
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded-full text-[9px] font-black ${severityColor(item.action)}`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block break-words text-sm leading-snug">
                        {formatActionLabel(item.action)}
                      </strong>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--app-text-muted)]">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${severityColor(item.action)}`}
                        >
                          {item.actorRole || 'system'}
                        </span>
                        <span className="break-all [overflow-wrap:anywhere]">
                          {item.targetId || adminText(t, 'admin.audit.globalFallback')}
                        </span>
                      </p>
                    </div>
                  </div>
                  <time
                    dateTime={item.createdAt}
                    className="pl-9 text-[11px] font-semibold tabular-nums text-[var(--app-text-faint)]"
                  >
                    {formatDate(item.createdAt)}
                  </time>
                </button>
              )
            })}
          </div>

          {/* Desktop : tableau scrollable */}
          <div className="hidden min-w-0 md:block">
            <div className="max-h-[min(70vh,42rem)] overflow-auto rounded-2xl border border-[var(--app-border)]">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--app-surface-muted)] text-[11px] font-black uppercase tracking-wide text-[var(--app-text-muted)]">
                  <tr>
                    <th className="w-12 p-3">#</th>
                    <th className="p-3">{adminText(t, 'admin.facts.action')}</th>
                    <th className="w-28 p-3">{adminText(t, 'admin.facts.role')}</th>
                    <th className="p-3">{adminText(t, 'admin.facts.reference')}</th>
                    <th className="w-36 p-3">{adminText(t, 'admin.facts.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditItems.map((item, idx) => {
                    const active = selectedId === item.id
                    return (
                      <tr
                        key={item.id}
                        className={`cursor-pointer border-t border-[var(--app-border)] transition-colors ${
                          active
                            ? 'bg-[var(--app-accent-soft)]/35'
                            : 'hover:bg-[var(--app-surface-muted)]'
                        }`}
                        onClick={() => setSelected({ kind: 'audit', item })}
                      >
                        <td className="p-3">
                          <span
                            className={`grid size-6 place-items-center rounded-full text-[9px] font-black ${severityColor(item.action)}`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="max-w-[14rem] p-3 font-semibold leading-snug [overflow-wrap:anywhere]">
                          {formatActionLabel(item.action)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-black ${severityColor(item.action)}`}
                          >
                            {item.actorRole || 'system'}
                          </span>
                        </td>
                        <td className="max-w-[12rem] p-3 text-xs text-[var(--app-text-muted)] [overflow-wrap:anywhere]">
                          {item.targetId || adminText(t, 'admin.audit.globalFallback')}
                        </td>
                        <td className="whitespace-nowrap p-3 text-xs tabular-nums text-[var(--app-text-muted)]">
                          {formatDate(item.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <Empty label={adminText(t, 'admin.empty.noAuditLog')} icon={FiActivity} />
      )}
    </div>
  )
}
