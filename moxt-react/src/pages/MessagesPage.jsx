import { useFormik } from 'formik'
import {
  FiArchive,
  FiMessageSquare,
  FiSearch,
  FiStar,
  FiX,
} from 'react-icons/fi'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { messageSuggestionsForConversation } from '../features/communications/messageSuggestions'
import { getConversationPeer } from '../features/communications/conversationDisplay'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { AiAssistantPanel } from '../features/communications/AiAssistantPanel'
import {
  archiveConversation,
  deleteMessageLocally,
  editMessage,
  ensureConversationFromRemote,
  loadConversationMessages,
  loadOlderConversationMessages,
  loadParticipantProfiles,
  markConversationRead,
  reactToMessage,
  refreshConversations,
  restoreConversation,
  saveConversationDraft,
  sendMessage,
  setMessageSyncFailed,
  toggleConversationBlock,
  toggleConversationMute,
  toggleConversationPin,
} from '../features/communications/communicationSlice'
import { selectUnreadMessageCount, selectUserConversations } from '../features/selectors'
import { selectAccountPreferences, updateAccountPreferences } from '../features/account/accountSlice'
import { addToast } from '../features/ui/uiSlice'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useMessagesRealtimeSync } from '../hooks/useMessagesRealtimeSync'
import { useConversationTyping } from '../hooks/useConversationTyping'
import { ConversationFilterMenu } from './messages/ConversationFilterMenu'
import { ConversationNotFound } from './messages/ConversationNotFound'
import { ConversationPanel } from './messages/ConversationPanel'
import { ConversationRow } from './messages/ConversationRow'
import { MessagesEmptyState } from './messages/MessagesEmptyState'
import { countConversationsForFilter } from './messages/messageUtils'
import { storageService } from '../services/storageService'

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
  const [replyToContextId, setReplyToContextId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const listRef = useRef(null)
  const desktop = useMediaQuery('(min-width: 1024px)')
  const isFiltering = Boolean(query.trim())
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

  useMessagesRealtimeSync(
    activeId && activeId !== ASSISTANT_ID ? activeId : null,
  )

  const { peerTyping, notifyTyping, stopTyping } = useConversationTyping(
    activeId && activeId !== ASSISTANT_ID ? activeId : null,
    user.id,
  )

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
  const accountPreferences = useSelector((state) => selectAccountPreferences(state, user.id))
  const suggestionsEnabled = accountPreferences.messageSuggestionsEnabled !== false
  const suggestions = useSelector((state) => {
    if (!suggestionsEnabled) return []
    const conversation = state.communications.conversations.find((item) => item.id === activeId)
    if (!conversation || assistantActive) return []
    const peer = getConversationPeer(conversation, user.id)
    return messageSuggestionsForConversation(state, conversation, user.id, peer.name)
  })
  const formik = useFormik({
    initialValues: { text: active?.drafts?.[user.id] || '' },
    enableReinitialize: true,
    validate: (values) => {
      const errors = {}
      const text = values.text?.trim() || ''
      if (!text && !attachment) {
        errors.text = 'Ajoutez un message ou une pièce jointe.'
      } else if (text.length > 2000) {
        errors.text = 'Message trop long.'
      }
      return errors
    },
    onSubmit: async (values, helpers) => {
      if (!active || blocked) return
      stopTyping()
      // Mode édition : on modifie le message existant, sans en renvoyer un nouveau.
      if (editingId) {
        dispatch(
          editMessage({
            conversationId: active.id,
            messageId: editingId,
            userId: user.id,
            text: values.text,
          }),
        )
        setEditingId(null)
        helpers.resetForm({ values: { text: '' } })
        return
      }

      const trimmedText = values.text.trim()
      if (!trimmedText && !attachment) return

      helpers.setSubmitting(true)
      let attachmentPayload = null
      try {
        if (attachment) {
          attachmentPayload = {
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
          }
          if (attachment.type?.startsWith('image/')) {
            attachmentPayload.url = await storageService.uploadMessageImage(
              user.id,
              active.id,
              attachment,
            )
          }
        }
      } catch (error) {
        dispatch(
          addToast({
            title: 'Image non envoyée',
            message: error?.message || 'Impossible d’envoyer cette image pour le moment.',
            tone: 'error',
          }),
        )
        helpers.setSubmitting(false)
        return
      }

      const previousCount = active.messages.length
      dispatch(
        sendMessage({
          conversationId: active.id,
          senderId: user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          text: trimmedText,
          attachment: attachmentPayload,
          replyToId,
          relatedContextId: replyToContextId,
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
        helpers.setSubmitting(false)
        return
      }
      setAttachment(null)
      setReplyToId(null)
      setReplyToContextId(null)
      dispatch(saveConversationDraft({ id: active.id, userId: user.id, text: '' }))
      helpers.resetForm({ values: { text: '' } })
      helpers.setSubmitting(false)
    },
  })

  useEffect(() => {
    const replyContext = searchParams.get('replyContext')
    if (!replyContext || !active?.id || active.id !== requestedConversation) return
    setReplyToContextId(replyContext)
    setReplyToId(null)
    const params = new URLSearchParams(searchParams)
    params.delete('replyContext')
    setSearchParams(params, { replace: true })
  }, [active?.id, requestedConversation, searchParams, setSearchParams])

  useEffect(() => {
    if (!user?.id) return
    if (!conversations.length) {
      dispatch(refreshConversations())
    }
  }, [conversations.length, dispatch, user?.id])

  useEffect(() => {
    if (!searchOpen || !listRef.current) return
    listRef.current.scrollTop = 0
  }, [searchOpen, query, isFiltering])

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
    if (!active?.id || active.messagesLoading) return
    const loadedCount = active.messages?.length || 0
    const expectedCount = active.messageCount || 0
    const needsReload =
      !active.messagesLoaded ||
      (expectedCount > 0 && loadedCount < expectedCount)
    if (needsReload) {
      dispatch(loadConversationMessages(active.id))
      return
    }
    dispatch(markConversationRead({ conversationId: active.id, userId: user.id }))
  }, [
    active?.id,
    active?.messageCount,
    active?.messages?.length,
    active?.messagesLoaded,
    active?.messagesLoading,
    dispatch,
    user.id,
  ])

  function selectConversation(id) {
    setSearchParams({ conversation: id })
    setAttachment(null)
    setReplyToId(null)
    setReplyToContextId(null)
    formik.resetForm()
    setQuery('')
    setSearchOpen(false)
  }

  function closeSearch() {
    setQuery('')
    setSearchOpen(false)
  }

  function returnToList() {
    setSearchParams({})
  }

  function retryMessage(message) {
    if (!active || blocked) return
    dispatch(
      setMessageSyncFailed({
        conversationId: active.id,
        messageId: message.id,
        failed: false,
      }),
    )
    dispatch(
      deleteMessageLocally({
        conversationId: active.id,
        messageId: message.id,
        userId: user.id,
      }),
    )
    const previousCount = active.messages.length - 1
    dispatch(
      sendMessage({
        conversationId: active.id,
        senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        text: message.text,
        attachment: message.attachment,
        replyToId: message.replyToId,
        relatedContextId: message.relatedContextId,
      }),
    )
    const updated = store
      .getState()
      .communications.conversations.find((item) => item.id === active.id)
    if (!updated || updated.messages.length <= previousCount) {
      dispatch(
        addToast({
          title: 'Message non envoyé',
          message: 'Impossible de renvoyer ce message pour le moment.',
          tone: 'error',
        }),
      )
    }
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-transparent" data-testid="messages-viewport">
      {searchOpen ? (
        <div
          className="absolute inset-0 z-50 flex flex-col bg-[var(--app-surface)]"
          data-testid="messages-search-layer"
        >
          <div className="shrink-0 border-b border-[var(--app-border)]/60 bg-[var(--app-surface)] p-4 shadow-[0_10px_30px_rgb(15_23_42/0.06)] sm:p-5">
            <div className="flex min-h-12 items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] px-3">
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
                className="grid size-9 place-items-center rounded-xl bg-[var(--app-surface)]"
                onClick={closeSearch}
                aria-label="Fermer la recherche"
              >
                <FiX />
              </button>
            </div>
          </div>
          <div
            ref={listRef}
            className="scrollbar-hidden min-h-0 flex-1 overscroll-contain overflow-y-auto bg-[var(--app-surface-muted)]/45 p-2 sm:p-3"
          >
            <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
              {isFiltering ? `Résultats (${visible.length})` : 'Conversations'}
            </p>
            {visible.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                active={active?.id === conversation.id}
                conversation={conversation}
                userId={user.id}
                onClick={() => selectConversation(conversation.id)}
              />
            ))}
            {isFiltering && !visible.length ? (
              <p className="p-6 text-center text-sm text-[var(--app-text-faint)]">
                Aucune conversation trouvée.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
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
              <div className="flex shrink-0 items-center gap-2">
                <ConversationFilterMenu
                  className="lg:hidden"
                  conversations={conversations}
                  filter={filter}
                  onFilterChange={(next) => {
                    setFilter(next)
                    setShowArchived(false)
                  }}
                  showArchived={showArchived}
                  onToggleArchived={() => setShowArchived((value) => !value)}
                  userId={user.id}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-accent)] shadow-sm"
                  aria-label="Rechercher une conversation"
                >
                  <FiSearch />
                </button>
              </div>
            </div>
            <div
              className="message-filter-chips scrollbar-hidden mt-3 hidden gap-2 overflow-x-auto pb-0.5 lg:flex"
              role="toolbar"
              aria-label="Filtrer les conversations"
            >
              {MESSAGE_FILTERS.map((item) => {
                const count = countConversationsForFilter(
                  conversations,
                  item.id,
                  user.id,
                  showArchived,
                )
                const activeFilter = filter === item.id && !showArchived
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFilter(item.id)
                      setShowArchived(false)
                    }}
                    className={`message-filter-chip shrink-0 ${activeFilter ? 'message-filter-chip--active' : ''}`}
                    aria-pressed={activeFilter}
                  >
                    {item.icon ? <item.icon className="size-3" aria-hidden="true" /> : null}
                    {item.label}
                    {count ? <span className="message-filter-chip-count">{count}</span> : null}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setShowArchived((value) => !value)}
                className={`message-filter-chip shrink-0 ${showArchived ? 'message-filter-chip--active' : ''}`}
                aria-pressed={showArchived}
              >
                <FiArchive className="size-3" aria-hidden="true" />
                {showArchived ? 'Actives' : 'Archives'}
              </button>
            </div>
          </div>

          <div className="scrollbar-hidden min-h-0 flex-1 overscroll-contain overflow-y-auto bg-[var(--app-surface-muted)]/45 p-2 sm:p-3">
            <ConversationRow
              active={assistantActive}
              assistant
              onClick={() => selectConversation(ASSISTANT_ID)}
            />
            {visible.length || showArchived || filter !== 'all' ? (
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
            {!visible.length && filter === 'all' && !showArchived ? (
              <MessagesEmptyState />
            ) : !visible.length && filter !== 'all' ? (
              <p className="p-6 text-center text-sm text-[var(--app-text-faint)]">
                {filter === 'pinned'
                  ? 'Aucune conversation épinglée.'
                  : 'Aucune conversation non lue.'}
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
                messagesLoadingOlder={Boolean(active.messagesLoadingOlder)}
                hasOlderMessages={Boolean(active.hasOlderMessages)}
                onLoadOlder={() => dispatch(loadOlderConversationMessages(active.id))}
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
                onToggleSuggestions={() =>
                  dispatch(
                    updateAccountPreferences({
                      userId: user.id,
                      preferences: {
                        messageSuggestionsEnabled: !suggestionsEnabled,
                      },
                    }),
                  )
                }
                suggestionsEnabled={suggestionsEnabled}
                onDraft={(text) =>
                  dispatch(saveConversationDraft({ id: active.id, userId: user.id, text }))
                }
                onFile={setAttachment}
                onDelete={(messageId) => setPendingDeleteId(messageId)}
                onEdit={(message) => {
                  formik.setFieldValue('text', message.text)
                  setEditingId(message.id)
                  setReplyToId(null)
                  setReplyToContextId(null)
                }}
                onShare={async (message) => {
                  const text = message.text?.trim()
                  if (!text) return
                  // 1) Partage natif si dispo (mobile / contexte sécurisé).
                  if (navigator.share) {
                    try {
                      await navigator.share({ text })
                      return
                    } catch {
                      /* partage annulé — on retombe sur la copie */
                    }
                  }
                  // 2) Presse-papiers moderne (HTTPS uniquement).
                  let copied = false
                  if (navigator.clipboard?.writeText) {
                    try {
                      await navigator.clipboard.writeText(text)
                      copied = true
                    } catch {
                      copied = false
                    }
                  }
                  // 3) Repli execCommand (fonctionne sur http LAN, contexte non sécurisé).
                  if (!copied) {
                    try {
                      const area = document.createElement('textarea')
                      area.value = text
                      area.style.position = 'fixed'
                      area.style.opacity = '0'
                      document.body.appendChild(area)
                      area.focus()
                      area.select()
                      copied = document.execCommand('copy')
                      document.body.removeChild(area)
                    } catch {
                      copied = false
                    }
                  }
                  dispatch(
                    addToast(
                      copied
                        ? {
                            title: 'Message copié',
                            message: 'Le contenu a été copié dans le presse-papiers.',
                            tone: 'success',
                          }
                        : {
                            title: 'Copie impossible',
                            message: 'Impossible de copier le message sur cet appareil.',
                            tone: 'error',
                          },
                    ),
                  )
                }}
                onReact={(messageId, emoji) =>
                  dispatch(
                    reactToMessage({
                      conversationId: active.id,
                      messageId,
                      userId: user.id,
                      reaction: emoji,
                    }),
                  )
                }
                onReply={(messageId) => {
                  setReplyToId(messageId)
                  setReplyToContextId(null)
                }}
                onReplyToContext={setReplyToContextId}
                onRetry={retryMessage}
                replyToId={replyToId}
                replyToContextId={replyToContextId}
                archived={showArchived}
                suggestions={suggestions}
                editingId={editingId}
                onCancelEdit={() => {
                  setEditingId(null)
                  formik.setFieldValue('text', '')
                }}
                user={user}
                muted={active.mutedBy?.includes(user.id)}
                pinned={active.pinnedBy?.includes(user.id)}
                peerTyping={peerTyping}
                onTyping={notifyTyping}
                onStopTyping={stopTyping}
              />
            ) : null}
          </section>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Supprimer ce message ?"
        description="Le message sera retiré de votre conversation. Cette action est définitive."
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (active && pendingDeleteId) {
            dispatch(
              deleteMessageLocally({
                conversationId: active.id,
                messageId: pendingDeleteId,
                userId: user.id,
              }),
            )
          }
          setPendingDeleteId(null)
        }}
      />
    </div>
  )
}
