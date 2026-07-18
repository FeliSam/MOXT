import { FiCheckCircle, FiHeadphones, FiMessageSquare } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import {
  replySupportTicket,
  updateSupportStatus,
} from '../../communications/communicationSlice'
import { CARD, ITEM } from '../adminConfig'
import { adminText } from '../adminI18n'
import { Empty, SectionTitle } from './AdminShared'

const PRIORITY_STYLES = {
  high: 'border-l-4 border-l-red-500',
  medium: 'border-l-4 border-l-amber-400',
  low: 'border-l-4 border-l-slate-300',
}

const PRIORITY_BADGE = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export function AdminSupportPanel({ admin, dispatch, reply, setReply, setSelected, tickets }) {
  const { t } = useLanguage()

  return (
    <div className={`${CARD} p-5 grid gap-4`}>
      <SectionTitle
        icon={FiHeadphones}
        label={adminText(t, 'admin.support.title')}
        count={tickets.length}
        tone={tickets.length ? 'warning' : 'success'}
      />
      {tickets.length ? (
        tickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`${ITEM} grid gap-3 ${PRIORITY_STYLES[ticket.priority] || ''}`}
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setSelected({ kind: 'support', item: ticket })}
                  className="text-left hover:text-brand-700"
                >
                  <strong className="block text-sm">{ticket.subject}</strong>
                  <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                    {adminText(t, 'admin.support.meta', {
                      name: ticket.userName,
                      count: ticket.messages?.length || 0,
                    })}
                  </p>
                </button>
              </div>
              <div className="flex shrink-0 gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${PRIORITY_BADGE[ticket.priority] || PRIORITY_BADGE.low}`}>
                  {ticket.priority || 'normal'}
                </span>
                <Badge>{ticket.status}</Badge>
              </div>
            </div>
            <textarea
              value={reply}
              onChange={(e) => { setSelected({ kind: 'support', item: ticket }); setReply(e.target.value) }}
              placeholder={adminText(t, 'admin.support.replyPlaceholder')}
              rows={3}
              className="w-full rounded-xl bg-[var(--app-surface)] p-3 text-sm outline-none ring-1 ring-[var(--app-border)] focus:ring-brand-500"
            />
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/messages?relatedType=support&relatedId=${encodeURIComponent(`support-${ticket.userId}`)}`}
              >
                <Button variant="secondary" icon={FiHeadphones}>
                  {adminText(t, 'admin.support.openChat')}
                </Button>
              </Link>
              <Button
                icon={FiMessageSquare}
                onClick={() => {
                  if (!reply.trim()) return
                  dispatch(replySupportTicket({
                    ticketId: ticket.id,
                    senderId: admin.id,
                    senderName: `${admin.firstName} ${admin.lastName} - Support`,
                    role: 'agent',
                    text: reply,
                  }))
                  setReply('')
                }}
              >
                {adminText(t, 'admin.support.reply')}
              </Button>
              <Button variant="secondary" icon={FiCheckCircle} onClick={() => dispatch(updateSupportStatus({ id: ticket.id, status: 'resolved' }))}>
                {adminText(t, 'admin.actions.resolve')}
              </Button>
            </div>
          </div>
        ))
      ) : (
        <Empty
          label={adminText(t, 'admin.empty.noTicket')}
          sub={adminText(t, 'admin.empty.allTicketsHandled')}
          icon={FiHeadphones}
        />
      )}
    </div>
  )
}
