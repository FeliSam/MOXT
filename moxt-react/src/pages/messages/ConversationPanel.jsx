import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  FiArchive,
  FiArrowDown,
  FiBell,
  FiBellOff,
  FiEye,
  FiEyeOff,
  FiFile,
  FiPaperclip,
  FiPlus,
  FiSearch,
  FiSlash,
  FiStar,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { LuEllipsisVertical, LuExternalLink, LuSearch, LuX } from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { syncKeyboardInsetAfterBlur, useMessageComposerBottom } from '../../hooks/useKeyboardInset'
import { useLanguage } from '../../contexts/useLanguage'
import { UploadProgress } from '../../components/ui/UploadProgress'
import { shortenFileName } from '../../services/uploadProgress'
import { EntityAvatar } from '../../features/account/EntityAvatar'
import { ContactSharePicker } from '../../features/communications/ContactSharePicker'
import { getConversationPeer } from '../../features/communications/conversationDisplay'
import {
  buildConversationTimeline,
  buildContextPreview,
  contextHasMessages,
  findRelatedContextById,
  normalizeRelatedContexts,
} from '../../features/communications/conversationTimeline'
import { messagesText } from '../../features/communications/messagesI18n'
import {
  shouldAutoTranslate,
  translateToLanguage,
  languageLabel,
} from '../../features/communications/messageTranslate'
import { canAutoTranslateMessages, canShowAdminTranslateIcon } from '../../config/messageTranslateFlags'
import { resolveRelatedSnapshot } from '../../features/communications/relatedSnapshot'
import { addToast } from '../../features/ui/uiSlice'
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
import { conversationMessageCount, isMessageFromUser, messageHasReactions, messageSearchHaystack } from './messageUtils'
import { RelatedContentPreview } from './RelatedContentPreview'
import { TypingDots, TypingIndicator } from './TypingIndicator'
import { MessageSendButton } from './MessageSendButton'

const HEADER_ICON_STROKE = 1.48

function matchesThreadQuery(messageOrText, query) {
  if (!query.trim()) return true
  const normalized = query.trim().toLowerCase()
  if (typeof messageOrText === 'string') {
    return messageOrText.toLowerCase().includes(normalized)
  }
  return messageSearchHaystack(messageOrText).includes(normalized)
}

