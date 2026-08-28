import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  FiAlertCircle,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiCornerUpLeft,
  FiEdit2,
  FiFlag,
  FiGlobe,
  FiMoreVertical,
  FiRefreshCw,
  FiTrash2,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { initials, shortTime, formatDateLabel } from './format'
import { messageReadStatus } from './messageUtils'
import {
  attachmentImageSrcs,
  isImageAttachment,
} from '../../features/communications/attachmentUtils'
import { MessageAttachment } from './MessageAttachment'
import { LinkifiedText } from '../../components/ui/LinkifiedText'
import { useLanguage } from '../../contexts/useLanguage'
import { LANGUAGE_LABELS } from '../../config/uiTranslations'
import { messagesText } from '../../features/communications/messagesI18n'
import {
  languageLabel,
} from '../../features/communications/messageTranslate'
import { EntityVerifiedName } from '../../components/ui/EntityVerifiedName'
import { ReportDialog } from '../../components/ui/ReportDialog'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { vibrateMenuOpen } from '../../utils/deviceVibrate'

const MESSAGE_ACTION_SHEET_MQ = '(max-width: 1023px)'

function MessageActionMenuSheet({ menuRef, onClose, enterAnim, actionsLabel, closeLabel, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  function stopBubble(event) {
    event.stopPropagation()
  }

  return (
    <div className="message-action-menu-sheet" role="dialog" aria-modal="true" aria-label={actionsLabel}>
      <button
        type="button"
        className="message-action-menu-sheet-backdrop"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        ref={menuRef}
        className={`message-action-menu-sheet-panel ${enterAnim ? 'drawer-enter' : ''}`}
        onClick={stopBubble}
        onPointerDown={stopBubble}
      >
        <div className="message-action-menu-sheet-handle" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}

function bubbleClassName(mine, groupedWithPrevious, groupedWithNext, failed) {
  const classes = ['message-bubble', mine ? 'message-bubble--sent' : 'message-bubble--received']
  if (groupedWithPrevious) classes.push('message-bubble--grouped-prev')
  if (groupedWithNext) classes.push('message-bubble--grouped-next')
  if (failed) classes.push('message-bubble--failed')
  return classes.join(' ')
}

const LONG_PRESS_MS = 450
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥']

function computeMessageActionMenuCoords(anchor, menuEl, mine, { hasEmojiRow = true } = {}) {
  if (!anchor) return null

  const rect = anchor.getBoundingClientRect()
  const estimatedHeight = hasEmojiRow ? 40 : 36
  const estimatedWidth = hasEmojiRow ? 122 : 160
  const menuHeight = menuEl?.offsetHeight || estimatedHeight
  const menuWidth = Math.max(menuEl?.offsetWidth || 0, estimatedWidth)
  const gap = 6
  const pad = 8

  const threadEl =
    anchor.closest('.message-thread-scroll') ||
    anchor.closest('.message-thread-canvas') ||
    anchor.closest('.message-thread-panel')
  const threadRect = threadEl?.getBoundingClientRect()

  const composerRaw = getComputedStyle(anchor).getPropertyValue('--message-composer-offset').trim()
  const composerOffset = Number.parseFloat(composerRaw) || 120

  const boundTop = (threadRect?.top ?? pad) + pad
  const boundBottom = Math.min(
    window.innerHeight - composerOffset - pad,
    (threadRect?.bottom ?? window.innerHeight) - pad,
  )
  const boundLeft = (threadRect?.left ?? pad) + pad
  const boundRight = (threadRect?.right ?? window.innerWidth) - pad

  const roomBelow = boundBottom - rect.bottom - gap
  const roomAbove = rect.top - boundTop - gap

  let placement = 'below'
  if (roomBelow < menuHeight && roomAbove > roomBelow) {
    placement = 'above'
  }

  let top = placement === 'below' ? rect.bottom + gap : rect.top - menuHeight - gap
  top = Math.max(boundTop, Math.min(top, boundBottom - menuHeight))

  let left = mine ? rect.right - menuWidth : rect.left
  left = Math.min(Math.max(boundLeft, left), boundRight - menuWidth)

  return { top, left, placement }
}

function MessageEmojiActionRow({ emojis, onPick, t }) {
  const scrollRef = useRef(null)
  const [scrollHints, setScrollHints] = useState({ left: false, right: false })

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setScrollHints({
      left: el.scrollLeft > 4,
      right: maxScroll > 4 && el.scrollLeft < maxScroll - 4,
    })
  }, [])

  useLayoutEffect(() => {
    updateScrollHints()
    const el = scrollRef.current
    if (!el) return undefined
    el.addEventListener('scroll', updateScrollHints, { passive: true })
    const observer = new ResizeObserver(updateScrollHints)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollHints)
      observer.disconnect()
    }
  }, [updateScrollHints, emojis.length])

  return (
    <div className="message-action-menu-row-wrap message-action-menu-row-wrap--emoji">
      {scrollHints.left ? (
        <span className="message-action-menu-scroll-hint message-action-menu-scroll-hint--left" aria-hidden="true">
          <FiChevronLeft />
        </span>
      ) : null}
      <div ref={scrollRef} className="message-action-menu-row message-action-menu-row--emoji" role="group">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={(event) => onPick(event, emoji)}
            aria-label={t('messages.reactAria', { emoji })}
            className="message-action-menu-btn message-action-menu-btn--emoji"
          >
            {emoji}
          </button>
        ))}
      </div>
      {scrollHints.right ? (
        <span className="message-action-menu-scroll-hint message-action-menu-scroll-hint--right" aria-hidden="true">
          <FiChevronRight />
        </span>
      ) : null}
    </div>
  )
}

