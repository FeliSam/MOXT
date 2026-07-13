import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  FiArchive,
  FiArrowDown,
  FiArrowLeft,
  FiBellOff,
  FiExternalLink,
  FiMessageSquare,
  FiMoreVertical,
  FiPaperclip,
  FiSearch,
  FiSend,
  FiSlash,
  FiStar,
  FiX,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RELATED_CONTENT_META } from '../../config/communications'
import { useLanguage } from '../../contexts/useLanguage'
import { getConversationPeer } from '../../features/communications/conversationDisplay'
import {
  buildConversationTimeline,
  buildContextPreview,
  findRelatedContextById,
} from '../../features/communications/conversationTimeline'
import { resolveRelatedSnapshot } from '../../features/communications/relatedSnapshot'
import { PopoverMenu } from '../../components/ui/PopoverMenu'
import { VerifiedDisplayName } from '../../components/ui/Badge'
import { peerActivityLabel, truncateWords } from './format'
import {
  MessageAvatar,
  MessageBubble,
  MessageDateSeparator,
  MessageEmptyState,
  MessageSecurityNotice,
  MessageThreadStart,
  MessageUnreadSeparator,
  firstUnreadMessageIndex,
  shouldGroupMessages,
} from './MessageBubble'
import { conversationMessageCount, isMessageFromUser, messageHasReactions } from './messageUtils'
import { RelatedContentPreview } from './RelatedContentPreview'
import { TypingDots, TypingIndicator } from './TypingIndicator'

function matchesThreadQuery(text, query) {
  if (!query.trim()) return true
  return text?.toLowerCase().includes(query.trim().toLowerCase())
}

