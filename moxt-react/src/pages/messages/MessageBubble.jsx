import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  FiAlertCircle,
  FiCheck,
  FiCopy,
  FiCornerUpLeft,
  FiEdit2,
  FiRefreshCw,
  FiTrash2,
} from 'react-icons/fi'
import { initials, shortTime, formatDateLabel } from './format'
import { messageReadStatus } from './messageUtils'
import {
  attachmentImageSrcs,
  isImageAttachment,
} from '../../features/communications/attachmentUtils'
import { MessageAttachment } from './MessageAttachment'
import { useLanguage } from '../../contexts/useLanguage'
import { messagesText } from '../../features/communications/messagesI18n'
import { EntityVerifiedName } from '../../components/ui/EntityVerifiedName'

function bubbleClassName(mine, groupedWithPrevious, groupedWithNext, failed) {
  const classes = ['message-bubble', mine ? 'message-bubble--sent' : 'message-bubble--received']
  if (groupedWithPrevious) classes.push('message-bubble--grouped-prev')
  if (groupedWithNext) classes.push('message-bubble--grouped-next')
  if (failed) classes.push('message-bubble--failed')
  return classes.join(' ')
}

const LONG_PRESS_MS = 450

function MessageReadStatus({ pending, pop = false, status }) {
  const { t } = useLanguage()
  if (pending) {
    return (
      <span
        className="message-meta-status message-meta-status--pending"
        title={t('messages.statusSending')}
        aria-label={t('messages.statusSending')}
      >
        <span className="message-pending-indicator" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </span>
    )
  }
  if (!status) return null
  const isRead = status === 'read'
  const isDelivered = status === 'delivered'
  const text = isRead
    ? t('messages.statusRead')
    : isDelivered
      ? t('messages.statusDelivered')
      : t('messages.statusSent')

  return (
    <span
      className={`message-meta-status ${pop ? 'message-meta-status--pop' : ''} ${
        isRead ? 'message-meta-status--read' : ''
      } ${isDelivered ? 'message-meta-status--delivered' : ''}`}
      title={text}
    >
      {isRead ? (
        <span className="message-read-icons" aria-hidden="true">
          <FiCheck className="message-read-icon" />
          <FiCheck className="message-read-icon message-read-icon--second" />
        </span>
      ) : isDelivered ? (
        <FiCheck className="message-read-icon" aria-hidden="true" />
      ) : (
        <FiCheck className="message-read-icon message-read-icon--sent" aria-hidden="true" />
      )}
      <span>{text}</span>
    </span>
  )
}

