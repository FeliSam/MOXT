import { FiActivity } from 'react-icons/fi'
import { formatDate } from '../../transfers/transferUtils'
import { CARD } from '../adminConfig'
import { Empty, SectionTitle } from './AdminShared'

function severityColor(action = '') {
  const a = action.toLowerCase()
  if (a.includes('delete') || a.includes('suspend') || a.includes('reject')) return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
  if (a.includes('update') || a.includes('moderate') || a.includes('resolve')) return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
  if (a.includes('create') || a.includes('verify') || a.includes('publish')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
  return 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
}

export function AdminAuditPanel({ auditItems, setSelected }) {
  return (
    <div className={`${CARD} p-5 grid gap-4`}>
      <SectionTitle icon={FiActivity} label="Journal d'audit" count={auditItems.length} />
      {auditItems.length ? (
        <div className="relative grid gap-0">
          <div className="absolute left-5 top-3 bottom-3 w-px bg-[var(--app-border)]" aria-hidden />
          {auditItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected({ kind: 'audit', item })}
              className="relative flex items-start gap-4 py-3 text-left hover:bg-[var(--app-surface-muted)] px-3 rounded-xl transition-colors"
            >
              <span className={`relative z-10 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[8px] font-black ${severityColor(item.action)}`}>
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block text-sm">{item.action}</strong>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--app-text-muted)]">
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${severityColor(item.action)}`}>
                    {item.actorRole || 'system'}
                  </span>
                  <span>{item.targetId || 'global'}</span>
                </p>
              </div>
              <span className="shrink-0 text-xs text-[var(--app-text-muted)]">{formatDate(item.createdAt)}</span>
            </button>
          ))}
        </div>
      ) : (
        <Empty label="Aucun log d'audit." icon={FiActivity} />
      )}
    </div>
  )
}
