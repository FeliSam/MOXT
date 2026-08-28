import { useFormik } from 'formik'
import {
  FiSearch,
  FiX,
} from 'react-icons/fi'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useDeferredValue, useCallback } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { resetMessagesScroll } from '../hooks/useScrollToTopOnStep'
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
  preloadInboxMessages,
  markConversationRead,
  reactToMessage,
  reportMessage,
  refreshConversations,
  restoreConversation,
  saveConversationDraft,
  searchMessagesRemote,
  sendMessage,
  resendMessage,
  toggleConversationBlock,
  toggleConversationMute,
  toggleConversationPin,
} from '../features/communications/communicationSlice'
import { selectUnreadMessageCount, selectUserConversations } from '../features/selectors'
import { selectAccountPreferences, updateAccountPreferences } from '../features/account/accountSlice'
import { useProfileAvatarMap } from '../features/account/useProfileAvatarMap'
import { addToast } from '../features/ui/uiSlice'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useMessagesRealtimeSync } from '../hooks/useMessagesRealtimeSync'
import { useConversationTyping } from '../hooks/useConversationTyping'
import { useUploadProgress } from '../hooks/useUploadProgress'
import { ConversationNotFound } from './messages/ConversationNotFound'
import { ConversationPanel } from './messages/ConversationPanel'
import { ConversationRow } from './messages/ConversationRow'
import { MessagesEmptyState } from './messages/MessagesEmptyState'
import {
  conversationMatchesQuery,
  shouldShowConversationInList,
} from './messages/messageUtils'
import { storageService } from '../services/storageService'
import {
  isImageFile,
  isVideoFile,
  MAX_MESSAGE_IMAGES,
} from '../features/communications/attachmentUtils'
import { buildContactAttachment } from '../features/communications/contactShareUtils'
import { messagesText } from '../features/communications/messagesI18n'
import { useLanguage } from '../contexts/useLanguage'
import { useSetMessagesHeader } from '../contexts/MessagesHeaderContext'
import { conversationMatchesFilter } from './messages/messageFilters'
import { MessagesListHeader } from './messages/headers/MessagesListHeader'
import { MessagesThreadHeader } from './messages/headers/MessagesThreadHeader'
import { MessagesAssistantHeader } from './messages/headers/MessagesAssistantHeader'
import { useConversationHeaderModel } from './messages/headers/useConversationHeaderModel'

const ASSISTANT_ID = 'moxt-assistant'

