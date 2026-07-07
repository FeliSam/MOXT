import { useFormik } from 'formik'
import {
  FiArchive,
  FiFilter,
  FiMessageSquare,
  FiSearch,
  FiStar,
  FiX,
} from 'react-icons/fi'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { messageSuggestionsFor } from '../config/communications'
import { AiAssistantPanel } from '../features/communications/AiAssistantPanel'
import { messageSchema } from '../features/communications/communicationSchemas'
import {
  archiveConversation,
  deleteMessageLocally,
  ensureConversationFromRemote,
  loadConversationMessages,
  loadParticipantProfiles,
  markConversationRead,
  restoreConversation,
  saveConversationDraft,
  sendMessage,
  toggleConversationBlock,
  toggleConversationMute,
  toggleConversationPin,
} from '../features/communications/communicationSlice'
import { selectUnreadMessageCount, selectUserConversations } from '../features/selectors'
import { addToast } from '../features/ui/uiSlice'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ConversationNotFound } from './messages/ConversationNotFound'
import { ConversationPanel } from './messages/ConversationPanel'
import { ConversationRow } from './messages/ConversationRow'
import { MessagesEmptyState } from './messages/MessagesEmptyState'
import { countConversationsForFilter } from './messages/messageUtils'
import { getConversationPeer } from '../features/communications/conversationDisplay'

const ASSISTANT_ID = 'moxt-assistant'

const MESSAGE_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'unread', label: 'Non lues' },
  { id: 'pinned', label: 'Épinglées', icon: FiStar },
]