export function MessageBubble({
  animateEnter = false,
  enterVariant = 'received',
  groupedWithNext = false,
  groupedWithPrevious = false,
  highlight = false,
  message,
  mine,
  onCloseActions,
  onDelete,
  onEdit,
  onReact,
  onReply,
  onRetry,
  onShare,
  onToggleActions,
  openActions,
  repliedMessage,
  repliedContext,
  showSenderName = false,
  user,
}) {
  const { t } = useLanguage()
  const stackRef = useRef(null)
  const menuRef = useRef(null)
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)
  const [placeAbove, setPlaceAbove] = useState(false)
  const readStatus = messageReadStatus(message, user.id)
  const failed = Boolean(message.syncFailed)
  const pending = Boolean(message.pending)
  const showActions = openActions
  const hasReactions =
    message.reactions && Object.entries(message.reactions).some(([, u]) => u?.length)
  const imageSrcs =
    message.attachment && isImageAttachment(message.attachment)
      ? attachmentImageSrcs(message.attachment)
      : []
  const hasImageAttachment = imageSrcs.length > 0
  const hasCaption = Boolean(message.text?.trim())

  // Bascule le menu au-dessus de la bulle s'il n'y a pas assez de place en bas
  // (dernier message, bord du conteneur scrollable) pour éviter qu'il soit coupé.
  useLayoutEffect(() => {
    if (!showActions) {
      setPlaceAbove(false)
      return
    }
    const stack = stackRef.current
    if (!stack) return
    let scrollParent = stack.parentElement
    while (scrollParent) {
      const overflowY = getComputedStyle(scrollParent).overflowY
      if (overflowY === 'auto' || overflowY === 'scroll') break
      scrollParent = scrollParent.parentElement
    }
    const boundBottom = scrollParent
      ? scrollParent.getBoundingClientRect().bottom
      : window.innerHeight
    const menuHeight = menuRef.current?.offsetHeight || 44
    const roomBelow = boundBottom - stack.getBoundingClientRect().bottom
    setPlaceAbove(roomBelow < menuHeight + 12)
  }, [showActions])

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

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function runAction(event, handler) {
    event.stopPropagation()
    handler(message)
    onCloseActions?.()
  }

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse') return
    longPressTriggered.current = false
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      onToggleActions?.()
    }, LONG_PRESS_MS)
  }

  function handlePointerUp() {
    clearLongPress()
  }

  function handlePointerLeave() {
    clearLongPress()
  }

  function handleBubbleClick(event) {
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }
    const selection = window.getSelection?.()
    if (selection?.toString().length) return
    // Ne pas déclencher au clavier ; sinon le clic (souris/tactile) ouvre le menu
    // flottant sur desktop, tablette et mobile.
    if (event.detail === 0) return
    onToggleActions?.()
  }

  const enterClass = animateEnter
    ? enterVariant === 'sent'
      ? 'message-stack--send'
      : 'message-stack--enter'
    : ''

  return (
    <div
      ref={stackRef}
      className={`message-stack message-stack--interactive ${enterClass} ${
        mine ? 'message-stack--sent' : ''
      } ${pending && mine ? 'message-stack--pending' : ''} ${
        hasImageAttachment ? 'message-stack--media' : ''
      } ${highlight ? 'message-stack--highlight' : ''      } ${showActions ? 'message-stack--actions' : ''} ${
        hasReactions ? 'message-stack--reacted' : ''
      }`}
    >
      {showSenderName && !mine ? (
        <EntityVerifiedName
          as="span"
          name={message.senderName}
          userId={message.senderId}
          className="message-sender-name"
        />
      ) : null}

      <div
        className={`${bubbleClassName(mine, groupedWithPrevious, groupedWithNext, failed)} ${
          hasImageAttachment ? 'message-bubble--has-image' : ''
        } ${openActions ? 'message-bubble--active' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={clearLongPress}
        onPointerLeave={handlePointerLeave}
        onClick={handleBubbleClick}
      >
        {failed ? (
          <button
            type="button"
            className="message-failed-mark"
            aria-label={t("messages.retrySendAria")}
            title={t("messages.retrySendTitle")}
            onClick={(event) => runAction(event, () => onRetry?.(message))}
          >
            <FiAlertCircle aria-hidden="true" />
          </button>
        ) : null}
        {repliedMessage ? (
          <p className={`message-quote ${mine ? 'message-quote--sent' : 'message-quote--received'}`}>
            {repliedMessage.text}
          </p>
        ) : null}
        {repliedContext ? (
          <p className={`message-quote ${mine ? 'message-quote--sent' : 'message-quote--received'}`}>
            <span className="block text-[9px] font-bold uppercase tracking-wide opacity-80">
              {messagesText(t, 'messages.replyQuoteListing')}
            </span>
            {repliedContext.title}
            {repliedContext.subtitle ? ` · ${repliedContext.subtitle}` : ''}
          </p>
        ) : null}

        {message.attachment ? (
          <MessageAttachment attachment={message.attachment} mine={mine} />
        ) : null}

        {hasCaption ? (
          <p
            className={`message-bubble-text whitespace-pre-wrap break-words ${
              hasImageAttachment ? 'message-bubble-text--caption' : ''
            }`}
          >
            {message.text}
          </p>
        ) : null}

        {message.reactions && Object.entries(message.reactions).some(([, u]) => u?.length) ? (
          <span className="message-reactions">
            {Object.entries(message.reactions)
              .filter(([, users]) => users?.length)
              .map(([emoji, users]) => {
                const reacted = user?.id != null && users.includes(user.id)
                return (
                  <button
                    key={emoji}
                    type="button"
                    className={`message-reaction ${reacted ? 'message-reaction--own' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onReact?.(message.id, emoji)
                    }}
                    aria-label={t("messages.reactionAria", { emoji })}
                  >
                    {emoji}
                  </button>
                )
              })}
          </span>
        ) : null}

        {failed ? (
          <div className="message-failed-banner">
            <span>{messagesText(t, 'messages.sendFailedBanner')}</span>
            <button
              type="button"
              className="message-failed-retry"
              onClick={(event) => runAction(event, () => onRetry?.(message))}
            >
              <FiRefreshCw aria-hidden="true" /> {messagesText(t, 'messages.retryAction')}
            </button>
          </div>
        ) : null}
      </div>

      {showActions && failed ? (
        <div
          ref={menuRef}
          className={`message-action-menu ${mine ? 'message-action-menu--sent' : ''} ${
            placeAbove ? 'message-action-menu--above' : ''
          }`}
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={(event) => runAction(event, () => onRetry?.(message))}
            aria-label={t("messages.retry")}
            className="message-action-menu-btn"
          >
            <FiRefreshCw />
          </button>
          {mine ? (
            <button
              type="button"
              onClick={(event) => runAction(event, () => onDelete(message.id))}
              aria-label={t("messages.delete")}
              className="message-action-menu-btn message-action-menu-btn--danger"
            >
              <FiTrash2 />
            </button>
          ) : null}
        </div>
      ) : showActions && !failed ? (
        <div
          ref={menuRef}
          className={`message-action-menu ${mine ? 'message-action-menu--sent' : ''} ${
            placeAbove ? 'message-action-menu--above' : ''
          }`}
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          {onReact
            ? ['👍', '❤️', '😂'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onReact(message.id, emoji)
                    onCloseActions?.()
                  }}
                  aria-label={t("messages.reactAria", { emoji })}
                  className="message-action-menu-btn message-action-menu-btn--emoji"
                >
                  {emoji}
                </button>
              ))
            : null}
          <button
            type="button"
            onClick={(event) => runAction(event, () => onReply(message.id))}
            aria-label={t("messages.reply")}
            className="message-action-menu-btn"
          >
            <FiCornerUpLeft />
          </button>
          <button
            type="button"
            onClick={(event) => runAction(event, onShare)}
            aria-label={t("messages.copy")}
            className="message-action-menu-btn"
          >
            <FiCopy />
          </button>
          {mine ? (
            <button
              type="button"
              onClick={(event) => runAction(event, onEdit)}
              aria-label={t("messages.edit")}
              className="message-action-menu-btn"
            >
              <FiEdit2 />
            </button>
          ) : null}
          {/* Un utilisateur ne peut supprimer que ses propres messages. */}
          {mine ? (
            <button
              type="button"
              onClick={(event) => runAction(event, () => onDelete(message.id))}
              aria-label={t("messages.delete")}
              className="message-action-menu-btn message-action-menu-btn--danger"
            >
              <FiTrash2 />
            </button>
          ) : null}
        </div>
      ) : null}

      {!groupedWithNext ? (
        <div className={`message-meta ${mine ? 'message-meta--sent' : ''}`}>
          <time dateTime={message.createdAt}>{shortTime(message.createdAt)}</time>
          {mine && !failed ? (
            <MessageReadStatus
              pending={pending}
              pop={animateEnter && !pending}
              status={readStatus}
            />
          ) : null}
          {mine && failed ? (
            <span className="message-meta-failed">{messagesText(t, 'messages.notSynced')}</span>
          ) : null}
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
  const { t } = useLanguage()
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-[var(--app-border)]/80" />
      <span className="message-date-chip">{formatDateLabel(date, t)}</span>
      <span className="h-px flex-1 bg-[var(--app-border)]/80" />
    </div>
  )
}

