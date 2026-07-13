import { FiArrowRight, FiEye } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import {
  replySupportTicket,
  updateSupportStatus,
} from '../../communications/communicationSlice'
import { renderDetailActions } from '../adminActions'
import { CARD } from '../adminConfig'
import {
  buildDetailFacts,
  detailDescriptionFor,
  detailIconFor,
  detailLabelFor,
  detailLinkFor,
} from '../adminData'
import { Empty, SectionTitle } from './AdminShared'

export function AdminDetailPanel({ admin, dispatch, onSuspendUser, selected, supportReply, setSupportReply }) {
  if (!selected) {
    return (
      <aside className={`${CARD} grid content-start gap-4 p-5 xl:sticky xl:top-24 xl:self-start`}>
        <SectionTitle icon={FiEye} label="Vue detaillee" />
        <Empty
          label="Selectionnez un element"
          sub="Cliquez sur un element dans la liste pour afficher sa fiche et ses actions."
          icon={FiEye}
        />
      </aside>
    )
  }

  const { kind, item } = selected
  const link = detailLinkFor(kind, item)
  const Icon = detailIconFor(kind)
  const itemName = item.title || item.name || item.subject || item.id

  return (
    <aside className={`${CARD} grid content-start gap-4 p-5 xl:sticky xl:top-24 xl:self-start`}>
      <div className="flex items-start gap-3 border-b border-[var(--app-border)] pb-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <Icon className="text-sm" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-brand-700">{detailLabelFor(kind)}</p>
          <h2 className="mt-0.5 truncate font-black">{itemName}</h2>
          <p className="mt-0.5 truncate text-xs text-[var(--app-text-muted)]">{detailDescriptionFor(kind, item)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {buildDetailFacts(kind, item).map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">{label}</p>
            <strong className="mt-0.5 block truncate text-sm">{String(value ?? '—')}</strong>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">Actions</p>
        <div className="flex flex-wrap gap-2">
          {renderDetailActions({ actorRole: admin?.role, dispatch, item, kind, onSuspendUser })}
        </div>
      </div>

      {kind === 'support' && (
        <div className="grid gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">Reponse detaillee</p>
          <textarea
            value={supportReply}
            onChange={(e) => setSupportReply(e.target.value)}
            placeholder="Reponse au ticket..."
            rows={4}
            className="w-full rounded-xl bg-[var(--app-surface)] p-3 text-sm outline-none ring-1 ring-[var(--app-border)] focus:ring-brand-500"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!supportReply.trim()) return
                dispatch(replySupportTicket({ ticketId: item.id, senderId: admin.id, senderName: `${admin.firstName} ${admin.lastName} - Support`, role: 'agent', text: supportReply }))
                setSupportReply('')
              }}
            >
              Envoyer
            </Button>
            <Button variant="secondary" onClick={() => dispatch(updateSupportStatus({ id: item.id, status: 'resolved' }))}>
              Cloturer
            </Button>
          </div>
        </div>
      )}

      {link && (
        <Link to={link} className="block">
          <Button variant="secondary" icon={FiArrowRight} className="w-full justify-center">
            Ouvrir la fiche complete
          </Button>
        </Link>
      )}
    </aside>
  )
}