export function ConversationPanel({
  active,
  attachment,
  blocked,
  formik,
  messagesLoading,
  messagesLoadingOlder = false,
  hasOlderMessages = false,
  onLoadOlder,
  onArchive,
  onBack,
  onBlock,
  onDraft,
  onFile,
  onMute,
  onPin,
  onDelete,
  onEdit,
  onReact,
  onReply,
  onReplyToContext,
  onRetry,
  onShare,
  editingId,
  onCancelEdit,
  replyToId,
  replyToContextId,
  peerTyping = false,
  onTyping,
  onStopTyping,
  archived,
  onToggleSuggestions,
  suggestions,
  suggestionsEnabled,
  user,
  muted,
  pinned,
}) {
  const { t } = useLanguage()
  const peer = getConversationPeer(active, user.id)
  const relatedPreview = useSelector((state) => resolveRelatedSnapshot(state, active))
  const relatedMeta = RELATED_CONTENT_META[relatedPreview?.type || active.relatedType] || RELATED_CONTENT_META.general
  const RelatedIcon = relatedMeta.icon
  const timeline = useMemo(() => {
    const items = buildConversationTimeline(active, user.id)
    if (items.some((item) => item.kind === 'related')) return items
    if (!relatedPreview?.path) return items
    return [
      {
        kind: 'related',
        id: `CTX-resolved-${active.relatedId || active.id}`,
        at: new Date(active.createdAt || active.updatedAt || Date.now()),
        preview: relatedPreview,
      },
      ...items,
    ]
  }, [active, relatedPreview, user.id])
  const messageListRef = useRef(null)
  const composerRef = useRef(null)
  const stickToBottomRef = useRef(true)
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState(null)
  const replyTarget = active.messages.find((item) => item.id === replyToId)
  const replyContextEntry = findRelatedContextById(active, replyToContextId)
  const replyContextPreview = replyContextEntry
    ? buildContextPreview(replyContextEntry, active)
    : null
  const messageCount = conversationMessageCount(active, user.id)
  const [openActionsId, setOpenActionsId] = useState(null)
  const [threadSearchOpen, setThreadSearchOpen] = useState(false)
  const [threadQuery, setThreadQuery] = useState('')
  const [showScrollFab, setShowScrollFab] = useState(false)
  const [initialUnreadCount] = useState(() => active.unreadBy?.[user.id] || 0)
  const firstUnreadIndex = useMemo(
    () => firstUnreadMessageIndex(active.messages, user.id, initialUnreadCount),
    [active.messages, initialUnreadCount, user.id],
  )
  const hasDraft = Boolean(formik.values.text.trim())
  const draftSaved = Boolean(active.drafts?.[user.id]?.trim())
  const showDraftHint = hasDraft && draftSaved
  const filteredTimeline = useMemo(() => {
    const normalized = threadQuery.trim()
    if (!normalized) return timeline
    return timeline.filter((item) => {
      if (item.kind === 'related') {
        return `${item.preview?.title || ''} ${item.preview?.subtitle || ''}`
          .toLowerCase()
          .includes(normalized.toLowerCase())
      }
      return matchesThreadQuery(item.message?.text, normalized)
    })
  }, [threadQuery, timeline])

  function stickToBottom(behavior = 'auto') {
    const messageList = messageListRef.current
    if (!messageList) return
    const top = messageList.scrollHeight
    if (behavior === 'smooth') {
      messageList.scrollTo({ top, behavior: 'smooth' })
      return
    }
    messageList.scrollTop = top
  }

  useLayoutEffect(() => {
    if (!stickToBottomRef.current) return
    stickToBottom('auto')
    const frame = requestAnimationFrame(() => stickToBottom('auto'))
    return () => cancelAnimationFrame(frame)
  }, [active.id, active.messages.length, active.relatedContexts?.length, formik.values.text])

  useLayoutEffect(() => {
    const el = composerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [formik.values.text])

  useEffect(() => {
    stickToBottomRef.current = true
  }, [active.id])

  useEffect(() => {
    const messageList = messageListRef.current
    if (!messageList) return
    function handleScroll() {
      const distanceFromBottom =
        messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight
      stickToBottomRef.current = distanceFromBottom < 120
      setShowScrollFab(distanceFromBottom > 120)
    }
    handleScroll()
    messageList.addEventListener('scroll', handleScroll, { passive: true })
    return () => messageList.removeEventListener('scroll', handleScroll)
  }, [active.id])

  useEffect(() => {
    if (!attachment?.type?.startsWith('image/')) {
      setAttachmentPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(attachment)
    setAttachmentPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [attachment])

  useEffect(() => {
    if (!peerTyping) return
    if (!stickToBottomRef.current) return
    stickToBottom('smooth')
  }, [peerTyping])

  function scrollToBottom() {
    stickToBottomRef.current = true
    stickToBottom('smooth')
  }

  return (
    <>
      <header className="message-thread-header relative z-30 flex min-h-[4.25rem] shrink-0 items-center gap-2.5 border-b border-[var(--app-border)]/60 bg-[var(--app-surface)]/95 px-3 py-2.5 backdrop-blur-xl sm:gap-3 sm:px-4 lg:px-5">
        <button
          type="button"
          className="message-touch-target grid size-9 shrink-0 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] lg:hidden"
          onClick={onBack}
          aria-label="Retour aux conversations"
        >
          <FiArrowLeft />
        </button>
        <MessageAvatar
          avatarUrl={peer.avatarUrl}
          className="!size-10 !rounded-[0.9rem] shadow-[var(--shadow-card)]"
          name={peer.name}
        />
        <div className="min-w-0 flex-1 pr-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <VerifiedDisplayName
              as="h2"
              name={peer.name}
              verified={Boolean(peer.verified)}
              iconSize="sm"
              className="truncate text-sm font-black tracking-tight sm:text-[0.9375rem]"
            />
            {pinned ? <FiStar className="size-3.5 shrink-0 text-amber-500" aria-label="Épinglée" /> : null}
            {muted ? <FiBellOff className="size-3.5 shrink-0 text-[var(--app-text-faint)]" aria-label="En sourdine" /> : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {peerTyping ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold leading-tight text-brand-700 dark:text-brand-300">
                {t('messages.typing')}
                <TypingDots />
              </span>
            ) : (
              <span className="text-[11px] leading-tight text-[var(--app-text-muted)]">
                {peerActivityLabel(active.updatedAt)}
              </span>
            )}
            {messageCount ? (
              <span className="text-[11px] leading-tight text-[var(--app-text-faint)]">
                · {messageCount} message{messageCount > 1 ? 's' : ''}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="message-touch-target grid size-9 shrink-0 place-items-center rounded-xl border border-transparent text-[var(--app-text-muted)] transition hover:border-[var(--app-border)] hover:bg-[var(--app-surface-muted)]"
          onClick={() => {
            setThreadSearchOpen((value) => !value)
            if (threadSearchOpen) setThreadQuery('')
          }}
          aria-label={threadSearchOpen ? 'Fermer la recherche dans le fil' : 'Rechercher dans le fil'}
          aria-pressed={threadSearchOpen}
        >
          <FiSearch />
        </button>
        {(active.relatedPath || relatedPreview?.path) ? (
          <>
            <Link
              className="message-touch-target grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-brand-700 transition hover:border-brand-200 hover:bg-[var(--app-accent-soft)] lg:hidden dark:text-brand-300"
              to={active.relatedPath || relatedPreview.path}
              aria-label="Voir la fiche"
            >
              <FiExternalLink />
            </Link>
            <Link
              className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1.5 text-xs font-bold text-brand-700 transition hover:border-brand-200 hover:bg-[var(--app-accent-soft)] lg:inline-flex dark:text-brand-300"
              to={active.relatedPath || relatedPreview.path}
            >
              Voir la fiche <FiExternalLink />
            </Link>
          </>
        ) : null}
        <PopoverMenu
          ariaLabel="Options de conversation"
          trigger={
            <span className="message-touch-target grid size-9 cursor-pointer place-items-center rounded-xl border border-transparent text-[var(--app-text-muted)] transition hover:border-[var(--app-border)] hover:bg-[var(--app-surface-muted)]">
              <FiMoreVertical />
            </span>
          }
        >
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
            onClick={onPin}
          >
            <FiStar /> {pinned ? 'Désépingler' : 'Épingler'}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
            onClick={onMute}
          >
            <FiBellOff /> {muted ? 'Réactiver les alertes' : 'Mettre en sourdine'}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
            onClick={() => onToggleSuggestions?.()}
          >
            <FiMessageSquare />{' '}
            {suggestionsEnabled ? 'Masquer les suggestions' : 'Afficher les suggestions'}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
            onClick={onArchive}
          >
            <FiArchive /> {archived ? 'Restaurer' : 'Archiver'}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={onBlock}
          >
            <FiSlash /> {blocked ? 'Débloquer' : 'Bloquer'}
          </button>
        </PopoverMenu>
      </header>

      {threadSearchOpen ? (
        <div className="shrink-0 border-b border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/70 px-3 py-2 sm:px-4">
          <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl bg-[var(--app-surface)] px-3 py-2">
            <FiSearch className="shrink-0 text-[var(--app-text-muted)]" />
            <input
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              value={threadQuery}
              onChange={(event) => setThreadQuery(event.target.value)}
              placeholder="Rechercher dans cette conversation"
              aria-label="Rechercher dans cette conversation"
            />
            {threadQuery ? (
              <button
                type="button"
                className="grid size-8 place-items-center rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]"
                onClick={() => setThreadQuery('')}
                aria-label="Effacer la recherche"
              >
                <FiX />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {relatedPreview?.path ? (
        <div className="message-related-sticky shrink-0 border-b border-[var(--app-border)]/60 bg-[var(--app-surface)]/95 px-3 py-2 backdrop-blur-xl sm:px-4">
          <Link
            to={relatedPreview.path}
            className="mx-auto flex max-w-3xl items-center gap-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 px-3 py-2 transition hover:border-brand-200 hover:bg-[var(--app-accent-soft)]/40"
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm text-white ${relatedMeta.tone}`}
            >
              <RelatedIcon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-black text-[var(--app-text)]">
                {relatedPreview.title}
              </span>
              <span className="block truncate text-[10px] font-semibold text-[var(--app-text-muted)]">
                {relatedMeta.label}
                {relatedPreview.subtitle ? ` · ${relatedPreview.subtitle}` : ''}
              </span>
            </span>
            <FiExternalLink className="shrink-0 text-[var(--app-text-muted)]" />
          </Link>
        </div>
      ) : null}

      {active.archivedBy?.includes(user.id) ? (
        <div className="shrink-0 border-b border-amber-200/80 bg-amber-50/90 px-4 py-2.5 text-center text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Conversation archivée — vous pouvez la restaurer depuis le menu ⋯
        </div>
      ) : null}

      {blocked ? (
        <div className="shrink-0 border-b border-red-200/80 bg-red-50/90 px-4 py-2.5 text-center text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Cette conversation est bloquée. Vous ne pouvez plus envoyer de messages.
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div
          ref={messageListRef}
          className="message-thread-canvas scrollbar-hidden h-full overscroll-contain overflow-y-auto p-3 sm:p-4"
          data-testid="message-scroll-region"
        >
          <div className="mx-auto flex max-w-3xl flex-col">
            {messagesLoading && active.messages?.length > 0 ? (
              <p className="sticky top-0 z-10 mb-3 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/95 px-3 py-1.5 text-center text-xs font-medium text-[var(--app-text-muted)] backdrop-blur-sm">
                {t('messages.syncing')}
              </p>
            ) : null}
            {messagesLoading && !active.messages?.length ? (
              <div className="flex flex-col gap-4 py-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`message-row ${i % 2 ? 'message-row--sent' : ''} ${i % 2 ? 'ml-auto' : ''}`}
                  >
                    {i % 2 ? null : <span className="message-avatar animate-pulse bg-[var(--app-border)]" />}
                    <div className="h-12 w-48 animate-pulse rounded-[1rem] bg-[var(--app-border)]/80" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {hasOlderMessages ? (
                  <div className="mb-4 flex justify-center">
                    <button
                      type="button"
                      className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-1.5 text-xs font-semibold text-[var(--app-text-muted)] transition hover:border-brand-200 hover:text-[var(--app-text)] disabled:opacity-60"
                      disabled={messagesLoadingOlder}
                      onClick={onLoadOlder}
                    >
                      {messagesLoadingOlder ? t('messages.loadingOlder') : t('messages.loadOlder')}
                    </button>
                  </div>
                ) : null}
                <MessageThreadStart />
                <MessageSecurityNotice />
                {threadQuery.trim() && !filteredTimeline.length ? (
                  <p className="py-8 text-center text-sm text-[var(--app-text-faint)]">
                    Aucun message ne correspond à votre recherche.
                  </p>
                ) : null}
                {filteredTimeline.map((item, index) => {
                  const previous = filteredTimeline[index - 1]
                  const showDate =
                    !previous || previous.at.toDateString() !== item.at.toDateString()

                  if (item.kind === 'related') {
                    return (
                      <div key={item.id}>
                        {showDate ? <MessageDateSeparator date={item.at} /> : null}
                        <RelatedContentPreview
                          inline
                          preview={item.preview}
                          contextId={item.id}
                          onReply={(contextId) => {
                            onReplyToContext?.(contextId)
                            onReply?.(null)
                          }}
                        />
                      </div>
                    )
                  }

                  const message = item.message
                  const mine = isMessageFromUser(message, user.id)
                  const sourceIndex = active.messages.findIndex((entry) => entry.id === message.id)
                  const showUnreadMarker =
                    sourceIndex === firstUnreadIndex && firstUnreadIndex >= 0 && initialUnreadCount > 0
                  let previousMessage = null
                  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
                    if (filteredTimeline[cursor].kind === 'message') {
                      previousMessage = filteredTimeline[cursor].message
                      break
                    }
                  }
                  let nextMessage = null
                  for (let cursor = index + 1; cursor < filteredTimeline.length; cursor += 1) {
                    if (filteredTimeline[cursor].kind === 'message') {
                      nextMessage = filteredTimeline[cursor].message
                      break
                    }
                  }
                  const groupedWithPrevious = shouldGroupMessages(previousMessage, message, showDate)
                  const groupedWithNext =
                    nextMessage &&
                    shouldGroupMessages(
                      message,
                      nextMessage,
                      new Date(message.createdAt).toDateString() !==
                        new Date(nextMessage.createdAt).toDateString(),
                    )
                  const previousHasReactions = messageHasReactions(previousMessage)
                  const showSenderName = !mine && !groupedWithPrevious
                  const repliedMessage = active.messages.find((entry) => entry.id === message.replyToId)
                  const repliedContext = message.relatedContextId
                    ? buildContextPreview(
                        findRelatedContextById(active, message.relatedContextId),
                        active,
                      )
                    : null
                  const highlight = Boolean(
                    threadQuery.trim() && matchesThreadQuery(message.text, threadQuery),
                  )

                  return (
                    <div key={message.id}>
                      {showUnreadMarker ? (
                        <MessageUnreadSeparator count={initialUnreadCount} />
                      ) : null}
                      {showDate ? <MessageDateSeparator date={item.at} /> : null}
                      <div
                        className={`message-row ${mine ? 'message-row--sent' : ''} ${
                          groupedWithPrevious
                            ? previousHasReactions
                              ? 'message-row--grouped message-row--after-reaction'
                              : 'message-row--grouped'
                            : 'message-row--spaced'
                        }`}
                      >
                        {!mine ? (
                          <MessageAvatar name={message.senderName} hidden={groupedWithPrevious} />
                        ) : null}
                        <MessageBubble
                          groupedWithNext={groupedWithNext}
                          groupedWithPrevious={groupedWithPrevious}
                          highlight={highlight}
                          message={message}
                          mine={mine}
                          onCloseActions={() => setOpenActionsId(null)}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          onReact={onReact}
                          onReply={onReply}
                          onRetry={onRetry}
                          onShare={onShare}
                          onToggleActions={() =>
                            setOpenActionsId((current) =>
                              current === message.id ? null : message.id,
                            )
                          }
                          openActions={openActionsId === message.id}
                          repliedMessage={repliedMessage}
                          repliedContext={repliedContext}
                          showSenderName={showSenderName}
                          user={user}
                        />
                      </div>
                    </div>
                  )
                })}
                {!timeline.length ? <MessageEmptyState /> : null}
                {peerTyping ? (
                  <TypingIndicator
                    peerName={peer.name}
                    label={t('messages.typingAria', { name: peer.name })}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>

        {showScrollFab ? (
          <button
            type="button"
            className="message-scroll-fab"
            onClick={scrollToBottom}
            aria-label="Revenir en bas de la conversation"
          >
            <FiArrowDown />
          </button>
        ) : null}
      </div>

      <div
        className="message-composer-shell relative z-10 shrink-0 border-t border-[var(--app-border)]/60 bg-[var(--app-surface)]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
        data-testid="message-composer"
      >
        {!blocked && suggestionsEnabled && suggestions.length ? (
          <div
            className="message-suggestions scrollbar-hidden mx-auto mb-1.5 flex max-w-3xl gap-1 overflow-x-auto"
            data-testid="message-suggestions"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${index}-${suggestion.slice(0, 24)}`}
                type="button"
                className="message-suggestion-chip shrink-0"
                title={suggestion}
                onClick={() => formik.setFieldValue('text', suggestion)}
              >
                {truncateWords(suggestion, 4)}
              </button>
            ))}
          </div>
        ) : null}
        {attachment ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-xs">
            {attachment.type?.startsWith('image/') && attachmentPreviewUrl ? (
              <img
                src={attachmentPreviewUrl}
                alt=""
                className="size-12 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <FiPaperclip className="shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate font-semibold">{attachment.name}</span>
            <button
              type="button"
              className="message-touch-target shrink-0 rounded-lg px-2 py-1 font-bold text-[var(--app-accent)] hover:bg-[var(--app-surface)]"
              onClick={() => onFile(null)}
              aria-label="Retirer la pièce jointe"
            >
              <FiX />
            </button>
          </div>
        ) : null}
        {replyToContextId && replyContextPreview ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-brand-200/70 border-l-[3px] border-l-brand-500 bg-[var(--app-accent-soft)]/50 px-3 py-2.5 text-xs">
            <span className="min-w-0">
              <span className="block font-bold text-[var(--app-accent)]">
                Réponse à l’annonce
              </span>
              <span className="block truncate text-[var(--app-text-muted)]">
                {replyContextPreview.title}
                {replyContextPreview.subtitle ? ` · ${replyContextPreview.subtitle}` : ''}
              </span>
            </span>
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-[var(--app-accent)] hover:bg-[var(--app-surface)]"
              onClick={() => onReplyToContext?.(null)}
              aria-label="Annuler la réponse à l’annonce"
            >
              <FiX />
            </button>
          </div>
        ) : null}
        {replyToId ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-brand-200/70 border-l-[3px] border-l-brand-500 bg-[var(--app-accent-soft)]/50 px-3 py-2.5 text-xs">
            <span className="min-w-0">
              <span className="block font-bold text-[var(--app-accent)]">
                Réponse à {replyTarget?.senderName || 'un message'}
              </span>
              <span className="block truncate text-[var(--app-text-muted)]">
                {replyTarget?.text || ''}
              </span>
            </span>
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-[var(--app-accent)] hover:bg-[var(--app-surface)]"
              onClick={() => onReply(null)}
              aria-label="Annuler la réponse"
            >
              <FiX />
            </button>
          </div>
        ) : null}
        {editingId ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-amber-300/70 border-l-[3px] border-l-amber-500 bg-amber-50/70 px-3 py-2.5 text-xs dark:bg-amber-950/30">
            <span className="min-w-0">
              <span className="block font-bold text-amber-700 dark:text-amber-300">
                Modification du message
              </span>
              <span className="block truncate text-[var(--app-text-muted)]">
                Modifiez le texte puis validez pour l’enregistrer.
              </span>
            </span>
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-amber-700 hover:bg-[var(--app-surface)] dark:text-amber-300"
              onClick={() => onCancelEdit?.()}
              aria-label="Annuler la modification"
            >
              <FiX />
            </button>
          </div>
        ) : null}
        <form
          className="mx-auto flex max-w-3xl items-end gap-1.5 rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)]/80 p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]"
          onSubmit={formik.handleSubmit}
        >
          <label
            className="message-touch-target grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-base text-[var(--app-accent)] shadow-sm transition hover:border-brand-200 hover:bg-[var(--app-accent-soft)]"
            aria-label="Ajouter un document"
          >
            <FiPaperclip aria-hidden="true" />
            <input
              className="sr-only"
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              disabled={blocked}
              onChange={(event) => onFile(event.target.files?.[0] || null)}
            />
          </label>
          <textarea
            ref={composerRef}
            className="max-h-28 min-h-9 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-xs leading-5 outline-none placeholder:text-[var(--app-text-faint)] sm:text-[13px] sm:leading-5"
            placeholder={blocked ? 'Cette conversation est bloquée' : 'Écrire un message…'}
            aria-label="Écrire un message"
            rows={1}
            disabled={blocked}
            {...formik.getFieldProps('text')}
            onChange={(event) => {
              formik.handleChange(event)
              onDraft(event.target.value)
              if (blocked) return
              if (event.target.value.trim()) {
                onTyping?.()
              } else {
                onStopTyping?.()
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                if (
                  !blocked &&
                  (formik.values.text.trim() || attachment) &&
                  !formik.isSubmitting
                ) {
                  formik.handleSubmit()
                }
              }
            }}
          />
          <button
            className="message-touch-target grid size-9 shrink-0 place-items-center rounded-xl bg-brand-700 text-base text-white shadow-[0_10px_24px_rgb(8_112_95/0.28)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
            type="submit"
            aria-label="Envoyer"
            disabled={blocked || (!formik.values.text.trim() && !attachment) || formik.isSubmitting}
          >
            <FiSend aria-hidden="true" />
          </button>
        </form>
        {showDraftHint || formik.values.text.length >= 1800 ? (
          <div className="mx-auto mt-2 flex max-w-3xl items-start justify-between gap-3 px-1">
            {showDraftHint ? (
              <span className="text-[10px] text-[var(--app-text-faint)]">Brouillon enregistré</span>
            ) : (
              <span />
            )}
            {formik.values.text.length >= 1800 ? (
              <span
                className={`shrink-0 text-[10px] tabular-nums ${
                  formik.values.text.length >= 2000
                    ? 'font-bold text-red-600 dark:text-red-400'
                    : 'text-[var(--app-text-faint)]'
                }`}
              >
                {formik.values.text.length} / 2000
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  )
}