export function MessagesPage() {
  const dispatch = useDispatch()
  const store = useStore()
  const user = useSelector((state) => state.auth.user)
  const conversations = useSelector(selectUserConversations)
  const unreadMessagesCount = useSelector(selectUnreadMessageCount)
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [replyToId, setReplyToId] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const desktop = useMediaQuery('(min-width: 1024px)')
  const relatedConversation = conversations.find(
    (item) =>
      item.relatedType === searchParams.get('relatedType') &&
      item.relatedId === searchParams.get('relatedId'),
  )
  const requestedConversation = searchParams.get('conversation')
  const activeHumanConversations = useMemo(
    () => conversations.filter((item) => !item.archivedBy?.includes(user.id)),
    [conversations, user.id],
  )
  const hasUnreadHuman = activeHumanConversations.some(
    (item) => (item.unreadBy?.[user.id] || 0) > 0,
  )
  const defaultAssistant =
    desktop &&
    !requestedConversation &&
    !relatedConversation &&
    !hasUnreadHuman &&
    activeHumanConversations.length === 0
  const invalidConversation =
    Boolean(requestedConversation) &&
    requestedConversation !== ASSISTANT_ID &&
    !conversations.some((item) => item.id === requestedConversation)
  const activeId =
    relatedConversation?.id ||
    (invalidConversation
      ? requestedConversation
      : requestedConversation === ASSISTANT_ID ||
          conversations.some((item) => item.id === requestedConversation)
        ? requestedConversation
        : defaultAssistant
          ? ASSISTANT_ID
          : null)

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return conversations
      .filter((item) => {
        const archived = item.archivedBy?.includes(user.id)
        if (showArchived !== Boolean(archived)) return false
        if (filter === 'unread' && !(item.unreadBy?.[user.id] > 0)) return false
        if (filter === 'pinned' && !item.pinnedBy?.includes(user.id)) return false
        return `${getConversationPeer(item, user.id).name} ${item.messages.map((message) => message.text).join(' ')}`
          .toLowerCase()
          .includes(normalized)
      })
      .sort((left, right) => {
        const pinDelta =
          Number(Boolean(right.pinnedBy?.includes(user.id))) -
          Number(Boolean(left.pinnedBy?.includes(user.id)))
        return pinDelta || new Date(right.updatedAt) - new Date(left.updatedAt)
      })
  }, [conversations, filter, query, showArchived, user.id])

  const active = conversations.find((item) => item.id === activeId)
  const assistantActive = activeId === ASSISTANT_ID
  const integratedAssistant = assistantActive && defaultAssistant
  const blocked = active?.blockedBy?.includes(user.id)
  const suggestions = messageSuggestionsFor(active?.relatedType)
  const formik = useFormik({
    initialValues: { text: active?.drafts?.[user.id] || '' },
    enableReinitialize: true,
    validationSchema: messageSchema,
    onSubmit: (values, helpers) => {
      if (!active || blocked) return
      const previousCount = active.messages.length
      dispatch(
        sendMessage({
          conversationId: active.id,
          senderId: user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          text: values.text,
          attachment: attachment
            ? { name: attachment.name, size: attachment.size, type: attachment.type }
            : null,
          replyToId,
        }),
      )
      const updated = store
        .getState()
        .communications.conversations.find((item) => item.id === active.id)
      if (!updated || updated.messages.length === previousCount) {
        dispatch(
          addToast({
            title: 'Message non envoyé',
            message: 'Impossible d’envoyer ce message pour le moment.',
            tone: 'error',
          }),
        )
        return
      }
      setAttachment(null)
      setReplyToId(null)
      dispatch(saveConversationDraft({ id: active.id, userId: user.id, text: '' }))
      helpers.resetForm()
    },
  })

  useEffect(() => {
    if (
      !requestedConversation ||
      requestedConversation === ASSISTANT_ID ||
      conversations.some((item) => item.id === requestedConversation)
    ) {
      return
    }
    dispatch(ensureConversationFromRemote(requestedConversation))
  }, [conversations, dispatch, requestedConversation])

  useEffect(() => {
    const participantIds = conversations.flatMap((item) => item.participantIds || [])
    if (!participantIds.length) return
    dispatch(loadParticipantProfiles(participantIds))
  }, [conversations, dispatch])

  useEffect(() => {
    const relatedType = searchParams.get('relatedType')
    const relatedId = searchParams.get('relatedId')
    if (!relatedType || !relatedId || searchParams.get('conversation')) return
    const conversation = conversations.find(
      (item) => item.relatedType === relatedType && item.relatedId === relatedId,
    )
    if (conversation) {
      setSearchParams({ conversation: conversation.id }, { replace: true })
    }
  }, [conversations, searchParams, setSearchParams])

  useEffect(() => {
    if (active?.id) {
      dispatch(markConversationRead({ conversationId: active.id, userId: user.id }))
      if (!active.messagesLoaded || active.messages.length === 0) {
        dispatch(loadConversationMessages(active.id))
      }
    }
  }, [active?.id, active?.messages.length, active?.messagesLoaded, dispatch, user.id])

  function selectConversation(id) {
    setSearchParams({ conversation: id })
    setAttachment(null)
    formik.resetForm()
  }

  function returnToList() {
    setSearchParams({})
  }

  return (
    <div className="h-full min-h-0 overflow-hidden bg-transparent" data-testid="messages-viewport">
      <div
        className={
          integratedAssistant
            ? 'mx-auto grid h-full min-h-0 w-full min-w-0 overflow-hidden rounded-t-[2rem] bg-[var(--app-surface)] lg:grid-cols-[25rem_minmax(0,1fr)]'
            : activeId
              ? 'grid h-full min-h-0 w-full min-w-0 overflow-hidden rounded-t-[2rem] bg-[var(--app-surface)] lg:grid-cols-[25rem_minmax(0,1fr)]'
              : 'mx-auto h-full min-h-0 w-full min-w-0 max-w-5xl overflow-hidden rounded-t-[2rem] bg-[var(--app-surface)]'
        }
      >
        <aside
          className={`${activeId ? 'hidden lg:flex' : 'flex'} relative z-30 h-full min-h-0 min-w-0 flex-col bg-[var(--app-surface)] lg:w-[25rem] lg:max-w-[25rem] ${
            activeId
              ? 'lg:overflow-hidden lg:shadow-[12px_0_35px_rgb(15_23_42/0.06)]'
              : 'overflow-hidden'
          }`}
          data-testid="messages-list"
        >
          <div className="relative z-10 shrink-0 bg-[var(--app-surface)] p-4 shadow-[0_10px_30px_rgb(15_23_42/0.06)] sm:p-5 lg:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-xl text-[var(--app-accent)]">
                <FiMessageSquare />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="font-black">Conversations</h1>
                <p className="text-xs text-[var(--app-text-muted)]">
                  {activeHumanConversations.length + 1} échange(s){' '}
                  {showArchived ? 'archivé(s)' : 'actif(s)'}
                  {!showArchived && unreadMessagesCount > 0
                    ? ` · ${unreadMessagesCount} non lu${unreadMessagesCount > 1 ? 's' : ''}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-accent)] shadow-sm"
                aria-label="Rechercher une conversation"
              >
                <FiSearch />
              </button>
              <details className="relative">
                <summary
                  className="grid size-10 cursor-pointer list-none place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-accent)] shadow-sm"
                  aria-label={showArchived ? 'Voir les conversations actives' : 'Voir les archives'}
                >
                  <FiArchive />
                </summary>
                <div className="panel-pop absolute right-0 top-[calc(100%+0.4rem)] z-30 grid min-w-44 gap-1 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--shadow-card-lg)]">
                  <button
                    type="button"
                    className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-surface-muted)]"
                    onClick={() => setShowArchived((value) => !value)}
                  >
                    {showArchived ? 'Voir les conversations actives' : 'Voir les archives'}
                  </button>
                </div>
              </details>
              <details className="relative">
                <summary
                  className="grid size-10 cursor-pointer list-none place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-accent)] shadow-sm"
                  aria-label="Filtrer les conversations"
                >
                  <FiFilter />
                </summary>
                <div className="panel-pop absolute right-0 top-[calc(100%+0.4rem)] z-30 grid min-w-44 gap-1 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--shadow-card-lg)]">
                  {MESSAGE_FILTERS.map((item) => {
                    const count = countConversationsForFilter(
                      conversations,
                      item.id,
                      user.id,
                      showArchived,
                    )
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFilter(item.id)}
                        className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                          filter === item.id
                            ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                            : 'text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {item.icon ? <item.icon className="text-xs" /> : null}
                          {item.label}
                        </span>
                        <span className="text-xs text-[var(--app-text-muted)]">{count || ''}</span>
                      </button>
                    )
                  })}
                </div>
              </details>
            </div>
            {searchOpen ? (
              <div className="absolute inset-x-3 top-3 z-20 flex min-h-12 items-center gap-2 rounded-2xl bg-[var(--app-surface)] px-3 shadow-2xl">
                <FiSearch className="shrink-0 text-[var(--app-text-muted)]" />
                <input
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher une conversation"
                  aria-label="Rechercher une conversation"
                />
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-xl bg-[var(--app-surface-muted)]"
                  onClick={() => {
                    setQuery('')
                    setSearchOpen(false)
                  }}
                  aria-label="Fermer la recherche"
                >
                  <FiX />
                </button>
              </div>
            ) : null}
          </div>

          <div className="scrollbar-hidden min-h-0 flex-1 overscroll-contain overflow-y-auto bg-[var(--app-surface-muted)]/45 p-2 sm:p-3">
            <ConversationRow
              active={assistantActive}
              assistant
              onClick={() => selectConversation(ASSISTANT_ID)}
            />
            {visible.length || showArchived || query || filter !== 'all' ? (
              <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
                Vos conversations
              </p>
            ) : null}
            {visible.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                active={active?.id === conversation.id}
                conversation={conversation}
                userId={user.id}
                onClick={() => selectConversation(conversation.id)}
              />
            ))}
            {!visible.length && !query && filter === 'all' && !showArchived ? (
              <MessagesEmptyState />
            ) : !visible.length && (query || filter !== 'all') ? (
              <p className="p-6 text-center text-sm text-[var(--app-text-faint)]">
                {filter === 'pinned'
                  ? 'Aucune conversation épinglée.'
                  : filter === 'unread'
                    ? 'Aucune conversation non lue.'
                    : 'Aucune conversation trouvée.'}
              </p>
            ) : null}
          </div>
        </aside>

        {activeId ? (
          <section
            className="flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden bg-[var(--app-surface)]"
            data-testid="message-thread"
          >
            {assistantActive ? (
              <AiAssistantPanel onBack={returnToList} showBack={!desktop} userId={user.id} />
            ) : invalidConversation ? (
              <ConversationNotFound onBack={returnToList} />
            ) : active ? (
              <ConversationPanel
                active={active}
                messagesLoading={Boolean(active.messagesLoading)}
                attachment={attachment}
                blocked={blocked}
                formik={formik}
                onArchive={() => {
                  dispatch(
                    showArchived
                      ? restoreConversation({ id: active.id, userId: user.id })
                      : archiveConversation({ id: active.id, userId: user.id }),
                  )
                  returnToList()
                }}
                onBack={returnToList}
                onBlock={() =>
                  dispatch(toggleConversationBlock({ id: active.id, userId: user.id }))
                }
                onMute={() => dispatch(toggleConversationMute({ id: active.id, userId: user.id }))}
                onPin={() => dispatch(toggleConversationPin({ id: active.id, userId: user.id }))}
                onDraft={(text) =>
                  dispatch(saveConversationDraft({ id: active.id, userId: user.id, text }))
                }
                onFile={setAttachment}
                onDelete={(messageId) =>
                  dispatch(
                    deleteMessageLocally({
                      conversationId: active.id,
                      messageId,
                      userId: user.id,
                    }),
                  )
                }
                onEdit={(message) => {
                  formik.setFieldValue('text', message.text)
                  setReplyToId(null)
                }}
                onShare={async (message) => {
                  const text = message.text?.trim()
                  if (!text) return
                  try {
                    if (navigator.share) {
                      await navigator.share({ text })
                    } else {
                      await navigator.clipboard.writeText(text)
                      dispatch(
                        addToast({
                          title: 'Message copié',
                          message: 'Le contenu a été copié dans le presse-papiers.',
                          tone: 'success',
                        }),
                      )
                    }
                  } catch {
                    /* annulation du partage natif */
                  }
                }}
                onReply={setReplyToId}
                replyToId={replyToId}
                archived={showArchived}
                suggestions={suggestions}
                user={user}
                muted={active.mutedBy?.includes(user.id)}
                pinned={active.pinnedBy?.includes(user.id)}
              />
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}
