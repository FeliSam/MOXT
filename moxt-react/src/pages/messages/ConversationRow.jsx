import { useCallback, useRef, useState } from 'react'
import { FiBellOff, FiCpu, FiStar } from 'react-icons/fi'
import { LuEllipsisVertical } from 'react-icons/lu'
import { useSelector } from 'react-redux'
import { RELATED_CONTENT_META } from '../../config/communications'
import { VerifiedDisplayName } from '../../components/ui/Badge'
import { useLanguage } from '../../contexts/useLanguage'
import { EntityAvatar } from '../../features/account/EntityAvatar'
import { getConversationPeer } from '../../features/communications/conversationDisplay'
import { messagesText } from '../../features/communications/messagesI18n'
import { conversationPreview } from './messageUtils'
import { shortTime } from './format'
import { ConversationFloatingMenu } from './ConversationFloatingMenu'

const LIST_AVATAR_CLASS =
  '!size-11 !rounded-full !text-xs font-black self-center sm:!size-12'

const LONG_PRESS_MS = 450

export function ConversationRow({
  active,
  assistant = false,
  avatarMap = {},
  conversation,
  divided = true,
  onClick,
  showOnlineDot = false,
  userId,
  archived = false,
  blocked = false,
  suggestionsEnabled = true,
  onPin,
  onMute,
  onToggleSuggestions,
  onArchive,
  onBlock,
}) {
  const { t } = useLanguage()
  const rowRef = useRef(null)
  const triggerRef = useRef(null)
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)
  const longPressStartRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pressing, setPressing] = useState(false)

  const peer = assistant ? null : getConversationPeer(conversation, userId)
  const liveEntry = peer?.id ? avatarMap[peer.id] : undefined
  const avatarSrc =
    liveEntry !== undefined ? liveEntry.avatarUrl || null : peer?.avatarUrl || null
  const peerOnline = useSelector((state) =>
    showOnlineDot && peer?.id ? Boolean(state.presence?.online?.[peer.id]) : false,
  )
  const lastMessage = assistant
    ? messagesText(t, 'messages.assistant.preview')
    : conversationPreview(conversation, userId, t)
  const unread = assistant ? 0 : conversation.unreadBy?.[userId] || 0
  const pinned = !assistant && conversation.pinnedBy?.includes(userId)
  const muted = !assistant && conversation.mutedBy?.includes(userId)
  const relatedMeta =
    !assistant && conversation.relatedType
      ? RELATED_CONTENT_META[conversation.relatedType] || RELATED_CONTENT_META.general
      : null
  const RelatedIcon = relatedMeta?.icon
  const hasActions = !assistant && Boolean(onPin || onMute || onArchive || onBlock)
  const timestamp = assistant
    ? messagesText(t, 'messages.assistant.alwaysThere')
    : shortTime(
        conversation.lastMessageAt || conversation.last_message_at || conversation.updatedAt,
      )

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const openMenu = useCallback(() => {
    if (!hasActions) return
    setMenuOpen(true)
  }, [hasActions])

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function isLongPressTarget(target) {
    return !target.closest('.conversation-row-actions-trigger')
  }

  function handleRowPointerDown(event) {
    if (!hasActions || event.pointerType === 'mouse') return
    if (!isLongPressTarget(event.target)) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    setPressing(true)
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
      openMenu()
    }, LONG_PRESS_MS)
  }

  function handleRowPointerMove(event) {
    const start = longPressStartRef.current
    if (!start || start.pointerId !== event.pointerId || !longPressTimer.current) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.hypot(dx, dy) > 10) {
      longPressStartRef.current = null
      clearLongPress()
    }
  }

  function handleRowPointerUp(event) {
    const wasLongPress = longPressTriggered.current
    longPressStartRef.current = null
    clearLongPress()
    setPressing(false)

    if (wasLongPress) {
      event.preventDefault()
      event.stopPropagation()
      longPressTriggered.current = false
    }
  }

  function handleRowClick(event) {
    if (longPressTriggered.current || menuOpen) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    onClick?.()
  }

  function handleRowContextMenu(event) {
    if (pressing || longPressTriggered.current) {
      event.preventDefault()
    }
  }

  function handleTriggerClick(event) {
    event.preventDefault()
    event.stopPropagation()
    setMenuOpen((value) => !value)
  }

  if (assistant) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group flex min-h-[3.875rem] min-w-0 w-full items-stretch gap-2.5 rounded-2xl p-[2%] text-left transition-colors duration-[var(--transition-fast)] sm:min-h-[4.125rem] sm:gap-3 ${
          active
            ? 'bg-[var(--app-accent-soft)]'
            : 'bg-transparent hover:bg-[var(--app-surface)]/55'
        }`}
      >
        <span className="grid size-11 shrink-0 place-items-center self-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-base font-black text-white sm:size-12">
          <FiCpu />
        </span>
        <span
          className={`flex min-w-0 flex-1 flex-col justify-center ${
            divided ? 'border-b border-[var(--app-border)]/45' : ''
          }`}
        >
          <span className="flex items-baseline justify-between gap-2">
            <strong className="flex min-w-0 items-center gap-1.5 truncate text-[13px] font-semibold leading-4 text-[var(--app-text)]">
              {messagesText(t, 'messages.assistant.name')}
            </strong>
            <time className="shrink-0 text-[10px] font-medium tabular-nums leading-none text-[var(--app-text-faint)]">
              {timestamp}
            </time>
          </span>
          <span className="mt-0.5 truncate text-[12px] font-normal leading-4 text-[var(--app-text-faint)]">
            {lastMessage}
          </span>
        </span>
      </button>
    )
  }

  return (
    <>
      <div
        ref={rowRef}
        className={`conversation-row group relative flex min-h-[3.875rem] min-w-0 w-full items-stretch gap-2.5 rounded-2xl p-[2%] text-left transition-[background-color,transform,box-shadow] duration-[var(--transition-fast)] sm:min-h-[4.125rem] sm:gap-3 ${
          active ? 'bg-[var(--app-accent-soft)]' : 'bg-transparent hover:bg-[var(--app-surface)]/55'
        } ${menuOpen ? 'conversation-row--lift' : ''} ${pressing ? 'conversation-row--pressing' : ''}`}
      >
        <button
          type="button"
          onClick={handleRowClick}
          onPointerDown={handleRowPointerDown}
          onPointerMove={handleRowPointerMove}
          onPointerUp={handleRowPointerUp}
          onPointerCancel={handleRowPointerUp}
          onContextMenu={handleRowContextMenu}
          className="flex min-w-0 flex-1 items-stretch gap-2.5 text-left sm:gap-3"
        >
          <span className="relative shrink-0 self-center">
            <EntityAvatar
              name={peer?.name}
              src={avatarSrc}
              size="lg"
              shape="user"
              ring={false}
              className={LIST_AVATAR_CLASS}
              alt={peer?.name || ''}
            />
            {peerOnline ? (
              <span
                className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--app-surface-muted)]"
                title={messagesText(t, 'messages.activity.online')}
                aria-label={messagesText(t, 'messages.activity.online')}
              />
            ) : RelatedIcon ? (
              <span
                className={`absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full text-[9px] text-white ${relatedMeta.tone}`}
                aria-hidden="true"
              >
                <RelatedIcon />
              </span>
            ) : null}
            {peerOnline && RelatedIcon ? (
              <span
                className={`absolute -bottom-0.5 -left-0.5 grid size-4 place-items-center rounded-full text-[9px] text-white ${relatedMeta.tone}`}
                aria-hidden="true"
              >
                <RelatedIcon />
              </span>
            ) : null}
          </span>
          <span
            className={`flex min-w-0 flex-1 flex-col justify-center ${
              divided ? 'border-b border-[var(--app-border)]/45' : ''
            }`}
          >
            <span className="flex items-baseline justify-between gap-2 pr-1">
              <strong
                className={`flex min-w-0 items-center gap-1.5 truncate text-[13px] leading-4 ${
                  unread ? 'font-black text-[var(--app-text)]' : 'font-semibold text-[var(--app-text)]'
                }`}
              >
                {pinned ? <FiStar className="size-3 shrink-0 text-amber-500" /> : null}
                <VerifiedDisplayName
                  name={peer?.name}
                  verified={Boolean(peer?.verified)}
                  iconSize="sm"
                  className="min-w-0 flex-1"
                  nameClassName="truncate"
                />
                {muted ? <FiBellOff className="size-3 shrink-0 text-[var(--app-text-faint)]" /> : null}
              </strong>
            </span>
            <span className="mt-0.5 flex items-center gap-2">
              <span
                className={`min-w-0 flex-1 truncate text-[12px] leading-4 ${
                  unread
                    ? 'font-medium text-[var(--app-text-muted)]'
                    : 'font-normal text-[var(--app-text-faint)]'
                }`}
              >
                {lastMessage}
              </span>
              {unread ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-black leading-none text-white dark:bg-brand-500">
                  {unread}
                </span>
              ) : null}
            </span>
          </span>
        </button>

        <div className="conversation-row-meta shrink-0 self-stretch pr-0.5">
          <div className="conversation-row-meta-slot">
            <time
              className={`conversation-row-time text-right text-[10px] tabular-nums leading-none ${
                unread
                  ? 'font-semibold text-[var(--app-accent)]'
                  : 'font-medium text-[var(--app-text-faint)]'
              } ${menuOpen ? 'conversation-row-time--hidden' : ''}`}
            >
              {timestamp}
            </time>
            {hasActions ? (
              <button
                ref={triggerRef}
                type="button"
                className={`conversation-row-actions-trigger grid place-items-center rounded-lg text-[var(--app-text-muted)] ${
                  menuOpen ? 'conversation-row-actions-trigger--open' : ''
                }`}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={messagesText(t, 'messages.conversationOptionsAria')}
                onClick={handleTriggerClick}
              >
                <LuEllipsisVertical className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {hasActions ? (
        <ConversationFloatingMenu
          open={menuOpen}
          anchorRef={rowRef}
          triggerRef={triggerRef}
          peer={peer}
          pinned={pinned}
          muted={muted}
          blocked={blocked}
          archived={archived}
          suggestionsEnabled={suggestionsEnabled}
          onPin={onPin}
          onMute={onMute}
          onToggleSuggestions={onToggleSuggestions}
          onArchive={onArchive}
          onBlock={onBlock}
          onClose={closeMenu}
        />
      ) : null}
    </>
  )
}
