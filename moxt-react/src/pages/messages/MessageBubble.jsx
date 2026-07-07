import { useEffect, useRef } from 'react'
import {
  FiCornerUpLeft,
  FiEdit2,
  FiPaperclip,
  FiShare2,
  FiTrash2,
} from 'react-icons/fi'
import { initials, shortTime } from './format'
import { messageReadLabel } from './messageUtils'

function bubbleClassName(mine, groupedWithPrevious, groupedWithNext) {
  const classes = ['message-bubble', mine ? 'message-bubble--sent' : 'message-bubble--received']
  if (groupedWithPrevious) classes.push('message-bubble--grouped-prev')
  if (groupedWithNext) classes.push('message-bubble--grouped-next')
  return classes.join(' ')
}

export function MessageBubble({
  groupedWithNext = false,
  groupedWithPrevious = false,
  message,
  mine,
  onCloseActions,
  onDelete,
  onEdit,
  onReply,
  onShare,
  onToggleActions,
  openActions,
  repliedMessage,
  showSenderName = false,
  user,
}) {
  const stackRef = useRef(null)
  const readLabel = messageReadLabel(message, user.id)
  const statusClass = readLabel.includes('Lu')
    ? 'message-meta-status'
    : readLabel.includes('Distribué')
      ? 'message-meta-status opacity-80'
      : ''

  useEffect(() => {
    if (!openActions) return
    function handlePointerDown(event) {
      if (stackRef.current && !stackRef.current.contains(event.target)) {
        onCloseActions?.()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openActions, onCloseActions])

  function runAction(event, handler) {
    event.stopPropagation()
    handler(message)
    onCloseActions?.()
  }

  return (
    <div ref={stackRef} className={`message-stack ${mine ? 'message-stack--sent' : ''}`}>
      {showSenderName && !mine ? (
        <span className="message-sender-name">{message.senderName}</span>
      ) : null}

      <div
        className={bubbleClassName(mine, groupedWithPrevious, groupedWithNext)}
        onClick={onToggleActions}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggleActions()
          }
        }}
      >
        {repliedMessage ? (
          <p className={`message-quote ${mine ? 'message-quote--sent' : 'message-quote--received'}`}>
            {repliedMessage.text}
          </p>
        ) : null}

        <p className="whitespace-pre-wrap break-words">{message.text}</p>

        {message.attachment ? (
          <span
            className={`message-attachment ${mine ? 'message-attachment--sent' : 'message-attachment--received'}`}
          >
            <FiPaperclip aria-hidden="true" />
            {message.attachment.name}
          </span>
        ) : null}

        {message.reactions?.like?.length ? (
          <span className="message-reaction">👍 {message.reactions.like.length}</span>
        ) : null}
      </div>

      {openActions ? (
        <div
          className={`message-action-menu ${mine ? 'message-action-menu--sent' : ''}`}
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={(event) => runAction(event, () => onReply(message.id))}
            aria-label="Répondre"
            className="message-action-menu-btn"
          >
            <FiCornerUpLeft />
          </button>
          <button
            type="button"
            onClick={(event) => runAction(event, onShare)}
            aria-label="Partager"
            className="message-action-menu-btn"
          >
            <FiShare2 />
          </button>
          {mine ? (
            <button
              type="button"
              onClick={(event) => runAction(event, onEdit)}
              aria-label="Modifier"
              className="message-action-menu-btn"
            >
              <FiEdit2 />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(event) => runAction(event, () => onDelete(message.id))}
            aria-label="Supprimer"
            className="message-action-menu-btn message-action-menu-btn--danger"
          >
            <FiTrash2 />
          </button>
        </div>
      ) : null}

      {!groupedWithNext ? (
        <div className={`message-meta ${mine ? 'message-meta--sent' : ''}`}>
          <time dateTime={message.createdAt}>{shortTime(message.createdAt)}</time>
          {mine && readLabel ? <span className={statusClass}>{readLabel}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export function MessageAvatar({ name, avatarUrl, hidden = false, className = '' }) {
  if (!hidden && avatarUrl) {
    return (
      <span
        className={`message-avatar overflow-hidden ${hidden ? 'message-avatar--ghost' : ''} ${className}`}
        aria-hidden={hidden}
      >
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      </span>
    )
  }
  return (
    <span
      className={`message-avatar ${hidden ? 'message-avatar--ghost' : ''} ${className}`}
      aria-hidden={hidden}
    >
      {initials(name)}
    </span>
  )
}

export function MessageDateSeparator({ date }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-[var(--app-border)]/80" />
      <span className="message-date-chip">
        {date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
        })}
      </span>
      <span className="h-px flex-1 bg-[var(--app-border)]/80" />
    </div>
  )
}

export function MessageThreadStart() {
  return (
    <div className="my-3 flex justify-center">
      <span className="message-date-chip">Début de la conversation</span>
    </div>
  )
}

export function MessageSecurityNotice() {
  return (
    <div
      className="message-security-notice mx-auto my-4 max-w-md rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-center shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30"
      data-testid="message-security-notice"
    >
      <p className="text-[11px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-200">
        Consignes de sécurité
      </p>
      <p className="mt-2 text-xs leading-5 text-amber-900/90 dark:text-amber-100/90">
        Vérifiez l'identité de votre interlocuteur et les détails de l'annonce avant tout engagement.
        Ne payez jamais en dehors de MOXT sans garanties, évitez les actions risquées et privilégiez
        les échanges dans des lieux sûrs. Signalez tout comportement suspect.
      </p>
    </div>
  )
}

export function MessageEmptyState() {
  return (
    <div className="mx-auto mt-8 max-w-sm rounded-[var(--radius-card-lg)] border border-dashed border-[var(--app-border)] bg-[var(--app-surface)]/90 px-6 py-8 text-center shadow-[var(--shadow-card)]">
      <p className="font-display text-sm font-extrabold text-[var(--app-text)]">
        Aucun message pour l’instant
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
        Écrivez le premier message pour démarrer l’échange.
      </p>
    </div>
  )
}

export function shouldGroupMessages(previous, current, showDate) {
  if (!previous || showDate) return false
  if (previous.senderId !== current.senderId) return false
  return new Date(current.createdAt) - new Date(previous.createdAt) < 5 * 60 * 1000
}