export function MessageUnreadSeparator({ count }) {
  const { t } = useLanguage()
  return (
    <div className="message-unread-separator" data-testid="message-unread-separator">
      <span>
        {count > 1
          ? messagesText(t, 'messages.unreadSeparatorPlural', { count })
          : messagesText(t, 'messages.unreadSeparator')}
      </span>
    </div>
  )
}

export function MessageThreadStart() {
  const { t } = useLanguage()
  return (
    <div className="my-3 flex justify-center">
      <span className="message-date-chip">{messagesText(t, 'messages.threadStart')}</span>
    </div>
  )
}

export function MessageSecurityNotice() {
  const { t } = useLanguage()
  return (
    <div
      className="message-security-notice mx-auto my-4 max-w-md rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-center shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30"
      data-testid="message-security-notice"
    >
      <p className="text-[11px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-200">
        {messagesText(t, 'messages.securityTitle')}
      </p>
      <p className="mt-1.5 text-[11px] leading-[1.35] text-amber-900/90 dark:text-amber-100/90">
        {t("messages.securityNotice")}
      </p>
    </div>
  )
}

export function MessageEmptyState() {
  const { t } = useLanguage()
  return (
    <div className="mx-auto mt-8 max-w-sm rounded-[var(--radius-card-lg)] border border-dashed border-[var(--app-border)] bg-[var(--app-surface)]/90 px-6 py-8 text-center shadow-[var(--shadow-card)]">
      <p className="font-display text-sm font-extrabold text-[var(--app-text)]">
        {messagesText(t, 'messages.threadEmptyTitle')}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
        {messagesText(t, 'messages.threadEmptyDescription')}
      </p>
    </div>
  )
}

export function shouldGroupMessages(previous, current, showDate) {
  if (!previous || showDate) return false
  if (String(previous.senderId) !== String(current.senderId)) return false
  return new Date(current.createdAt) - new Date(previous.createdAt) < 5 * 60 * 1000
}

export function firstUnreadMessageIndex(messages, userId, unreadCount) {
  if (!unreadCount || !messages?.length) return -1
  let remaining = unreadCount
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (String(messages[index].senderId) !== String(userId)) {
      if (remaining === 1) return index
      remaining -= 1
    }
  }
  return -1
}
