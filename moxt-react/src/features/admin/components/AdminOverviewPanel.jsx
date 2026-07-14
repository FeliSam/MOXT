import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiLayers,
  FiRepeat,
} from 'react-icons/fi'
import { TransferStatusBadge } from '../../transfers/TransferStatusBadge'
import { formatMoney } from '../../transfers/transferUtils'
import { CARD, CONTENT_SECTIONS, ITEM } from '../adminConfig'
import { statusDotColor } from '../adminUtils'
import { Empty, SectionTitle } from './AdminShared'

export function AdminOverviewPanel({ content, metrics, onOpenContent, onOpenView, queues, setSelected, transfers }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { key: 'transfers', icon: FiRepeat, label: 'Piloter les transferts', value: `${metrics.transfers.pending} en cours`, color: 'from-teal-600 to-cyan-500' },
          { key: 'content', icon: FiLayers, label: 'Moderer les contenus', value: `${metrics.content.pending} en attente`, color: 'from-violet-600 to-purple-500' },
          { key: 'queues', icon: FiAlertTriangle, label: 'Traiter les files', value: `${queues.urgent} urgentes`, color: 'from-amber-500 to-orange-500' },
        ].map((action) => (
          <button key={action.key} type="button" onClick={() => onOpenView(action.key)} className="text-left">
            <div className={`${CARD} group relative h-full overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgb(15_23_42/0.1)]`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-[0.06] transition-opacity group-hover:opacity-[0.10]`} />
              <div className="relative">
                <span className={`inline-grid size-10 place-items-center rounded-xl bg-gradient-to-br ${action.color} text-white shadow-sm`}>
                  <action.icon className="text-sm" />
                </span>
                <strong className="mt-3 block text-xl font-black">{action.value}</strong>
                <p className="mt-1 flex items-center gap-1 text-sm font-bold text-[var(--app-text-muted)]">
                  {action.label} <FiArrowRight className="text-xs opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className={`${CARD} p-5 grid gap-4`}>
        <SectionTitle icon={FiLayers} label="Modules de contenu" count={metrics.content.total} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {CONTENT_SECTIONS.map((section) => {
            const count = content[section.id]?.length || 0
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onOpenContent(section.id)}
                className={`${ITEM} text-left`}
              >
                <span className={`inline-grid size-9 place-items-center rounded-xl ${section.color}`}>
                  <section.icon className="text-sm" />
                </span>
                <strong className="mt-2.5 block text-sm">{section.label}</strong>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">{count} element(s)</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`${CARD} p-5 grid gap-4`}>
          <SectionTitle
            icon={FiRepeat}
            label="Transferts recents"
            count={transfers.length}
            action={
              <button type="button" onClick={() => onOpenView('transfers')} className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
                Tout voir <FiArrowRight className="text-xs" />
              </button>
            }
          />
          <div className="grid gap-2">
            {transfers.slice(0, 5).map((transfer) => (
              <button
                key={transfer.id}
                type="button"
                onClick={() => setSelected({ kind: 'transfer', item: transfer })}
                className={`${ITEM} flex items-center gap-3 text-left`}
              >
                <span className={`size-2 shrink-0 rounded-full ${statusDotColor(transfer.status)}`} />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{transfer.id}</strong>
                  <p className="truncate text-xs text-[var(--app-text-muted)]">{transfer.exchanger?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{formatMoney(transfer.amountSent, transfer.currencyFrom)}</p>
                  <TransferStatusBadge status={transfer.status} />
                </div>
              </button>
            ))}
            {!transfers.length && <Empty label="Aucun transfert." icon={FiRepeat} />}
          </div>
        </div>

        <div className={`${CARD} p-5 grid gap-4`}>
          <SectionTitle
            icon={FiAlertTriangle}
            label="Priorites du moment"
            count={queues.urgent}
            tone={queues.urgent ? 'warning' : 'success'}
          />
          <div className="grid gap-2">
            {[
              { label: 'Suppressions de compte', count: queues.accountDeletions.length, view: 'queues' },
              { label: 'Verifications', count: queues.verifications.length, view: 'verifications' },
              { label: 'Litiges ouverts', count: queues.disputes.length, view: 'queues' },
              { label: 'Avis en attente', count: queues.reviews.length, view: 'queues' },
              { label: 'Signalements', count: queues.reports.length, view: 'queues' },
            ].map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => onOpenView(q.view)}
                className={`${ITEM} flex items-center gap-3 text-left`}
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${q.count > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                  {q.count > 0 ? <FiAlertCircle className="text-sm" /> : <FiCheckCircle className="text-sm" />}
                </span>
                <span className="flex-1 text-sm font-bold">{q.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${q.count > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'}`}>
                  {q.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