function MessageActionSheetList({ children }) {
  return (
    <div className="message-action-menu-list" role="menu">
      {children}
    </div>
  )
}

function MessageActionSheetItem({
  icon: Icon,
  label,
  onClick,
  to,
  danger = false,
  className = '',
  ...props
}) {
  const itemClass = [
    'message-action-menu-sheet-item',
    danger ? 'message-action-menu-sheet-item--danger' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <span className="message-action-menu-sheet-item-icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="message-action-menu-sheet-item-label">{label}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={itemClass} onClick={onClick} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={itemClass} onClick={onClick} {...props}>
      {content}
    </button>
  )
}

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
  onCopy,
  onTranslate,
  onToggleTranslationOriginal,
  translation = null,
  translating = false,
  autoTranslateEnabled = false,
  showTranslateIcon = false,
  translateLanguageOptions = [],
  translateHintLanguage = null,
  onToggleActions,
  openActions,
  conversationId,
  onReport,
  repliedMessage,
  repliedContext,
  showSenderName = false,
  user,
}) {
  const { t } = useLanguage()
  const mobileSheet = useMediaQuery(MESSAGE_ACTION_SHEET_MQ)
  const stackRef = useRef(null)
  const bubbleRef = useRef(null)
  const actionsTriggerRef = useRef(null)
  const menuRef = useRef(null)
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)
  const longPressStartRef = useRef(null)
  const [menuCoords, setMenuCoords] = useState(null)
  const [menuPlacement, setMenuPlacement] = useState('below')
  const [menuView, setMenuView] = useState('actions')
  const [triggerRevealed, setTriggerRevealed] = useState(false)
  const [bubbleTouchPressing, setBubbleTouchPressing] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [menuEnterAnim, setMenuEnterAnim] = useState(false)
  const menuEnterStartedRef = useRef(false)
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
  const fromStatus = Boolean(message.attachment?.fromStatus)
  // La réaction-emoji à un statut est déjà affichée en surimpression sur l'image ;
  // pas besoin de la répéter en légende texte en dessous.
  const hasCaption = Boolean(message.text?.trim()) && !message.attachment?.reactionEmoji
  const showTranslationBadge =
    Boolean(translation?.translatedText) &&
    !translating &&
    (showTranslateIcon || (autoTranslateEnabled && !mine))
  const showTranslated = showTranslationBadge && !translation?.showOriginal
  const displayText = showTranslated ? translation.translatedText : message.text
  const translateIconConnected = Boolean(translation?.translatedText)
  const canUseTranslateIcon =
    showTranslateIcon && hasCaption && Boolean(onTranslate) && translateLanguageOptions.length > 0

  // Menu en portal (fixed) : deux barres (emojis + actions), borné au fil de messagerie.
  // Sur petit écran : bottom sheet ancré en bas.
  useLayoutEffect(() => {
    if (!showActions) {
      const clearId = requestAnimationFrame(() => {
        setMenuCoords(null)
        setMenuPlacement('below')
      })
      return () => cancelAnimationFrame(clearId)
    }
    if (mobileSheet) {
      const frame = requestAnimationFrame(() => setMenuCoords({ sheet: true }))
      return () => cancelAnimationFrame(frame)
    }
    const anchor = bubbleRef.current || actionsTriggerRef.current
    if (!anchor) return

    const update = () => {
      const hasEmojiRow = Boolean(onReact) && !failed && menuView !== 'translate'
      const coords = computeMessageActionMenuCoords(anchor, menuRef.current, mine, { hasEmojiRow })
      if (!coords) return
      setMenuCoords({ top: coords.top, left: coords.left })
      setMenuPlacement(coords.placement)
    }

    const frame = requestAnimationFrame(() => {
      update()
      requestAnimationFrame(update)
    })
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [showActions, mine, failed, menuView, canUseTranslateIcon, onReact, mobileSheet])

  useEffect(() => {
    if (!showActions) return undefined
    if (menuEnterStartedRef.current) return undefined
    if (!mobileSheet && !menuCoords) return undefined

    menuEnterStartedRef.current = true
    const enterTimer = window.setTimeout(() => setMenuEnterAnim(true), 0)
    const exitTimer = window.setTimeout(() => setMenuEnterAnim(false), mobileSheet ? 220 : 340)
    return () => {
      window.clearTimeout(enterTimer)
      window.clearTimeout(exitTimer)
    }
  }, [showActions, menuCoords, mobileSheet])

  useEffect(() => {
    if (!showActions) {
      menuEnterStartedRef.current = false
      return undefined
    }
    void vibrateMenuOpen()
  }, [showActions])

  useEffect(() => {
    if (!openActions) {
      const clearId = requestAnimationFrame(() => setMenuView('actions'))
      return () => cancelAnimationFrame(clearId)
    }
    return undefined
  }, [openActions])

  useEffect(() => {
    if (!triggerRevealed) return undefined
    function handleOutside(event) {
      if (stackRef.current?.contains(event.target)) return
      setTriggerRevealed(false)
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [triggerRevealed])

  useEffect(() => {
    const el = bubbleRef.current
    if (!el || !bubbleTouchPressing) return undefined
    function blockSelectStart(event) {
      event.preventDefault()
    }
    el.addEventListener('selectstart', blockSelectStart)
    return () => el.removeEventListener('selectstart', blockSelectStart)
  }, [bubbleTouchPressing])

  useEffect(() => {
    if (!openActions) return undefined
    function handlePointerDown(event) {
      const target = event.target
      // Le menu est porté hors de stackRef → il faut aussi tester menuRef.
      if (stackRef.current?.contains(target) || menuRef.current?.contains(target)) return
      onCloseActions?.()
    }
    function handleKey(event) {
      if (event.key === 'Escape') onCloseActions?.()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [openActions, onCloseActions])

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function runAction(event, handler) {
    event.preventDefault()
    event.stopPropagation()
    handler(message)
    onCloseActions?.()
  }

  function handleActionsTriggerClick(event) {
    event.preventDefault()
    event.stopPropagation()
    setTriggerRevealed(true)
    onToggleActions?.()
  }

  function isBubbleLongPressTarget(target) {
    return !target.closest('button, a, [role="button"], input, textarea')
  }

  function isTouchLikePointer(pointerType) {
    return pointerType === 'touch' || pointerType === 'pen'
  }

  function handleBubblePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (!isBubbleLongPressTarget(event.target)) return
    if (isTouchLikePointer(event.pointerType)) {
      setBubbleTouchPressing(true)
    }
    longPressTriggered.current = false
    clearLongPress()
    longPressStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    }
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      window.getSelection()?.removeAllRanges()
      setTriggerRevealed(true)
      if (!openActions) onToggleActions?.()
    }, LONG_PRESS_MS)
  }

  function handleBubblePointerMove(event) {
    const start = longPressStartRef.current
    if (!start || start.pointerId !== event.pointerId || !longPressTimer.current) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.hypot(dx, dy) > 10) {
      longPressStartRef.current = null
      clearLongPress()
    }
  }

  function handleBubblePointerUp(event) {
    const wasLongPress = longPressTriggered.current
    longPressStartRef.current = null
    clearLongPress()
    setBubbleTouchPressing(false)

    if (wasLongPress) {
      event.preventDefault()
      event.stopPropagation()
      longPressTriggered.current = false
      return
    }

    if (
      isTouchLikePointer(event.pointerType) &&
      isBubbleLongPressTarget(event.target) &&
      !openActions
    ) {
      setTriggerRevealed(true)
    }
  }

  function handleBubbleContextMenu(event) {
    if (longPressTriggered.current || bubbleTouchPressing) {
      event.preventDefault()
    }
  }

  const enterClass = animateEnter
    ? enterVariant === 'sent'
      ? 'message-stack--send'
      : 'message-stack--enter'
    : ''

  const menuStackClassName = `${
    menuEnterAnim ? 'message-action-menu-stack--enter' : ''
  } message-action-menu-stack message-action-menu-stack--portal ${
    mine ? 'message-action-menu-stack--sent' : ''
  } ${menuPlacement === 'above' ? 'message-action-menu-stack--above' : ''}`

  function stopMenuBubble(event) {
    event.stopPropagation()
  }

  function renderActionMenuContent() {
    if (failed) {
      if (mobileSheet) {
        return (
          <MessageActionSheetList>
            <MessageActionSheetItem
              icon={FiRefreshCw}
              label={t('messages.retry')}
              onClick={(event) => runAction(event, () => onRetry?.(message))}
            />
            {mine ? (
              <MessageActionSheetItem
                icon={FiTrash2}
                label={t('messages.delete')}
                danger
                onClick={(event) => runAction(event, () => onDelete(message.id))}
              />
            ) : null}
          </MessageActionSheetList>
        )
      }

      return (
        <div className="message-action-menu-row message-action-menu-row--actions" role="menu">
          <button
            type="button"
            onClick={(event) => runAction(event, () => onRetry?.(message))}
            aria-label={t('messages.retry')}
            className="message-action-menu-btn"
          >
            <FiRefreshCw />
          </button>
          {mine ? (
            <button
              type="button"
              onClick={(event) => runAction(event, () => onDelete(message.id))}
              aria-label={t('messages.delete')}
              className="message-action-menu-btn message-action-menu-btn--danger"
            >
              <FiTrash2 />
            </button>
          ) : null}
        </div>
      )
    }

    if (menuView === 'translate' && canUseTranslateIcon) {
      return (
        <div className="message-action-menu-row message-action-menu-row--translate" role="menu">
          <div className="message-action-menu-header">
            <button
              type="button"
              className="message-action-menu-btn"
              aria-label={messagesText(t, 'messages.translateBack')}
              onClick={(event) => {
                event.stopPropagation()
                setMenuView('actions')
              }}
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            <span className="message-action-menu-title">
              {translateHintLanguage
                ? messagesText(t, 'messages.translateFromHint', { language: translateHintLanguage })
                : messagesText(t, 'messages.translateInto')}
            </span>
          </div>
          {translateLanguageOptions.map((code) => (
            <button
              key={code}
              type="button"
              className="message-action-menu-lang"
              onClick={(event) => {
                event.stopPropagation()
                onTranslate?.(message, code)
                onCloseActions?.()
              }}
            >
              <span aria-hidden="true">{LANGUAGE_LABELS[code]?.flag || ''}</span>
              <span>
                {code === 'ru'
                  ? messagesText(t, 'messages.translateRussianFallback')
                  : languageLabel(code)}
              </span>
            </button>
          ))}
        </div>
      )
    }

    return (
      <>
        {onReact ? (
          <MessageEmojiActionRow
            emojis={QUICK_REACTIONS}
            t={t}
            onPick={(event, emoji) => {
              event.stopPropagation()
              onReact(message.id, emoji)
              onCloseActions?.()
            }}
          />
        ) : null}
        {mobileSheet && onReact ? (
          <div className="message-action-menu-sheet-divider" role="separator" aria-hidden="true" />
        ) : null}
        {mobileSheet ? (
          <MessageActionSheetList>
            <MessageActionSheetItem
              icon={FiCornerUpLeft}
              label={t('messages.reply')}
              onClick={(event) => runAction(event, () => onReply(message.id))}
            />
            <MessageActionSheetItem
              icon={FiCopy}
              label={t('messages.copy')}
              onClick={(event) => runAction(event, () => onCopy?.(message, displayText))}
            />
            {canUseTranslateIcon ? (
              <MessageActionSheetItem
                icon={FiGlobe}
                label={t('messages.translate')}
                className={
                  translating
                    ? 'message-action-menu-sheet-item--translate-loading'
                    : translateIconConnected
                      ? 'message-action-menu-sheet-item--translate-connected'
                      : ''
                }
                onClick={(event) => {
                  event.stopPropagation()
                  setMenuView('translate')
                }}
              />
            ) : null}
            {!mine ? (
              <MessageActionSheetItem
                icon={FiUser}
                label={messagesText(t, 'messages.viewProfile')}
                to={`/users/${message.senderId}/publications`}
                onClick={(event) => {
                  event.stopPropagation()
                  onCloseActions?.()
                }}
              />
            ) : null}
            {!mine && onReport ? (
              <MessageActionSheetItem
                icon={FiFlag}
                label={t('messages.report')}
                danger
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onCloseActions?.()
                  setReportOpen(true)
                }}
              />
            ) : null}
            {mine ? (
              <MessageActionSheetItem
                icon={FiEdit2}
                label={t('messages.edit')}
                onClick={(event) => runAction(event, onEdit)}
              />
            ) : null}
            {mine ? (
              <MessageActionSheetItem
                icon={FiTrash2}
                label={t('messages.delete')}
                danger
                onClick={(event) => runAction(event, () => onDelete(message.id))}
              />
            ) : null}
          </MessageActionSheetList>
        ) : (
          <div className="message-action-menu-row message-action-menu-row--actions" role="menu">
            <button
              type="button"
              onClick={(event) => runAction(event, () => onReply(message.id))}
              aria-label={t('messages.reply')}
              className="message-action-menu-btn"
            >
              <FiCornerUpLeft />
            </button>
            <button
              type="button"
              onClick={(event) => runAction(event, () => onCopy?.(message, displayText))}
              aria-label={t('messages.copy')}
              className="message-action-menu-btn"
            >
              <FiCopy />
            </button>
            {canUseTranslateIcon ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setMenuView('translate')
                }}
                aria-label={t('messages.translate')}
                title={t('messages.translate')}
                className={`message-action-menu-btn message-action-menu-btn--translate ${
                  translating ? 'message-action-menu-btn--translate-loading' : ''
                } ${translateIconConnected ? 'message-action-menu-btn--translate-connected' : ''}`}
              >
                <FiGlobe aria-hidden="true" />
              </button>
            ) : null}
            {!mine ? (
              <Link
                to={`/users/${message.senderId}/publications`}
                onClick={(event) => {
                  event.stopPropagation()
                  onCloseActions?.()
                }}
                aria-label={messagesText(t, 'messages.viewProfile')}
                className="message-action-menu-btn"
              >
                <FiUser />
              </Link>
            ) : null}
            {!mine && onReport ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onCloseActions?.()
                  setReportOpen(true)
                }}
                aria-label={t('messages.report')}
                className="message-action-menu-btn message-action-menu-btn--danger"
              >
                <FiFlag aria-hidden="true" />
              </button>
            ) : null}
            {mine ? (
              <button
                type="button"
                onClick={(event) => runAction(event, onEdit)}
                aria-label={t('messages.edit')}
                className="message-action-menu-btn"
              >
                <FiEdit2 />
              </button>
            ) : null}
            {mine ? (
              <button
                type="button"
                onClick={(event) => runAction(event, () => onDelete(message.id))}
                aria-label={t('messages.delete')}
                className="message-action-menu-btn message-action-menu-btn--danger"
              >
                <FiTrash2 />
              </button>
            ) : null}
          </div>
        )}
      </>
    )
  }

  function renderActionMenuPortal() {
    const content = renderActionMenuContent()

    if (mobileSheet) {
      return (
        <MessageActionMenuSheet
          menuRef={menuRef}
          onClose={() => onCloseActions?.()}
          enterAnim={menuEnterAnim}
          actionsLabel={messagesText(t, 'messages.messageActions')}
          closeLabel={t('common.close')}
        >
          <div className="message-action-menu-stack message-action-menu-stack--sheet">{content}</div>
        </MessageActionMenuSheet>
      )
    }

    return (
      <div
        ref={menuRef}
        className={menuStackClassName}
        style={{
          top: menuCoords?.top ?? -9999,
          left: menuCoords?.left ?? 0,
          visibility: menuCoords ? 'visible' : 'hidden',
        }}
        onClick={stopMenuBubble}
        onPointerDown={stopMenuBubble}
      >
        {content}
      </div>
    )
  }

  return (
    <div
      ref={stackRef}
      className={`message-stack message-stack--interactive ${enterClass} ${
        mine ? 'message-stack--sent' : ''
      } ${pending && mine ? 'message-stack--pending' : ''} ${
        hasImageAttachment ? 'message-stack--media' : ''
      } ${fromStatus ? 'message-stack--status' : ''} ${
        highlight ? 'message-stack--highlight' : ''
      } ${showActions ? 'message-stack--actions' : ''} ${
        triggerRevealed ? 'message-stack--trigger-visible' : ''
      } ${hasReactions ? 'message-stack--reacted' : ''}`}
    >
      {showSenderName && !mine ? (
        <EntityVerifiedName
          as="span"
          name={message.senderName}
          userId={message.senderId}
          className="message-sender-name"
        />
      ) : null}

      <div className="message-stack-row">
        {mine ? (
          <button
            ref={actionsTriggerRef}
            type="button"
            className={`message-actions-trigger message-actions-trigger--sent ${
              showActions ? 'message-actions-trigger--open' : ''
            }`}
            aria-expanded={showActions}
            aria-haspopup="menu"
            aria-label={messagesText(t, 'messages.messageActions')}
            onClick={handleActionsTriggerClick}
          >
            <FiMoreVertical aria-hidden="true" />
          </button>
        ) : null}

        <div
          ref={bubbleRef}
          className={`${bubbleClassName(mine, groupedWithPrevious, groupedWithNext, failed)} ${
            hasImageAttachment ? 'message-bubble--has-image' : ''
          } ${openActions ? 'message-bubble--active' : ''} ${
            bubbleTouchPressing ? 'message-bubble--touch-pressing' : ''
          }`}
          onPointerDown={handleBubblePointerDown}
          onPointerMove={handleBubblePointerMove}
          onPointerUp={handleBubblePointerUp}
          onPointerCancel={handleBubblePointerUp}
          onContextMenu={handleBubbleContextMenu}
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
            <LinkifiedText
              as="p"
              text={repliedMessage.text}
              preserveWhitespace="pre-wrap"
              className={`message-quote ${mine ? 'message-quote--sent' : 'message-quote--received'}`}
              stopPropagation
            />
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
            <LinkifiedText
              as="p"
              text={displayText}
              preserveWhitespace="pre-wrap"
              stopPropagation
              className={`message-bubble-text ${
                hasImageAttachment ? 'message-bubble-text--caption' : ''
              } ${translating ? 'message-bubble-text--translating' : ''}`}
            />
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

        {!mine ? (
          <button
            ref={actionsTriggerRef}
            type="button"
            className={`message-actions-trigger message-actions-trigger--received ${
              showActions ? 'message-actions-trigger--open' : ''
            }`}
            aria-expanded={showActions}
            aria-haspopup="menu"
            aria-label={messagesText(t, 'messages.messageActions')}
            onClick={handleActionsTriggerClick}
          >
            <FiMoreVertical aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {showTranslationBadge ? (
        <button
          type="button"
          className={`message-translate-badge ${mine ? 'message-translate-badge--sent' : ''}`}
          onClick={(event) => {
            event.stopPropagation()
            onToggleTranslationOriginal?.(message.id)
          }}
        >
          {translation.showOriginal
            ? messagesText(t, 'messages.showTranslation')
            : translation.sourceLang
              ? messagesText(t, 'messages.autoTranslatedFrom', {
                  language: languageLabel(translation.sourceLang),
                }) + ` · ${messagesText(t, 'messages.showOriginal')}`
              : `${messagesText(t, 'messages.autoTranslated')} · ${messagesText(t, 'messages.showOriginal')}`}
        </button>
      ) : null}

      {showActions && typeof document !== 'undefined'
        ? createPortal(renderActionMenuPortal(), document.body)
        : null}

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={messagesText(t, 'messages.reportTitle')}
        userId={user?.id}
        onSubmit={async ({ reason, evidenceUrl }) => {
          await onReport?.({
            conversationId,
            message,
            reason,
            evidenceUrl,
          })
        }}
      />

      {!groupedWithNext ? (
        <div className={`message-meta ${mine ? 'message-meta--sent' : ''}`}>
          {message.editedAt ? (
            <span className="opacity-70">{t('messages.edited')}</span>
          ) : null}
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

export function MessageAvatar({ name, avatarUrl, userId, hidden = false, className = '' }) {
  const { t } = useLanguage()
  const avatarClass = [
    'message-avatar',
    hidden ? 'message-avatar--ghost' : '',
    !hidden && avatarUrl ? 'overflow-hidden' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const inner = !hidden && avatarUrl ? (
    <img src={avatarUrl} alt="" className="size-full object-cover" />
  ) : (
    initials(name)
  )

  if (hidden || !userId) {
    return (
      <span className={avatarClass} aria-hidden={hidden}>
        {inner}
      </span>
    )
  }

  return (
    <Link
      to={`/users/${userId}/publications`}
      className={`${avatarClass} message-avatar-link`}
      aria-label={
        name
          ? messagesText(t, 'messages.viewProfile') + ` — ${name}`
          : messagesText(t, 'messages.viewProfile')
      }
    >
      {inner}
    </Link>
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

const SECURITY_NOTICE_STORAGE_KEY = 'moxt.messages.security-notice.dismissed'

export function MessageSecurityNotice() {
  const { t } = useLanguage()
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(SECURITY_NOTICE_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  if (hidden) return null
  return (
    <div
      className="mx-auto my-2 flex max-w-md items-start gap-2 px-1 py-1 text-[11px] leading-snug text-[var(--app-text-muted)]"
      data-testid="message-security-notice"
    >
      <p className="min-w-0 flex-1">{t('messages.securityNotice')}</p>
      <button
        type="button"
        className="grid size-7 shrink-0 place-items-center rounded-lg text-[var(--app-text-faint)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
        onClick={() => {
          try {
            localStorage.setItem(SECURITY_NOTICE_STORAGE_KEY, '1')
          } catch {
            /* quota */
          }
          setHidden(true)
        }}
        aria-label={t('common.close')}
      >
        <FiX />
      </button>
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
