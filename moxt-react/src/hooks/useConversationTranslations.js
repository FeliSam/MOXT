import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { canAutoTranslateMessages, canShowManualTranslate } from '../config/messageTranslateFlags'
import { messagesText } from '../features/communications/messagesI18n'
import {
  detectMessageLanguage,
  languageLabel,
  prefetchMessageTranslations,
  shouldOfferMessageTranslation,
  translateMessagesBatch,
  translateToLanguage,
} from '../features/communications/messageTranslate'
import { addToast } from '../features/ui/uiSlice'
import { isMessageFromUser } from '../pages/messages/messageUtils'

const AUTO_TRANSLATE_DEBOUNCE_MS = 300
const AUTO_TRANSLATE_CONCURRENCY = 3

export function useConversationTranslations({
  active,
  user,
  language,
  peerLanguage,
  scrollRootRef,
  t,
}) {
  const dispatch = useDispatch()
  const [translationById, setTranslationById] = useState({})
  const [translatingId, setTranslatingId] = useState(null)
  const autoTranslateQueued = useRef(new Set())
  const visibleMessageIds = useRef(new Set())
  const translationByIdRef = useRef(translationById)
  const translationScopeIdRef = useRef(active?.id)
  const observerRef = useRef(null)
  const autoTranslateTimerRef = useRef(null)
  const manualTranslateEnabled = canShowManualTranslate(user)
  const autoTranslateEnabled = canAutoTranslateMessages(user)

  useEffect(() => {
    translationByIdRef.current = translationById
  }, [translationById])

  const runAutoTranslate = useCallback(async () => {
    if (!autoTranslateEnabled) return

    const pending = active.messages.filter((message) => {
      if (isMessageFromUser(message, user.id)) return false
      if (!visibleMessageIds.current.has(message.id)) return false
      const text = String(message?.text || '').trim()
      if (!shouldOfferMessageTranslation({ text, readerLanguage: language, peerLanguage })) {
        return false
      }
      if (autoTranslateQueued.current.has(message.id)) return false
      if (translationByIdRef.current[message.id]?.translatedText) return false
      return true
    })

    if (!pending.length) return

    pending.forEach((message) => autoTranslateQueued.current.add(message.id))
    setTranslatingId(pending[0]?.id || null)

    try {
      const results = await translateMessagesBatch(
        pending.map((message) => ({
          messageId: message.id,
          text: message.text,
          targetLang: language,
          sourceLang: detectMessageLanguage(message.text),
        })),
        { concurrency: AUTO_TRANSLATE_CONCURRENCY },
      )

      if (!results.length) return

      setTranslationById((prev) => {
        const next = { ...prev }
        for (const row of results) {
          if (next[row.messageId]?.translatedText) continue
          next[row.messageId] = {
            targetLang: row.targetLang,
            translatedText: row.translatedText,
            showOriginal: false,
          }
        }
        return next
      })
    } catch {
      // Échec silencieux — original conservé
    } finally {
      pending.forEach((message) => autoTranslateQueued.current.delete(message.id))
      setTranslatingId(null)
    }
  }, [active.messages, autoTranslateEnabled, language, peerLanguage, user.id])

  const scheduleAutoTranslate = useCallback(() => {
    if (!autoTranslateEnabled) return
    if (autoTranslateTimerRef.current) window.clearTimeout(autoTranslateTimerRef.current)
    autoTranslateTimerRef.current = window.setTimeout(() => {
      autoTranslateTimerRef.current = null
      void runAutoTranslate()
    }, AUTO_TRANSLATE_DEBOUNCE_MS)
  }, [autoTranslateEnabled, runAutoTranslate])

  useEffect(() => {
    if (translationScopeIdRef.current === active?.id) return
    translationScopeIdRef.current = active?.id
    setTranslationById({})
    setTranslatingId(null)
    autoTranslateQueued.current.clear()
    visibleMessageIds.current.clear()
  }, [active?.id])

  useEffect(() => {
    if (!autoTranslateEnabled || !active?.messages?.length) return undefined
    let cancelled = false

    void (async () => {
      const ids = active.messages.map((message) => message.id)
      const prefetched = await prefetchMessageTranslations({
        messageIds: ids,
        targetLang: language,
      })
      if (cancelled || !Object.keys(prefetched).length) return
      setTranslationById((prev) => ({ ...prefetched, ...prev }))
    })()

    return () => {
      cancelled = true
    }
  }, [active?.id, active?.messages, autoTranslateEnabled, language])

  useEffect(() => {
    if (!autoTranslateEnabled) return undefined
    const root = scrollRootRef?.current
    if (!root || typeof IntersectionObserver === 'undefined') return undefined

    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let changed = false
        for (const entry of entries) {
          const messageId = entry.target.dataset.translateWatch
          if (!messageId) continue
          if (entry.isIntersecting) {
            if (!visibleMessageIds.current.has(messageId)) {
              visibleMessageIds.current.add(messageId)
              changed = true
            }
          } else if (visibleMessageIds.current.delete(messageId)) {
            changed = true
          }
        }
        if (changed) scheduleAutoTranslate()
      },
      { root, rootMargin: '120px 0px 160px 0px', threshold: 0.12 },
    )

    root.querySelectorAll('[data-translate-watch]').forEach((node) => {
      observerRef.current?.observe(node)
    })

    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [active?.messages, active?.id, autoTranslateEnabled, scheduleAutoTranslate, scrollRootRef])

  const registerMessageRow = useCallback(
    (message, node) => {
      if (!node) return
      if (!autoTranslateEnabled || isMessageFromUser(message, user.id)) {
        delete node.dataset.translateWatch
        return
      }
      const text = String(message?.text || '').trim()
      if (!shouldOfferMessageTranslation({ text, readerLanguage: language, peerLanguage })) {
        delete node.dataset.translateWatch
        return
      }

      node.dataset.translateWatch = message.id
      observerRef.current?.observe(node)
    },
    [autoTranslateEnabled, language, peerLanguage, user.id],
  )

  useEffect(
    () => () => {
      if (autoTranslateTimerRef.current) window.clearTimeout(autoTranslateTimerRef.current)
    },
    [],
  )

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

  function messageTranslateEnabled(message) {
    if (!manualTranslateEnabled || isMessageFromUser(message, user.id)) return false
    const text = String(message?.text || '').trim()
    if (text.length < 3) return false
    if (message.attachment?.reactionEmoji) return false
    return true
  }

  async function handleTranslateMessage(message, targetLang) {
    if (!manualTranslateEnabled) return
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
        sourceLang: detectMessageLanguage(text),
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

  return {
    translationById,
    translatingId,
    registerMessageRow,
    handleToggleTranslationOriginal,
    handleTranslateMessage,
    messageTranslateEnabled,
  }
}
