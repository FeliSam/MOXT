import { useState } from 'react'
import { FiMessageCircle, FiSend } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { addOrderComment } from '../p2pSlice'
import { p2pOrderComments } from '../p2pUtils'
import { formatDate } from '../../transfers/transferUtils'

export function P2POrderThread({ order, user, t, canWrite }) {
  const dispatch = useDispatch()
  const [draft, setDraft] = useState('')
  const comments = p2pOrderComments(order?.timeline)

  function send() {
    const text = draft.trim()
    if (!text || !order?.id || !user?.id) return
    dispatch(
      addOrderComment({
        id: order.id,
        userId: user.id,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        text,
      }),
    )
    setDraft('')
  }

  return (
    <div className="grid min-w-0 gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-black">
          <FiMessageCircle aria-hidden />
          {t('p2p.order.threadTitle')}
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{t('p2p.order.threadHint')}</p>
      </div>
      <div className="grid max-h-56 gap-2 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-xs text-[var(--app-text-faint)]">{t('p2p.order.threadEmpty')}</p>
        ) : (
          comments.map((event) => {
            const mine = event.userId === user?.id
            return (
              <div
                key={`${event.at}-${event.userId}-${event.text}`}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? 'ml-auto bg-[color-mix(in_srgb,var(--app-teal)_18%,var(--app-surface))]'
                    : 'bg-[var(--app-surface)]'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
                  {mine ? t('p2p.order.threadYou') : event.userName || t('p2p.order.threadOther')}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words">{event.text}</p>
                <p className="mt-1 text-[10px] text-[var(--app-text-faint)]">{formatDate(event.at)}</p>
              </div>
            )
          })
        )}
      </div>
      {canWrite ? (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 500))}
            placeholder={t('p2p.order.threadPlaceholder')}
            rows={2}
            className="min-h-11 min-w-0 w-full flex-1 resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            icon={FiSend}
            disabled={!draft.trim()}
            onClick={send}
            className="w-full sm:w-auto"
          >
            {t('p2p.order.threadSend')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