export function ConversationPanel({
  active,
  attachments = [],
  uploadProgress = null,
  avatarMap = {},
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
  onShareContact,
  onMute,
  onPin,
  onDelete,
  onEdit,
  onReact,
  onReply,
  onReplyToContext,
  onRetry,
  onCopy,
  editingId,
  onCancelEdit,
  replyToId,
  replyToContextId,
  peerTyping = false,
  sentAnimationIds = [],
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
  const { t, language } = useLanguage()
  const dispatch = useDispatch()
  const peer = getConversationPeer(active, user.id)
  const peerOnline = useSelector((state) => (peer?.id ? Boolean(state.presence.online[peer.id]) : false))
  const liveEntry = peer?.id ? avatarMap[peer.id] : undefined
  const peerAvatarSrc =
    liveEntry !== undefined ? liveEntry.avatarUrl || null : peer?.avatarUrl || null
  const relatedPreview = useSelector((state) => resolveRelatedSnapshot(state, active))
  // Le bandeau "pourquoi cette conversation" ne doit apparaître que si un
  // message a effectivement été échangé à propos du contexte le plus récent
  // — sinon un simple clic sur "Contacter" (sans rien écrire) l'affiche à tort.
  const latestContext = useMemo(() => {
    const contexts = normalizeRelatedContexts(active)
    if (!contexts.length) return null
    return contexts.slice().sort((a, b) => new Date(a.introducedAt) - new Date(b.introducedAt)).at(-1)
  }, [active])
  const showRelatedContext =
    Boolean(relatedPreview?.path) &&
    (latestContext ? contextHasMessages(latestContext, active) : active.messages?.length > 0)
  // Horodatage de secours stable (calculé une seule fois, pas à chaque rendu)
  // pour l'entrée de contexte synthétique quand ni createdAt ni updatedAt n'existent.
  const [fallbackTimelineAt] = useState(() => Date.now())
  const timeline = useMemo(() => {
    const items = buildConversationTimeline(active, user.id)
    // Repli légitime uniquement quand aucune donnée de contexte n'existe du tout
    // (ni relatedContexts, ni champs legacy) mais que le résolveur live en trouve
    // une — jamais pour recontourner le filtre "a des messages" ci-dessus.
    if (normalizeRelatedContexts(active).length > 0) return items
    if (!relatedPreview?.path) return items
    if (!(active.messages?.length > 0)) return items
    return [
      {
        kind: 'related',
        id: `CTX-resolved-${active.relatedId || active.id}`,
        at: new Date(active.createdAt || active.updatedAt || fallbackTimelineAt),
        preview: relatedPreview,
      },
      ...items,
    ]
  }, [active, relatedPreview, user.id, fallbackTimelineAt])
  const messageListRef = useRef(null)
  const composerRef = useRef(null)
  const composerShellRef = useRef(null)
  const threadHeaderRef = useRef(null)
  const threadScrollYRef = useRef(0)
  const stickToBottomRef = useRef(true)
  const forceStickUntilRef = useRef(0)
  const loadOlderAnchorRef = useRef(null)
  const loadingOlderRequestedRef = useRef(false)
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState([])
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
  const [composerOffset, setComposerOffset] = useState(120)
  const composerBottomPx = useMessageComposerBottom()
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [contactPickerOpen, setContactPickerOpen] = useState(false)
  const [translationById, setTranslationById] = useState({})
  const [translatingId, setTranslatingId] = useState(null)
  const autoTranslateQueued = useRef(new Set())
  const translationScopeIdRef = useRef(active?.id)

  useEffect(() => {
    if (translationScopeIdRef.current === active?.id) return
    translationScopeIdRef.current = active?.id
    setTranslationById({})
    setTranslatingId(null)
    autoTranslateQueued.current.clear()
  }, [active?.id])

  useEffect(() => {
    if (!canAutoTranslateMessages(user)) return undefined

    const pending = active.messages.filter((message) => {
      if (isMessageFromUser(message, user.id)) return false
      const text = String(message?.text || '').trim()
      if (!shouldAutoTranslate(text, language)) return false
      if (autoTranslateQueued.current.has(message.id)) return false
      if (translationById[message.id]?.translatedText) return false
      return true
    }).slice(0, 5)

    if (!pending.length) return undefined

    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        for (const message of pending) {
          if (cancelled) break
          autoTranslateQueued.current.add(message.id)
          setTranslatingId(message.id)
          try {
            const result = await translateToLanguage({
              messageId: message.id,
              text: message.text,
              targetLang: language,
            })
            if (cancelled) break
            setTranslationById((prev) => {
              if (prev[message.id]?.translatedText) return prev
              return {
                ...prev,
                [message.id]: {
                  targetLang: result.targetLang,
                  translatedText: result.translatedText,
                  showOriginal: false,
                },
              }
            })
          } catch {
            // Échec silencieux — original conservé
          } finally {
            autoTranslateQueued.current.delete(message.id)
            if (!cancelled) {
              setTranslatingId((current) => (current === message.id ? null : current))
            }
          }
        }
      })()
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [active.messages, active?.id, language, translationById, user])

  function handleToggleTranslationOriginal(messageId) {
    setTranslationById((prev) => {
      const entry = prev[messageId]
      if (!entry) return prev
      return {
        ...prev,
        [messageId]: { ...entry, showOriginal: !entry.showOriginal },
      }
    })
  }

  async function handleTranslateMessage(message, targetLang) {
    if (!canShowAdminTranslateIcon(user)) return
    const text = String(message?.text || '').trim()
    if (text.length < 3) return
    if (translatingId === message.id) return

    const lang = String(targetLang || language || '').toLowerCase()
    if (!lang) return

    setTranslatingId(message.id)
    try {
      const result = await translateToLanguage({
        messageId: message.id,
        text,
        targetLang: lang,
      })
      setTranslationById((prev) => ({
        ...prev,
        [message.id]: {
          targetLang: result.targetLang,
          translatedText: result.translatedText,
          showOriginal: false,
        },
      }))
      dispatch(
        addToast({
          type: 'success',
          message: messagesText(t, 'messages.translatedInto', {
            language: languageLabel(result.targetLang),
          }),
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: messagesText(t, 'messages.translateFailedTitle'),
          message:
            err instanceof Error
              ? err.message
              : messagesText(t, 'messages.translateFailed'),
        }),
      )
    } finally {
      setTranslatingId((current) => (current === message.id ? null : current))
    }
  }
  const fileInputRef = useRef(null)
  const [threadHeaderVisible, setThreadHeaderVisible] = useState(true)
  const [threadHeaderOffset, setThreadHeaderOffset] = useState(68)
  const [initialUnreadCount] = useState(() => active.unreadBy?.[user.id] || 0)
  const firstUnreadIndex = useMemo(
    () => firstUnreadMessageIndex(active.messages, user.id, initialUnreadCount),
    [active.messages, initialUnreadCount, user.id],
  )
  const hasDraft = Boolean(formik.values.text.trim())
  const canSend = !blocked && (hasDraft || attachments.length)
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
      return matchesThreadQuery(item.message, normalized)
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

  function forceStickToBottom(durationMs = 1000) {
    stickToBottomRef.current = true
    forceStickUntilRef.current = performance.now() + durationMs
    stickToBottom('auto')
  }

  // Force bottom when opening a conversation (before paint). Must not wait for the
  // later useEffect — otherwise a prior "scrolled up" stick=false skips the open stick
  // and the reused scroll node keeps a stale offset.
  // Native WebViews need extra passes: layout/padding (header + composer) settle late.
  useLayoutEffect(() => {
    forceStickToBottom(1200)
    const rafIds = []
    const schedule = (fn) => {
      const id = requestAnimationFrame(fn)
      rafIds.push(id)
    }
    schedule(() => {
      setThreadHeaderVisible(true)
      stickToBottom('auto')
      schedule(() => stickToBottom('auto'))
    })
    const timers = [50, 150, 350, 700].map((ms) =>
      setTimeout(() => {
        stickToBottomRef.current = true
        stickToBottom('auto')
      }, ms),
    )
    return () => {
      rafIds.forEach(cancelAnimationFrame)
      timers.forEach(clearTimeout)
    }
  }, [active.id])

  useLayoutEffect(() => {
    const header = threadHeaderRef.current
    if (!header || typeof ResizeObserver === 'undefined') return undefined
    const sync = () => {
      const next = Math.ceil(header.getBoundingClientRect().height)
      setThreadHeaderOffset((prev) => (prev === next ? prev : next))
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(header)
    return () => observer.disconnect()
  }, [showRelatedContext, peer?.name, peerOnline, peerTyping])

  // Stay pinned while content height changes (messages, draft, loading ↔ empty).
  useLayoutEffect(() => {
    if (loadOlderAnchorRef.current) return
    if (!stickToBottomRef.current && performance.now() >= forceStickUntilRef.current) return
    stickToBottomRef.current = true
    stickToBottom('auto')
    const frame = requestAnimationFrame(() => stickToBottom('auto'))
    return () => cancelAnimationFrame(frame)
  }, [
    active.messages.length,
    active.relatedContexts?.length,
    active.messagesLoaded,
    formik.values.text,
    messagesLoading,
    composerOffset,
    threadHeaderOffset,
  ])

  // Preserve viewport when older messages are prepended.
  useLayoutEffect(() => {
    const snapshot = loadOlderAnchorRef.current
    const messageList = messageListRef.current
    if (!snapshot || !messageList || messagesLoadingOlder) return
    messageList.scrollTop = snapshot.top + (messageList.scrollHeight - snapshot.height)
    loadOlderAnchorRef.current = null
    loadingOlderRequestedRef.current = false
  }, [active.messages.length, messagesLoadingOlder])

  useEffect(() => {
    if (!messagesLoadingOlder) {
      loadingOlderRequestedRef.current = false
    }
  }, [messagesLoadingOlder])

  function requestLoadOlder() {
    if (!hasOlderMessages || messagesLoadingOlder || loadingOlderRequestedRef.current) return
    const messageList = messageListRef.current
    if (!messageList) return
    loadingOlderRequestedRef.current = true
    stickToBottomRef.current = false
    loadOlderAnchorRef.current = {
      height: messageList.scrollHeight,
      top: messageList.scrollTop,
    }
    onLoadOlder?.()
  }

  useLayoutEffect(() => {
    const el = composerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [formik.values.text])

  useLayoutEffect(() => {
    const shell = composerShellRef.current
    if (!shell || typeof ResizeObserver === 'undefined') return
    const sync = () => {
      const next = Math.ceil(shell.getBoundingClientRect().height)
      setComposerOffset((prev) => (prev === next ? prev : next))
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(shell)
    return () => observer.disconnect()
  }, [
    blocked,
    suggestionsEnabled,
    suggestions.length,
    attachments?.length,
    replyToId,
    replyToContextId,
    editingId,
    formik.values.text,
  ])

  const wasSubmittingRef = useRef(false)
  useEffect(() => {
    if (wasSubmittingRef.current && !formik.isSubmitting && !blocked) {
      composerRef.current?.focus({ preventScroll: true })
    }
    wasSubmittingRef.current = formik.isSubmitting
  }, [formik.isSubmitting, blocked])

  useEffect(() => {
    const messageList = messageListRef.current
    if (!messageList) return
    threadScrollYRef.current = messageList.scrollTop
    function handleScroll() {
      const distanceFromBottom =
        messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight
      const forcing = performance.now() < forceStickUntilRef.current
      if (forcing) {
        stickToBottomRef.current = true
        setShowScrollFab(false)
      } else {
        stickToBottomRef.current = distanceFromBottom < 120
        setShowScrollFab(distanceFromBottom > 120)
      }
      if (!forcing && messageList.scrollTop < 80) {
        requestLoadOlder()
      }

      const y = messageList.scrollTop
      const delta = y - threadScrollYRef.current
      threadScrollYRef.current = y
      if (threadSearchOpen || distanceFromBottom < 120 || y <= 8) {
        setThreadHeaderVisible(true)
        return
      }
      if (delta > 8) setThreadHeaderVisible(false)
      else if (delta < -8) setThreadHeaderVisible(true)
    }
    handleScroll()
    messageList.addEventListener('scroll', handleScroll, { passive: true })
    return () => messageList.removeEventListener('scroll', handleScroll)
    // requestLoadOlder is stable enough for this scroll subscription (deps cover its gates).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll listener rebinds on conversation / load flags
  }, [active.id, hasOlderMessages, messagesLoadingOlder, threadSearchOpen])

  useEffect(() => {
    const urls = (attachments || []).map((file) =>
      file?.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gestion de ressource externe (URLs d'objets, nettoyées au retour)
    setAttachmentPreviewUrls(urls)
    return () => {
      urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [attachments])

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
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden overscroll-none bg-transparent">
      <div className="message-thread-canvas relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <header
          ref={threadHeaderRef}
          className={`message-thread-header absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-1.5 bg-transparent px-3 py-2.5 backdrop-blur-md transition-transform duration-300 ease-out sm:gap-2 sm:px-4 lg:px-5 ${
            threadHeaderVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
          }`}
        >
          <div className="header-brand-chip flex h-[3.004375rem] min-w-0 max-w-[calc(100%-7rem)] flex-1 items-center gap-2 rounded-full bg-transparent px-1.5 pr-2.5 sm:h-[3.3048125rem] sm:max-w-[calc(100%-7.75rem)] sm:gap-2.5 sm:pr-3">
            <button
              type="button"
              className="header-action-btn relative grid shrink-0 !size-[2.185rem] !border-0 !bg-transparent sm:!size-[2.458125rem] lg:hidden"
              onClick={onBack}
              aria-label={t('messages.closeConversation')}
            >
              <LuX className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
            </button>
            <Link to={peer?.id ? `/users/${peer.id}/publications` : '#'} className="relative shrink-0">
              <EntityAvatar
                name={peer.name}
                src={peerAvatarSrc}
                size="md"
                shape="user"
                ring={false}
                className="!size-[2.185rem] !rounded-full shadow-sm sm:!size-[2.458125rem]"
                alt={peer.name}
              />
              {peerOnline ? (
                <span
                  className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--app-surface)] bg-emerald-500"
                  aria-hidden="true"
                />
              ) : null}
            </Link>
            <div className="min-w-0">
              <Link
                to={peer?.id ? `/users/${peer.id}/publications` : '#'}
                className="flex min-w-0 items-center gap-1.5 hover:underline"
              >
                <VerifiedDisplayName
                  as="h2"
                  name={peer.name}
                  verified={Boolean(peer.verified)}
                  iconSize="sm"
                  className="truncate text-sm font-black leading-none tracking-tight text-[var(--app-text)] sm:text-[0.9375rem]"
                />
                {pinned ? <FiStar className="size-3.5 shrink-0 text-amber-500" aria-label={t("messages.pinnedAria")} /> : null}
                {muted ? <FiBellOff className="size-3.5 shrink-0 text-[var(--app-text-faint)]" aria-label={t("messages.mutedAria")} /> : null}
              </Link>
              <div className="mt-0.5 flex min-w-0 items-center">
                {peerTyping ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold leading-tight text-brand-700 dark:text-brand-300">
                    {t('messages.typing')}
                    <TypingDots />
                  </span>
                ) : peerOnline ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold leading-tight text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    {t('messages.activity.online')}
                  </span>
                ) : (
                  <span className="truncate text-[11px] leading-tight text-[var(--app-text-muted)]">
                    {peerActivityLabel(peer.lastActiveAt, t)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="ml-auto flex h-[3.004375rem] shrink-0 items-center gap-1.5 sm:h-[3.3048125rem] [&_.header-action-btn]:bg-[var(--app-surface)]/87">
            <button
              type="button"
              className="header-action-btn relative grid"
              onClick={() => {
                setThreadSearchOpen((value) => !value)
                if (threadSearchOpen) setThreadQuery('')
                setThreadHeaderVisible(true)
              }}
              aria-label={threadSearchOpen ? t("messages.closeSearchInThread") : t("messages.searchInThread")}
              aria-pressed={threadSearchOpen}
            >
              <LuSearch className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
            </button>
            {showRelatedContext ? (
              <Link
                className="header-action-btn relative grid lg:hidden"
                to={active.relatedPath || relatedPreview.path}
                aria-label={t("messages.viewListing")}
              >
                <LuExternalLink className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
              </Link>
            ) : null}
            {showRelatedContext ? (
              <Link
                className="hidden h-[3.004375rem] shrink-0 items-center gap-1.5 rounded-full bg-[var(--app-surface)]/65 px-3 text-xs font-bold text-brand-700 backdrop-blur-md transition hover:bg-[var(--app-surface)]/80 sm:h-[3.3048125rem] lg:inline-flex dark:text-brand-300"
                to={active.relatedPath || relatedPreview.path}
              >
                Voir la fiche <LuExternalLink className="size-3.5" strokeWidth={HEADER_ICON_STROKE} />
              </Link>
            ) : null}
            <PopoverMenu
              ariaLabel={messagesText(t, 'messages.conversationOptionsAria')}
              trigger={
                <span className="header-action-btn relative grid cursor-pointer">
                  <LuEllipsisVertical className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
                </span>
              }
            >
              {peer?.id ? (
                <Link
                  to={`/users/${peer.id}/publications`}
                  role="menuitem"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
                >
                  <FiUser /> {t('messages.viewProfile')}
                </Link>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
                onClick={onPin}
              >
                <FiStar /> {pinned ? t("messages.unpin") : t("messages.pin")}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
                onClick={onMute}
              >
                {muted ? <FiBell /> : <FiBellOff />} {muted ? t("messages.unmute") : t("messages.mute")}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
                onClick={() => onToggleSuggestions?.()}
              >
                {suggestionsEnabled ? <FiEye /> : <FiEyeOff />}{' '}
                {suggestionsEnabled
                  ? messagesText(t, 'messages.hideSuggestions')
                  : messagesText(t, 'messages.showSuggestions')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--app-surface-muted)]"
                onClick={onArchive}
              >
                <FiArchive />{' '}
                {archived ? messagesText(t, 'messages.restore') : messagesText(t, 'messages.archive')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={onBlock}
              >
                <FiSlash /> {blocked ? t("messages.unblock") : t("messages.block")}
              </button>
            </PopoverMenu>
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 inset-y-0 -z-10 bg-[var(--app-surface-muted)]/89"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-full -z-10 h-8 bg-gradient-to-b from-[var(--app-surface-muted)]/89 to-transparent"
            aria-hidden="true"
          />
        </header>

      {threadSearchOpen ? (
        <div
          className="relative z-20 shrink-0 border-b border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/70 px-3 py-2 sm:px-4"
          style={{ paddingTop: `calc(${threadHeaderOffset}px + 0.35rem)` }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl bg-[var(--app-surface)] px-3 py-2">
            <FiSearch className="shrink-0 text-[var(--app-text-muted)]" />
            <input
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              value={threadQuery}
              onChange={(event) => setThreadQuery(event.target.value)}
              placeholder={t("messages.searchInConversation")}
              aria-label={t("messages.searchInConversation")}
            />
            {threadQuery ? (
              <button
                type="button"
                className="grid size-8 place-items-center rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]"
                onClick={() => setThreadQuery('')}
                aria-label={t("messages.clearSearch")}
              >
                <FiX />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ '--message-composer-offset': `${composerOffset}px` }}
      >
        <div
          ref={messageListRef}
          className="scrollbar-hidden h-full overscroll-contain overflow-y-auto bg-transparent px-3 sm:px-4"
          style={{
            paddingTop: threadSearchOpen
              ? '0.75rem'
              : `calc(${threadHeaderOffset}px + 0.35rem)`,
            paddingBottom: `calc(${composerOffset}px + 0.75rem)`,
          }}
          data-testid="message-scroll-region"
        >
          <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col">
            {active.archivedBy?.includes(user.id) ? (
              <div className="mb-3 rounded-xl bg-amber-50/90 px-4 py-2.5 text-center text-xs font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                {messagesText(t, 'messages.archivedBanner')}
              </div>
            ) : null}
            {blocked ? (
              <div className="mb-3 rounded-xl bg-red-50/90 px-4 py-2.5 text-center text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {messagesText(t, 'messages.blockedBanner')}
              </div>
            ) : null}
            {messagesLoading && active.messages?.length > 0 ? (
              <p className="sticky top-0 z-10 mb-3 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/95 px-3 py-1.5 text-center text-xs font-medium text-[var(--app-text-muted)] backdrop-blur-sm">
                {t('messages.syncing')}
              </p>
            ) : null}
            {messagesLoading && !active.messages?.length && messageCount > 0 ? (
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
                      onClick={requestLoadOlder}
                    >
                      {messagesLoadingOlder ? t('messages.loadingOlder') : t('messages.loadOlder')}
                    </button>
                  </div>
                ) : null}
                <MessageThreadStart />
                <MessageSecurityNotice />
                {messagesLoading && !active.messages?.length ? (
                  <p className="py-6 text-center text-xs font-medium text-[var(--app-text-faint)]">
                    {t('messages.syncing')}
                  </p>
                ) : null}
                {threadQuery.trim() && !filteredTimeline.length ? (
                  <p className="py-8 text-center text-sm text-[var(--app-text-faint)]">
                    {messagesText(t, 'messages.searchNoMatch')}
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
                        style={
                          openActionsId === message.id
                            ? undefined
                            : { contentVisibility: 'auto', containIntrinsicSize: 'auto 72px' }
                        }
                      >
                        {!mine ? (
                          <MessageAvatar
                            name={message.senderName}
                            avatarUrl={
                              peer?.id && String(message.senderId) === String(peer.id)
                                ? peerAvatarSrc
                                : undefined
                            }
                            hidden={groupedWithPrevious}
                          />
                        ) : null}
                        <MessageBubble
                          animateEnter={sentAnimationIds.includes(message.id)}
                          enterVariant={mine ? 'sent' : 'received'}
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
                          onCopy={onCopy}
                          onToggleTranslationOriginal={handleToggleTranslationOriginal}
                          onTranslate={
                            canShowAdminTranslateIcon(user) ? handleTranslateMessage : undefined
                          }
                          showTranslateIcon={canShowAdminTranslateIcon(user)}
                          translation={translationById[message.id] || null}
                          translating={translatingId === message.id}
                          autoTranslateEnabled={canAutoTranslateMessages(user)}
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
            style={{ bottom: `calc(${composerOffset}px + 0.75rem)` }}
            onClick={scrollToBottom}
            aria-label={t("messages.scrollToBottom")}
          >
            <FiArrowDown />
          </button>
        ) : null}

      <div
        ref={composerShellRef}
        className="message-composer-shell absolute inset-x-0 bottom-0 z-20 border-t-0 bg-transparent p-0 max-lg:bottom-auto"
        style={{ bottom: composerBottomPx }}
        data-testid="message-composer"
      >
        {!blocked && suggestionsEnabled && suggestions.length ? (
          <div
            className="message-suggestions scrollbar-hidden mx-auto mb-1.5 flex max-w-3xl gap-1 overflow-x-auto px-3 pt-3 sm:px-4 sm:pt-4"
            data-testid="message-suggestions"
          >
            <button
              type="button"
              onClick={() => onToggleSuggestions?.()}
              aria-label={messagesText(t, 'messages.hideSuggestions')}
              className="message-touch-target grid size-8 shrink-0 place-items-center rounded-full border border-[var(--app-border)]/45 bg-[var(--app-surface)] text-[var(--app-text-muted)] transition hover:border-[var(--app-accent)]/35 hover:text-[var(--app-accent)]"
            >
              <FiX />
            </button>
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
        <div
          className={`message-composer-dock relative px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom,0px))] ${
            !blocked && suggestionsEnabled && suggestions.length
              ? 'pt-1.5'
              : 'pt-3 sm:pt-4'
          }`}
        >
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 bg-[var(--app-surface-muted)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 -top-8 -z-10 h-8 bg-gradient-to-b from-transparent to-[var(--app-surface-muted)]"
            aria-hidden="true"
          />
        {attachments?.length ? (
          <div className="mx-auto mb-2 flex max-w-3xl flex-wrap items-center gap-2 rounded-xl border border-[var(--app-border)]/40 bg-transparent px-3 py-2 text-xs">
            {attachments.map((file, index) => {
              const previewUrl = attachmentPreviewUrls[index]
              return (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex min-w-0 items-center gap-2 rounded-lg bg-transparent px-2 py-1.5"
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="size-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <FiPaperclip className="shrink-0" />
                  )}
                  <span className="max-w-[7rem] truncate font-semibold sm:max-w-[10rem]" title={file.name}>
                    {shortenFileName(file.name, 22)}
                  </span>
                  <button
                    type="button"
                    className="message-touch-target shrink-0 rounded-lg px-2 py-1 font-bold text-[var(--app-accent)] hover:bg-[var(--app-surface-muted)]"
                    onClick={() => {
                      const next = attachments.filter((_, itemIndex) => itemIndex !== index)
                      onFile(next.length ? next : null)
                    }}
                    aria-label={t("messages.removeAttachment", { name: file.name })}
                  >
                    <FiX />
                  </button>
                </div>
              )
            })}
            <button
              type="button"
              className="message-touch-target ml-auto shrink-0 rounded-lg px-2 py-1 font-bold text-[var(--app-accent)] hover:bg-[var(--app-surface)]"
              onClick={() => onFile(null)}
              aria-label={t("messages.removeAllAttachments")}
            >
              {messagesText(t, 'messages.removeAllVisible')}
            </button>
          </div>
        ) : null}
        {uploadProgress?.active ||
        uploadProgress?.phase === 'done' ||
        uploadProgress?.phase === 'error' ? (
          <div className="mx-auto mb-2 max-w-3xl">
            <UploadProgress progress={uploadProgress} compact />
          </div>
        ) : null}
        {replyToContextId && replyContextPreview ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-brand-200/70 border-l-[3px] border-l-brand-500 bg-transparent px-3 py-2.5 text-xs">
            <span className="min-w-0">
              <span className="block font-bold text-[var(--app-accent)]">
                {messagesText(t, 'messages.replyToListingLabel')}
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
              aria-label={t("messages.cancelReplyListing")}
            >
              <FiX />
            </button>
          </div>
        ) : null}
        {replyToId ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-brand-200/70 border-l-[3px] border-l-brand-500 bg-transparent px-3 py-2.5 text-xs">
            <span className="min-w-0">
              <span className="block font-bold text-[var(--app-accent)]">
                {messagesText(t, 'messages.replyToMessage', {
                  name:
                    replyTarget?.senderName ||
                    messagesText(t, 'messages.replyToMessageFallback'),
                })}
              </span>
              <span className="block truncate text-[var(--app-text-muted)]">
                {replyTarget?.text || ''}
              </span>
            </span>
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-[var(--app-accent)] hover:bg-[var(--app-surface)]"
              onClick={() => onReply(null)}
              aria-label={t("messages.cancelReply")}
            >
              <FiX />
            </button>
          </div>
        ) : null}
        {editingId ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-amber-300/70 border-l-[3px] border-l-amber-500 bg-transparent px-3 py-2.5 text-xs">
            <span className="min-w-0">
              <span className="block font-bold text-amber-700 dark:text-amber-300">
                {messagesText(t, 'messages.editingTitle')}
              </span>
              <span className="block truncate text-[var(--app-text-muted)]">
                {messagesText(t, 'messages.editingHint')}
              </span>
            </span>
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-amber-700 hover:bg-[var(--app-surface)] dark:text-amber-300"
              onClick={() => onCancelEdit?.()}
              aria-label={t("messages.cancelEdit")}
            >
              <FiX />
            </button>
          </div>
        ) : null}
        <form
          className={`message-composer-form mx-auto flex max-w-3xl items-end gap-1.5 rounded-[1.2rem] border border-[var(--app-border)]/40 bg-[var(--app-surface)] p-1.5 ${
            canSend ? 'message-composer-form--ready' : ''
          } ${formik.isSubmitting ? 'message-composer-form--sending' : ''}`}
          onSubmit={formik.handleSubmit}
        >
          <div className="relative shrink-0">
            <button
              type="button"
              disabled={blocked}
              aria-expanded={attachMenuOpen}
              aria-label={t('messages.composerPlusAria')}
              className={`message-touch-target grid size-11 place-items-center rounded-xl border border-[var(--app-border)]/50 bg-transparent text-lg text-[var(--app-accent)] transition duration-300 hover:border-brand-200 ${
                attachMenuOpen ? 'rotate-45 bg-[var(--app-accent-soft)]' : ''
              }`}
              onClick={() => setAttachMenuOpen((open) => !open)}
            >
              <FiPlus aria-hidden="true" />
            </button>
            {attachMenuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20 cursor-default"
                  aria-label={t('messages.composerPlusClose')}
                  onClick={() => setAttachMenuOpen(false)}
                />
                <div
                  className="absolute bottom-[calc(100%+0.55rem)] left-0 z-30 grid min-w-[11.5rem] gap-1.5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--shadow-card)] animate-[composerPlusIn_220ms_ease-out]"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition hover:bg-[var(--app-accent-soft)]"
                    onClick={() => {
                      setAttachMenuOpen(false)
                      fileInputRef.current?.click()
                    }}
                  >
                    <span className="grid size-8 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                      <FiFile />
                    </span>
                    {t('messages.composerAttachFile')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition hover:bg-[var(--app-accent-soft)]"
                    onClick={() => {
                      setAttachMenuOpen(false)
                      setContactPickerOpen(true)
                    }}
                  >
                    <span className="grid size-8 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                      <FiUser />
                    </span>
                    {t('messages.composerAttachContact')}
                  </button>
                </div>
              </>
            ) : null}
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              multiple
              disabled={blocked}
              onChange={(event) => {
                const files = event.target.files
                onFile(files?.length ? Array.from(files) : null)
                event.target.value = ''
              }}
            />
          </div>
          <textarea
            ref={composerRef}
            className="max-h-28 min-h-9 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-xs leading-5 outline-none placeholder:text-[var(--app-text-faint)] sm:text-[13px] sm:leading-5"
            placeholder={blocked ? t("messages.blockedPlaceholder") : t("messages.writePlaceholder")}
            aria-label={t("messages.writeAria")}
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
              // Enter = send ; Shift+Enter = nouvelle ligne.
              if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                event.preventDefault()
                if (
                  !blocked &&
                  (formik.values.text.trim() || attachments.length) &&
                  !formik.isSubmitting
                ) {
                  formik.handleSubmit()
                }
                return
              }
              if (event.key === 'Tab') {
                event.preventDefault()
                const el = event.currentTarget
                const start = el.selectionStart ?? el.value.length
                const end = el.selectionEnd ?? el.value.length
                const next = `${el.value.slice(0, start)}\n${el.value.slice(end)}`
                formik.setFieldValue('text', next)
                onDraft(next)
                requestAnimationFrame(() => {
                  el.selectionStart = el.selectionEnd = start + 1
                })
              }
            }}
            onBlur={() => {
              syncKeyboardInsetAfterBlur()
            }}
          />
          <MessageSendButton
            ariaLabel={t('messages.send')}
            disabled={blocked || !canSend || formik.isSubmitting}
            ready={canSend && !formik.isSubmitting}
            sending={formik.isSubmitting}
          />
        </form>
        {showDraftHint || formik.values.text.length >= 1800 ? (
          <div className="mx-auto mt-2 flex max-w-3xl items-start justify-between gap-3 px-1">
            {showDraftHint ? (
              <span className="text-[10px] text-[var(--app-text-faint)]">
                {messagesText(t, 'messages.draftSaved')}
              </span>
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
      </div>
      </div>
      </div>
      <ContactSharePicker
        open={contactPickerOpen}
        userId={user?.id}
        onClose={() => setContactPickerOpen(false)}
        onSelect={(contact) => {
          setContactPickerOpen(false)
          onShareContact?.(contact)
        }}
      />
    </div>
  )
}
