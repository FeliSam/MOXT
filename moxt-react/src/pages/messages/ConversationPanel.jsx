import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  FiArchive,
  FiArrowLeft,
  FiBellOff,
  FiExternalLink,
  FiMoreVertical,
  FiPaperclip,
  FiSend,
  FiSlash,
  FiStar,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getConversationPeer } from '../../features/communications/conversationDisplay'
import { buildConversationTimeline } from '../../features/communications/conversationTimeline'
import { resolveRelatedSnapshot } from '../../features/communications/relatedSnapshot'
import {
  MessageAvatar,
  MessageBubble,
  MessageDateSeparator,
  MessageEmptyState,
  MessageThreadStart,
  shouldGroupMessages,
} from './MessageBubble'
import { conversationMessageCount } from './messageUtils'
import { RelatedContentPreview } from './RelatedContentPreview'
import { MessageAvatar } from './MessageBubble'

export function ConversationPanel({
  active,
  attachment,
  blocked,
  formik,
  messagesLoading,
  onArchive,
  onBack,
  onBlock,
  onDraft,
  onFile,
  onMute,
  onPin,
  onDelete,
  onEdit,
  onReply,
  onShare,
  replyToId,
  archived,
  suggestions,
  user,
  muted,
  pinned,
}) {
  const peer = getConversationPeer(active, user.id)
  const relatedPreview = useSelector((state) => resolveRelatedSnapshot(state, active))
  const timeline = useMemo(() => buildConversationTimeline(active, user.id), [active, user.id])
  const messageListRef = useRef(null)
  const composerRef = useRef(null)
  const menuRef = useRef(null)
  const replyTarget = active.messages.find((item) => item.id === replyToId)
  const messageCount = conversationMessageCount(active, user.id)
  const [openActionsId, setOpenActionsId] = useState(null)
  const closeMenu = () => menuRef.current?.removeAttribute('open')

  useLayoutEffect(() => {
    const messageList = messageListRef.current
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight
    }
  }, [active.id, active.messages.length, active.relatedContexts?.length])

  useLayoutEffect(() => {
    const el = composerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [formik.values.text])

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        menuRef.current.removeAttribute('open')
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return (
    <>
      <header className="message-thread-header relative z-10 flex min-h-[4.75rem] shrink-0 items-center gap-3 border-b border-[var(--app-border)]/60 bg-[var(--app-surface)]/95 px-4 py-3 backdrop-blur-xl sm:px-5 lg:px-6">
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] lg:hidden"
          onClick={onBack}
          aria-label="Retour aux conversations"
        >
          <FiArrowLeft />
        </button>
        <MessageAvatar
          avatarUrl={peer.avatarUrl}
          className="!size-12 !rounded-[1rem] shadow-[var(--shadow-card)]"
          name={peer.name}
        />
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-black tracking-tight sm:text-[1.05rem]">
              {peer.name}
            </h2>
            {pinned ? <FiStar className="shrink-0 text-amber-500" aria-label="Épinglée" /> : null}
            {muted ? <FiBellOff className="shrink-0 text-[var(--app-text-faint)]" aria-label="En sourdine" /> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--app-text-muted)]">
              {messageCount
                ? `${messageCount} message${messageCount > 1 ? 's' : ''}`
                : 'Nouvelle conversation'}
            </span>
          </div>
        </div>
        {(active.relatedPath || relatedPreview?.path) ? (
          <>
            <Link
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-brand-700 transition hover:border-brand-200 hover:bg-[var(--app-accent-soft)] lg:hidden dark:text-brand-300"
              to={active.relatedPath || relatedPreview.path}
              aria-label="Voir la fiche"
            >
              <FiExternalLink />
            </Link>
            <Link
              className="hidden shrink-0 items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-bold text-brand-700 transition hover:border-brand-200 hover:bg-[var(--app-accent-soft)] lg:inline-flex dark:text-brand-300"
              to={active.relatedPath || relatedPreview.path}
            >
              Voir la fiche <FiExternalLink />
            </Link>
          </>
        ) : null}
        <details ref={menuRef} className="relative">
          <summary
            className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-transparent text-[var(--app-text-muted)] transition hover:border-[var(--app-border)] hover:bg-[var(--app-surface-muted)]"
            aria-label="Options de conversation"
          >
            <FiMoreVertical />
          </summary>
          <div className="panel-pop absolute right-0 top-[calc(100%+0.4rem)] z-20 grid w-52 gap-1 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--shadow-card-lg)]">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
              onClick={() => {
                onPin()
                closeMenu()
              }}
            >
              <FiStar /> {pinned ? 'Désépingler' : 'Épingler'}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
              onClick={() => {
                onMute()
                closeMenu()
              }}
            >
              <FiBellOff /> {muted ? 'Réactiver les alertes' : 'Mettre en sourdine'}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
              onClick={() => {
                onArchive()
                closeMenu()
              }}
            >
              <FiArchive /> {archived ? 'Restaurer' : 'Archiver'}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => {
                onBlock()
                closeMenu()
              }}
            >
              <FiSlash /> {blocked ? 'Débloquer' : 'Bloquer'}
            </button>
          </div>
        </details>
      </header>

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

      <div
        ref={messageListRef}
        className="message-thread-canvas scrollbar-hidden min-h-0 flex-1 overscroll-contain overflow-y-auto p-4 sm:p-6"
        data-testid="message-scroll-region"
      >
        <div className="mx-auto flex max-w-3xl flex-col">
          {messagesLoading ? (
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
              <MessageThreadStart />
              {timeline.map((item, index) => {
                const previous = timeline[index - 1]
                const showDate =
                  !previous || previous.at.toDateString() !== item.at.toDateString()

                if (item.kind === 'related') {
                  return (
                    <div key={item.id}>
                      {showDate ? <MessageDateSeparator date={item.at} /> : null}
                      <RelatedContentPreview inline preview={item.preview} />
                    </div>
                  )
                }

                const message = item.message
                const mine = message.senderId === user.id
                let previousMessage = null
                for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
                  if (timeline[cursor].kind === 'message') {
                    previousMessage = timeline[cursor].message
                    break
                  }
                }
                let nextMessage = null
                for (let cursor = index + 1; cursor < timeline.length; cursor += 1) {
                  if (timeline[cursor].kind === 'message') {
                    nextMessage = timeline[cursor].message
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
                const showSenderName = !mine && !groupedWithPrevious
                const repliedMessage = active.messages.find((entry) => entry.id === message.replyToId)

                return (
                  <div key={message.id}>
                    {showDate ? <MessageDateSeparator date={item.at} /> : null}
                    <div
                      className={`message-row ${mine ? 'message-row--sent' : ''} ${
                        groupedWithPrevious ? 'message-row--grouped' : 'message-row--spaced'
                      }`}
                    >
                      {!mine ? (
                        <MessageAvatar name={message.senderName} hidden={groupedWithPrevious} />
                      ) : null}
                      <MessageBubble
                        groupedWithNext={groupedWithNext}
                        groupedWithPrevious={groupedWithPrevious}
                        message={message}
                        mine={mine}
                        onCloseActions={() => setOpenActionsId(null)}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onReply={onReply}
                        onShare={onShare}
                        onToggleActions={() =>
                          setOpenActionsId((current) => (current === message.id ? null : message.id))
                        }
                        openActions={openActionsId === message.id}
                        repliedMessage={repliedMessage}
                        showSenderName={showSenderName}
                        user={user}
                      />
                    </div>
                  </div>
                )
              })}
              {!timeline.length ? <MessageEmptyState /> : null}
            </>
          )}
        </div>
      </div>

      <div
        className="message-composer-shell relative z-10 shrink-0 border-t border-[var(--app-border)]/60 bg-[var(--app-surface)]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
        data-testid="message-composer"
      >
        {!blocked ? (
          <div className="message-suggestions scrollbar-hidden mx-auto mb-3 flex max-w-3xl gap-2 overflow-x-auto pb-1 [&>*:nth-child(n+4)]:hidden sm:[&>*:nth-child(n+4)]:inline-flex">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="shrink-0 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--app-text-muted)] shadow-sm transition hover:border-brand-200 hover:bg-[var(--app-accent-soft)] hover:text-brand-700"
                onClick={() => formik.setFieldValue('text', suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
        {attachment ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-xs">
            <FiPaperclip /> {attachment.name}
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
              className="shrink-0 rounded-lg px-2 py-1 font-bold text-[var(--app-accent)] hover:bg-[var(--app-surface)]"
              onClick={() => onReply(null)}
              aria-label="Annuler la réponse"
            >
              Annuler
            </button>
          </div>
        ) : null}
        <form
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)]/80 p-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]"
          onSubmit={formik.handleSubmit}
        >
          <label
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-lg text-[var(--app-accent)] shadow-sm transition hover:border-brand-200 hover:bg-[var(--app-accent-soft)]"
            aria-label="Ajouter un document"
          >
            <FiPaperclip aria-hidden="true" />
            <input
              className="sr-only"
              type="file"
              disabled={blocked}
              onChange={(event) => onFile(event.target.files?.[0] || null)}
            />
          </label>
          <textarea
            ref={composerRef}
            className="max-h-32 min-h-11 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2.5 text-sm leading-6 outline-none placeholder:text-[var(--app-text-faint)]"
            placeholder={blocked ? 'Cette conversation est bloquée' : 'Écrire un message…'}
            aria-label="Écrire un message"
            rows={1}
            disabled={blocked}
            {...formik.getFieldProps('text')}
            onChange={(event) => {
              formik.handleChange(event)
              onDraft(event.target.value)
            }}
          />
          <button
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-700 text-lg text-white shadow-[0_10px_24px_rgb(8_112_95/0.28)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
            type="submit"
            aria-label="Envoyer"
            disabled={blocked || !formik.values.text.trim() || formik.isSubmitting}
          >
            <FiSend aria-hidden="true" />
          </button>
        </form>
        <div className="mx-auto mt-2 flex max-w-3xl items-start justify-between gap-3 px-1">
          {formik.errors.text && formik.touched.text ? (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{formik.errors.text}</p>
          ) : (
            <span className="text-[10px] text-[var(--app-text-faint)]">Brouillon enregistré automatiquement</span>
          )}
          <span className="shrink-0 text-[10px] tabular-nums text-[var(--app-text-faint)]">
            {formik.values.text.length} / 2000
          </span>
        </div>
      </div>
    </>
  )
}