export function MessagesPage() {
  const dispatch = useDispatch()
  const store = useStore()
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const conversations = useSelector(selectUserConversations)
  const unreadMessagesCount = useSelector(selectUnreadMessageCount)
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [attachmentsByConversation, setAttachmentsByConversation] = useState({})
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()
  const [replyToId, setReplyToId] = useState(null)
  const [replyToContextId, setReplyToContextId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [sentAnimationIds, setSentAnimationIds] = useState([])
  const [showArchived, setShowArchived] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [threadSearchOpen, setThreadSearchOpen] = useState(false)
  const [threadQuery, setThreadQuery] = useState('')
  const [assistantAdminCompose, setAssistantAdminCompose] = useState(false)
  const assistantHeaderActionsRef = useRef({
    onContactAdmin: () => {},
    onClearHistory: () => {},
  })
  const [filter, setFilter] = useState('all')
  const setMessagesHeader = useSetMessagesHeader()
  const listRef = useRef(null)
  const listScrollRef = useRef(null)
  const desktop = useMediaQuery('(min-width: 1024px)')
  const isFiltering = Boolean(deferredQuery.trim())
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

  useLayoutEffect(() => {
    resetMessagesScroll()
    if (listScrollRef.current) {
      listScrollRef.current.scrollTop = 0
    }
  }, [])

  const { peerTyping, notifyTyping, stopTyping } = useConversationTyping(
    activeId && activeId !== ASSISTANT_ID ? activeId : null,
    user.id,
  )

  const [remoteSearchHits, setRemoteSearchHits] = useState([])

  useEffect(() => {
    const q = deferredQuery.trim()
    if (!searchOpen || q.length < 2) return undefined
    let cancelled = false
    const timer = window.setTimeout(() => {
      void dispatch(searchMessagesRemote(q))
        .unwrap()
        .then((hits) => {
          if (!cancelled) setRemoteSearchHits(hits || [])
        })
        .catch(() => {
          if (!cancelled) setRemoteSearchHits([])
        })
    }, 280)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [deferredQuery, dispatch, searchOpen])

  const remoteSearchConversationIds = useMemo(() => {
    if (!searchOpen || deferredQuery.trim().length < 2) return []
    return [...new Set(remoteSearchHits.map((hit) => hit.conversationId).filter(Boolean))]
  }, [deferredQuery, remoteSearchHits, searchOpen])

  const visible = useMemo(() => {
    const remoteIds = new Set(remoteSearchConversationIds)
    return conversations
      .filter((item) => {
        const archived = item.archivedBy?.includes(user.id)
        if (showArchived !== Boolean(archived)) return false
        if (!conversationMatchesFilter(item, filter, user.id)) return false
        if (!shouldShowConversationInList(item, user.id, activeId)) return false
        if (remoteIds.has(item.id)) return true
        return conversationMatchesQuery(item, user.id, deferredQuery)
      })
      .sort((left, right) => {
        // Opening a chat must not reorder the list; only new messages bump updatedAt.
        const pinDelta =
          Number(Boolean(right.pinnedBy?.includes(user.id))) -
          Number(Boolean(left.pinnedBy?.includes(user.id)))
        return pinDelta || new Date(right.lastMessageAt || right.updatedAt) - new Date(left.lastMessageAt || left.updatedAt)
      })
  }, [
    activeId,
    conversations,
    deferredQuery,
    filter,
    remoteSearchConversationIds,
    showArchived,
    user.id,
  ])

  const participantAvatarIds = useMemo(() => {
    const ids = new Set()
    for (const conversation of conversations) {
      for (const id of conversation.participantIds || []) {
        if (id) ids.add(id)
      }
    }
    return [...ids]
  }, [conversations])
  const avatarMap = useProfileAvatarMap(participantAvatarIds)

  const active = conversations.find((item) => item.id === activeId)
  const conversationHeader = useConversationHeaderModel(active, user.id, avatarMap)
  const attachments =
    activeId && activeId !== ASSISTANT_ID ? attachmentsByConversation[activeId] || [] : []
  function setAttachments(next) {
    if (!activeId || activeId === ASSISTANT_ID) return
    setAttachmentsByConversation((current) => ({
      ...current,
      [activeId]: typeof next === 'function' ? next(current[activeId] || []) : next || [],
    }))
  }
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
    return messageSuggestionsForConversation(state, conversation, user.id, peer.name, t)
  })

  function flashSentMessage(messageId) {
    if (!messageId) return
    setSentAnimationIds((current) =>
      current.includes(messageId) ? current : [...current, messageId],
    )
    window.setTimeout(() => {
      setSentAnimationIds((current) => current.filter((id) => id !== messageId))
    }, 920)
  }

  const formik = useFormik({
    initialValues: { text: '' },
    validate: (values) => {
      const errors = {}
      const text = values.text?.trim() || ''
      if (!text && !attachments.length) {
        errors.text = t('messages.requireContent')
      } else if (text.length > 2000) {
        errors.text = t('messages.tooLong')
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
      if (!trimmedText && !attachments.length) return

      helpers.setSubmitting(true)
      let attachmentPayload = null
      try {
        if (attachments.length) {
          const imageFiles = attachments.filter(isImageFile)
          const videoFiles = attachments.filter(isVideoFile)
          const otherFile = attachments.find((file) => !isImageFile(file) && !isVideoFile(file))

          if (imageFiles.length) {
            const urls = []
            await trackUpload(async (onProgress) => {
              for (let index = 0; index < imageFiles.length; index += 1) {
                const file = imageFiles[index]
                urls.push(
                  await storageService.uploadMessageImage(user.id, active.id, file, {
                    index,
                    onProgress: (update) =>
                      onProgress({
                        ...update,
                        fileIndex: index,
                        fileCount: imageFiles.length,
                        fileName: file.name,
                      }),
                  }),
                )
              }
            })
            attachmentPayload = {
              name:
                imageFiles.length === 1
                  ? imageFiles[0].name
                  : `${imageFiles.length} photos`,
              size: imageFiles.reduce((sum, file) => sum + (file.size || 0), 0),
              type: imageFiles[0].type || 'image/jpeg',
              url: urls[0],
              ...(urls.length > 1 ? { urls } : {}),
            }
          } else if (videoFiles.length) {
            const file = videoFiles[0]
            const uploaded = await trackUpload(async (onProgress) =>
              storageService.uploadMessageVideo(user.id, active.id, file, { onProgress }),
            )
            attachmentPayload = {
              kind: 'video',
              name: file.name,
              size: file.size,
              type: file.type || 'video/mp4',
              url: uploaded,
            }
          } else if (otherFile) {
            const uploaded = await trackUpload(async (onProgress) =>
              storageService.uploadMessageFile(user.id, active.id, otherFile, { onProgress }),
            )
            attachmentPayload = {
              name: otherFile.name,
              size: otherFile.size,
              type: otherFile.type || 'application/octet-stream',
              url: uploaded,
            }
          }
        }
      } catch (error) {
        dispatch(
          addToast({
            title: t('messages.imageFailedTitle'),
            message: error?.message || t('messages.imageFailed'),
            tone: 'error',
          }),
        )
        helpers.setSubmitting(false)
        return
      }

      const previousCount = active.messages.length
      const sentAction = dispatch(
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
      flashSentMessage(sentAction.payload.message.id)
      const updated = store
        .getState()
        .communications.conversations.find((item) => item.id === active.id)
      if (!updated || updated.messages.length === previousCount) {
        dispatch(
          addToast({
            title: t('messages.sendFailedTitle'),
            message: t('messages.sendFailed'),
            tone: 'error',
          }),
        )
        helpers.setSubmitting(false)
        return
      }
      setAttachments([])
      setReplyToId(null)
      setReplyToContextId(null)
      dispatch(saveConversationDraft({ id: active.id, userId: user.id, text: '' }))
      helpers.resetForm({ values: { text: '' } })
      helpers.setSubmitting(false)
    },
  })

  const composerConversationIdRef = useRef(null)

  useEffect(() => {
    if (!active?.id || assistantActive) return
    if (composerConversationIdRef.current === active.id) return
    composerConversationIdRef.current = active.id
    formik.setValues({ text: active.drafts?.[user.id] || '' })
    setEditingId(null)
  }, [active?.id, assistantActive, user.id])

  useEffect(() => {
    if (!active?.id || assistantActive) {
      composerConversationIdRef.current = null
    }
  }, [active?.id, assistantActive])

  useEffect(() => {
    const replyContext = searchParams.get('replyContext')
    if (!replyContext || !active?.id || active.id !== requestedConversation) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- consomme un paramètre d'URL (système externe : le routeur)
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
    if (!participantIds.length) return undefined
    dispatch(loadParticipantProfiles(participantIds))
    const timer = setInterval(() => {
      dispatch(loadParticipantProfiles(participantIds))
    }, 60_000)
    return () => clearInterval(timer)
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
    if (!active?.id) return
    dispatch(markConversationRead({ conversationId: active.id, userId: user.id }))
  }, [active?.id, dispatch, user.id])

  useEffect(() => {
    if (!active?.id || active.messagesLoading) return
    dispatch(loadConversationMessages(active.id))
  }, [active?.id, active?.lastMessageAt, active?.messagesLoading, dispatch])

  const inboxPreloadStarted = useRef(false)
  useEffect(() => {
    if (inboxPreloadStarted.current || !conversations.length) return
    inboxPreloadStarted.current = true
    const timer = window.setTimeout(() => {
      dispatch(preloadInboxMessages({ limit: 6 }))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [conversations.length, dispatch])

  function selectConversation(id) {
    setSearchParams({ conversation: id })
    setReplyToId(null)
    setReplyToContextId(null)
    composerConversationIdRef.current = null
    setQuery('')
    setSearchOpen(false)
  }

  function handleComposerFiles(files) {
    if (!files?.length) {
      setAttachments([])
      return
    }

    const list = Array.from(files)
    const imageFiles = list.filter(isImageFile)
    const videoFiles = list.filter(isVideoFile)
    const otherFiles = list.filter((file) => !isImageFile(file) && !isVideoFile(file))

    if (
      (imageFiles.length && (videoFiles.length || otherFiles.length)) ||
      (videoFiles.length && otherFiles.length)
    ) {
      dispatch(
        addToast({
          title: t('messages.mixedFilesTitle'),
          message: t('messages.mixedFiles'),
          tone: 'error',
        }),
      )
      return
    }

    if (videoFiles.length > 1) {
      dispatch(
        addToast({
          title: t('messages.maxVideosTitle'),
          message: t('messages.maxVideos'),
          tone: 'error',
        }),
      )
      setAttachments([videoFiles[0]])
      return
    }

    if (otherFiles.length) {
      setAttachments([otherFiles[0]])
      return
    }

    if (videoFiles.length) {
      setAttachments([videoFiles[0]])
      return
    }

    if (imageFiles.length > MAX_MESSAGE_IMAGES) {
      dispatch(
        addToast({
          title: t('messages.maxImagesTitle'),
          message: t('messages.maxImages', { count: MAX_MESSAGE_IMAGES }),
          tone: 'error',
        }),
      )
      setAttachments(imageFiles.slice(0, MAX_MESSAGE_IMAGES))
      return
    }

    setAttachments(imageFiles)
  }

  function handleShareContact(contact) {
    if (!active || blocked || !contact?.userId) return
    const attachment = buildContactAttachment(contact)
    if (!attachment) return
    const sentAction = dispatch(
      sendMessage({
        conversationId: active.id,
        senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        text: '',
        attachment,
      }),
    )
    const messageId = sentAction?.payload?.message?.id || sentAction?.payload?.id
    if (messageId) {
      setSentAnimationIds((ids) => [...ids, messageId])
      window.setTimeout(() => {
        setSentAnimationIds((ids) => ids.filter((id) => id !== messageId))
      }, 700)
    }
  }

  const returnToList = useCallback(() => {
    setSearchParams({})
  }, [setSearchParams])

  const getConversationRowActions = useCallback(
    (conversation) => ({
      archived: showArchived,
      blocked: conversation.blockedBy?.includes(user.id),
      suggestionsEnabled,
      onPin: () => dispatch(toggleConversationPin({ id: conversation.id, userId: user.id })),
      onMute: () => dispatch(toggleConversationMute({ id: conversation.id, userId: user.id })),
      onToggleSuggestions: () =>
        dispatch(
          updateAccountPreferences({
            userId: user.id,
            preferences: {
              messageSuggestionsEnabled: !suggestionsEnabled,
            },
          }),
        ),
      onArchive: () => {
        dispatch(
          showArchived
            ? restoreConversation({ id: conversation.id, userId: user.id })
            : archiveConversation({ id: conversation.id, userId: user.id }),
        )
        if (active?.id === conversation.id) returnToList()
      },
      onBlock: () => dispatch(toggleConversationBlock({ id: conversation.id, userId: user.id })),
    }),
    [active?.id, dispatch, returnToList, showArchived, suggestionsEnabled, user.id],
  )

  const toggleThreadSearch = useCallback(() => {
    setThreadSearchOpen((open) => {
      if (open) setThreadQuery('')
      return !open
    })
  }, [])

  const handleAssistantAdminComposeChange = useCallback((value) => {
    setAssistantAdminCompose(value)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset recherche fil à chaque changement de conversation
    setThreadSearchOpen(false)
    setThreadQuery('')
  }, [activeId])

  useLayoutEffect(() => {
    if (!activeId) {
      setMessagesHeader({
        content: (
          <MessagesListHeader
            t={t}
            conversations={conversations}
            filter={filter}
            onFilterChange={(next) => {
              setFilter(next)
              setShowArchived(false)
            }}
            showArchived={showArchived}
            onToggleArchived={() => setShowArchived((value) => !value)}
            searchOpen={searchOpen}
            onSearchOpen={() => setSearchOpen(true)}
            activeHumanConversations={activeHumanConversations}
            unreadMessagesCount={unreadMessagesCount}
            userId={user.id}
          />
        ),
        variant: 'list',
      })
    } else if (assistantActive) {
      setMessagesHeader({
        content: (
          <MessagesAssistantHeader
            t={t}
            showBack={!desktop}
            onBack={returnToList}
            onContactAdmin={() => assistantHeaderActionsRef.current.onContactAdmin?.()}
            onClearHistory={() => assistantHeaderActionsRef.current.onClearHistory?.()}
            adminComposeDisabled={!user || assistantAdminCompose}
          />
        ),
        variant: 'assistant',
      })
    } else if (active && !invalidConversation) {
      setMessagesHeader({
        content: (
          <MessagesThreadHeader
            t={t}
            active={active}
            relatedPreview={conversationHeader.relatedPreview}
            peer={conversationHeader.peer}
            peerAvatarSrc={conversationHeader.peerAvatarSrc}
            peerOnline={conversationHeader.peerOnline}
            peerTyping={peerTyping}
            pinned={conversationHeader.pinned}
            muted={conversationHeader.muted}
            blocked={blocked}
            archived={showArchived}
            suggestionsEnabled={suggestionsEnabled}
            showRelatedContext={conversationHeader.showRelatedContext}
            threadSearchOpen={threadSearchOpen}
            onToggleThreadSearch={toggleThreadSearch}
            onBack={returnToList}
            onPin={() => dispatch(toggleConversationPin({ id: active.id, userId: user.id }))}
            onMute={() => dispatch(toggleConversationMute({ id: active.id, userId: user.id }))}
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
            onArchive={() => {
              dispatch(
                showArchived
                  ? restoreConversation({ id: active.id, userId: user.id })
                  : archiveConversation({ id: active.id, userId: user.id }),
              )
              returnToList()
            }}
            onBlock={() => dispatch(toggleConversationBlock({ id: active.id, userId: user.id }))}
          />
        ),
        variant: 'thread',
      })
    } else {
      setMessagesHeader(null)
    }
  }, [
    active,
    activeId,
    assistantActive,
    assistantAdminCompose,
    blocked,
    conversationHeader.peer,
    conversationHeader.peerAvatarSrc,
    conversationHeader.peerOnline,
    conversationHeader.pinned,
    conversationHeader.muted,
    conversationHeader.relatedPreview,
    conversationHeader.showRelatedContext,
    conversations,
    desktop,
    dispatch,
    filter,
    invalidConversation,
    peerTyping,
    returnToList,
    searchOpen,
    setMessagesHeader,
    showArchived,
    suggestionsEnabled,
    t,
    threadSearchOpen,
    toggleThreadSearch,
    unreadMessagesCount,
    user.id,
    activeHumanConversations,
  ])

  useLayoutEffect(() => {
    return () => setMessagesHeader(null)
  }, [setMessagesHeader])

  function closeSearch() {
    setQuery('')
    setSearchOpen(false)
  }

  function retryMessage(message) {
    if (!active || blocked || !message?.id) return
    dispatch(
      resendMessage({
        conversationId: active.id,
        messageId: message.id,
      }),
    )
  }

  const mobileThread = Boolean(activeId) && !desktop

  return (
      <div
        className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden overscroll-none bg-transparent"
        data-testid="messages-viewport"
      >
      <div
        className={
          mobileThread
            ? 'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent max-lg:rounded-none'
            : integratedAssistant
              ? 'mx-auto grid h-full min-h-0 w-full min-w-0 overflow-hidden rounded-t-[2rem] bg-transparent max-lg:rounded-none lg:grid-cols-[25rem_minmax(0,1fr)]'
              : activeId
                ? 'grid h-full min-h-0 w-full min-w-0 overflow-hidden rounded-t-[2rem] bg-transparent max-lg:rounded-none lg:grid-cols-[25rem_minmax(0,1fr)]'
                : 'mx-auto h-full min-h-0 w-full min-w-0 max-w-5xl overflow-hidden rounded-t-[2rem] bg-transparent max-lg:rounded-none'
        }
      >
        <aside
          className={`${activeId ? 'hidden lg:flex' : 'flex'} relative z-30 h-full min-h-0 min-w-0 flex-col overflow-hidden bg-transparent lg:w-[25rem] lg:max-w-[25rem] ${
            activeId ? 'lg:shadow-[12px_0_35px_rgb(15_23_42/0.06)]' : ''
          }`}
          data-testid="messages-list"
        >
          {searchOpen ? (
            <div
              className="messages-floating-layer absolute inset-0 z-50 overflow-hidden"
              data-testid="messages-search-layer"
            >
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]"
                aria-label={t("messages.closeSearch")}
                onClick={closeSearch}
              />
              <div
                className="messages-floating-panel panel-pop absolute inset-x-3 top-[max(0.75rem,calc(env(safe-area-inset-top)+0.75rem))] flex max-h-[min(72dvh,calc(100%-env(safe-area-inset-bottom)-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-float)] backdrop-blur-xl sm:inset-x-4 lg:top-3"
                role="search"
              >
                <div className="shrink-0 border-b border-[var(--app-border)]/60 p-3 sm:p-3.5">
                  <div className="flex min-h-12 items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] px-3">
                    <FiSearch className="shrink-0 text-[var(--app-text-muted)]" />
                    <input
                      autoFocus
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t("messages.searchPlaceholder")}
                      aria-label={t("messages.searchPlaceholder")}
                    />
                    <button
                      type="button"
                      className="grid size-9 place-items-center rounded-xl bg-[var(--app-surface)] shadow-sm"
                      onClick={closeSearch}
                      aria-label={t("messages.closeSearch")}
                    >
                      <FiX />
                    </button>
                  </div>
                </div>
                <div
                  ref={listRef}
                  className="scrollbar-hidden min-h-0 flex-1 overscroll-contain overflow-y-auto bg-transparent px-0 pb-2 pt-1"
                  style={{ maxHeight: 'min(56dvh, 28rem)' }}
                >
                  <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold tracking-wide text-[var(--app-text-faint)]">
                    {isFiltering ? t("messages.resultsCount", { count: visible.length }) : t("messages.conversations")}
                  </p>
                  {visible.map((conversation, index) => (
                    <ConversationRow
                      key={conversation.id}
                      active={active?.id === conversation.id}
                      avatarMap={avatarMap}
                      conversation={conversation}
                      divided={index < visible.length - 1}
                      showOnlineDot
                      userId={user.id}
                      onClick={() => selectConversation(conversation.id)}
                      {...getConversationRowActions(conversation)}
                    />
                  ))}
                  {isFiltering && !visible.length ? (
                    <p className="p-6 text-center text-sm text-[var(--app-text-faint)]">
                      {t("messages.noMatch")}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            ref={listScrollRef}
            data-testid="messages-list-scroll"
            className="scrollbar-hidden h-full overscroll-contain overflow-y-auto bg-transparent px-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
          >
            <div className="pb-1">
              <ConversationRow
                active={assistantActive}
                assistant
                onClick={() => selectConversation(ASSISTANT_ID)}
              />
            </div>
            {visible.length || showArchived || filter !== 'all' ? (
              <p className="px-2.5 pb-1 pt-3 text-[10px] font-semibold tracking-wide text-[var(--app-text-faint)]">
                {t('messages.yourConversations')}
              </p>
            ) : null}
            <div className="flex flex-col">
            {visible.map((conversation, index) => (
              <ConversationRow
                key={conversation.id}
                active={active?.id === conversation.id}
                avatarMap={avatarMap}
                conversation={conversation}
                divided={index < visible.length - 1}
                showOnlineDot
                userId={user.id}
                onClick={() => selectConversation(conversation.id)}
                {...getConversationRowActions(conversation)}
              />
            ))}
            </div>
            {!visible.length && filter === 'all' && !showArchived ? (
              <MessagesEmptyState />
            ) : !visible.length && filter !== 'all' ? (
              <p className="p-6 text-center text-sm text-[var(--app-text-faint)]">
                {filter === 'pinned'
                  ? t('messages.noPinned')
                  : filter === 'unread'
                    ? t('messages.noUnread')
                    : filter === 'transfer'
                      ? messagesText(t, 'messages.noTransferChats')
                      : filter === 'p2p'
                        ? messagesText(t, 'messages.noP2pChats')
                        : filter === 'support'
                          ? messagesText(t, 'messages.noSupportChats')
                          : t('messages.noUnread')}
              </p>
            ) : null}
          </div>
          </div>
        </aside>

        {activeId ? (
          <section
            className="flex h-full min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden bg-transparent"
            data-testid="message-thread"
          >
            {assistantActive ? (
              <AiAssistantPanel
                userId={user.id}
                headerActionsRef={assistantHeaderActionsRef}
                onAdminComposeChange={handleAssistantAdminComposeChange}
              />
            ) : invalidConversation ? (
              <ConversationNotFound onBack={returnToList} />
            ) : active ? (
              <ConversationPanel
                active={active}
                avatarMap={avatarMap}
                messagesLoading={Boolean(active.messagesLoading)}
                messagesLoadingOlder={Boolean(active.messagesLoadingOlder)}
                hasOlderMessages={Boolean(active.hasOlderMessages)}
                onLoadOlder={() => dispatch(loadOlderConversationMessages(active.id))}
                attachments={attachments}
                uploadProgress={uploadProgress}
                blocked={blocked}
                formik={formik}
                threadSearchOpen={threadSearchOpen}
                threadQuery={threadQuery}
                onThreadQueryChange={setThreadQuery}
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
                onFile={handleComposerFiles}
                onDelete={(messageId) => setPendingDeleteId(messageId)}
                onEdit={(message) => {
                  formik.setFieldValue('text', message.text)
                  setEditingId(message.id)
                  setReplyToId(null)
                  setReplyToContextId(null)
                }}
                onCopy={async (message, displayText) => {
                  const text = String(displayText ?? message.text ?? '').trim()
                  if (!text) return
                  let copied = false
                  if (navigator.clipboard?.writeText) {
                    try {
                      await navigator.clipboard.writeText(text)
                      copied = true
                    } catch {
                      copied = false
                    }
                  }
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
                            title: t('messages.copiedTitle'),
                            message: t('messages.copied'),
                            tone: 'success',
                          }
                        : {
                            title: t('messages.copyFailedTitle'),
                            message: t('messages.copyFailed'),
                            tone: 'error',
                          },
                    ),
                  )
                }}
                onReport={({ conversationId, message, reason, evidenceUrl }) => {
                  const before = store.getState().communications.messageReports?.length || 0
                  dispatch(
                    reportMessage({
                      conversationId,
                      messageId: message.id,
                      senderId: message.senderId,
                      reporterId: user.id,
                      reason,
                      evidenceUrl,
                    }),
                  )
                  const after = store.getState().communications.messageReports?.length || 0
                  dispatch(
                    addToast(
                      after > before
                        ? {
                            title: t('messages.reportToastTitle'),
                            message: t('messages.reportToastBody'),
                            tone: 'success',
                          }
                        : {
                            title: t('toasts.alreadyReported'),
                            message: t('toasts.alreadyReportedBody'),
                            tone: 'info',
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
                suggestions={suggestions}
                editingId={editingId}
                onCancelEdit={() => {
                  setEditingId(null)
                  formik.setFieldValue('text', '')
                }}
                user={user}
                peerTyping={peerTyping}
                sentAnimationIds={sentAnimationIds}
                onTyping={notifyTyping}
                onStopTyping={stopTyping}
                onShareContact={handleShareContact}
              />
            ) : null}
          </section>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title={t("messages.deleteConfirmTitle")}
        description={messagesText(t, 'messages.deleteConfirmDescription')}
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
