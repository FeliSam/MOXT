import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiCpu, FiPaperclip, FiSend, FiX, FiZap } from 'react-icons/fi'
import { LuHeadphones } from 'react-icons/lu'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/useLanguage'
import { selectSearchIndex } from '../searchSelectors'
import { openAdminSupportChat } from './adminSupportChat'
import { localAssistantProvider } from './assistantProvider'
import {
  buildAssistantTicketMessage,
  wantsAdminContact,
} from './assistantAdminUtils'
import { ASSISTANT_SUGGESTION_KEYS, messagesText } from './messagesI18n'
import { llmAssistantProvider } from './llmAssistantProvider'
import { moxtiAssistantProvider } from './moxtiAssistantProvider'
import { shortenFileName } from '../../services/uploadProgress'
import { syncKeyboardInsetAfterBlur } from '../../hooks/useKeyboardInset'
import { HEADER_ICON_STROKE } from '../../components/layout/headerLayout'

export function AiAssistantPanel({
  userId,
  headerActionsRef,
  onAdminComposeChange,
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const storageKey = `moxt-ai-assistant-${userId}`
  const messageListRef = useRef(null)
  const composerShellRef = useRef(null)
  const searchIndex = useSelector(selectSearchIndex)
  const { language, t } = useLanguage()
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]')
    } catch {
      return []
    }
  })
  const [question, setQuestion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachment, setAttachment] = useState(null)
  const [adminCompose, setAdminCompose] = useState(false)
  const [adminDraft, setAdminDraft] = useState('')
  const [adminSending, setAdminSending] = useState(false)
  const [showAllQuestions, setShowAllQuestions] = useState(false)
  const [composerOffset, setComposerOffset] = useState(120)

  useEffect(() => {
    onAdminComposeChange?.(adminCompose)
  }, [adminCompose, onAdminComposeChange])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)))
  }, [messages, storageKey])

  useLayoutEffect(() => {
    const messageList = messageListRef.current
    if (messageList) messageList.scrollTop = messageList.scrollHeight
  }, [messages.length, loading, adminCompose])

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
  }, [adminCompose, attachment, loading])

  function appendAssistantMessage(message) {
    setMessages((current) => [...current, message])
  }

  function beginAdminContact(prefill = '') {
    if (!user) return
    setError('')
    setAdminCompose(true)
    setAdminDraft(
      prefill.trim() ||
        buildAssistantTicketMessage(
          messages,
          '',
          messagesText(t, 'messages.assistant.adminComposeHint'),
        ),
    )
    appendAssistantMessage({
      // eslint-disable-next-line react-hooks/purity -- gestionnaire d'événement (clic), jamais appelé pendant le rendu
      id: `AI-${Date.now()}`,
      role: 'assistant',
      text: messagesText(t, 'messages.assistant.adminComposePrompt'),
      createdAt: new Date().toISOString(),
    })
  }

  async function submitAdminContact() {
    const text = adminDraft.trim()
    if (!text || adminSending || !user) return
    setAdminSending(true)
    setError('')
    try {
      const result = await dispatch(openAdminSupportChat({ message: text })).unwrap()
      setAdminCompose(false)
      setAdminDraft('')
      appendAssistantMessage({
        id: `AI-${Date.now()}`,
        role: 'assistant',
        text: messagesText(t, 'messages.assistant.adminChatOpened'),
        actions: [
          {
            label: messagesText(t, 'messages.assistant.adminOpenChat'),
            path: `/messages?conversation=${result.conversationId}`,
          },
        ],
        createdAt: new Date().toISOString(),
      })
      if (result.conversationId) {
        navigate(`/messages?conversation=${result.conversationId}`)
      }
    } catch (err) {
      const code = typeof err === 'string' ? err : err?.message
      if (code === 'no_admin') {
        setError(messagesText(t, 'messages.assistant.adminUnavailable'))
      } else {
        setError(messagesText(t, 'messages.assistant.adminSendFailed'))
      }
    } finally {
      setAdminSending(false)
    }
  }

  async function ask(value = question) {
    const text = value.trim()
    if (!text || loading || adminCompose) return
    const nextMessages = [
      ...messages,
      {
        // eslint-disable-next-line react-hooks/purity -- gestionnaire d'événement (envoi), jamais appelé pendant le rendu
        id: `ASK-${Date.now()}`,
        role: 'user',
        text,
        attachment: attachment ? { name: attachment.name, size: attachment.size } : null,
        createdAt: new Date().toISOString(),
      },
    ]
    setMessages(nextMessages)
    setQuestion('')
    setAttachment(null)
    setError('')
    setLoading(true)

    if (wantsAdminContact(text, language)) {
      setLoading(false)
      beginAdminContact(text)
      return
    }

    try {
      let response
      try {
        response = await moxtiAssistantProvider.respond({
          question: text,
          user,
          history: messages,
          language,
        })
      } catch {
        try {
          response = await llmAssistantProvider.respond({
            question: text,
            searchIndex,
            history: messages,
            language,
          })
        } catch {
          response = await localAssistantProvider.respond({
            question: text,
            searchIndex,
            language,
            t,
          })
        }
      }
      setMessages((current) => [
        ...current,
        {
          id: `AI-${Date.now()}`,
          role: 'assistant',
          text: response.text,
          actions: response.actions,
          sources: response.sources,
          suggestions: response.suggestions,
          createdAt: new Date().toISOString(),
        },
      ])
      setShowAllQuestions(false)
    } catch (err) {
      setError(
        messagesText(t, 'messages.assistant.error', {
          detail: err?.message || '',
        }),
      )
    } finally {
      setLoading(false)
    }
  }

  useLayoutEffect(() => {
    if (!headerActionsRef) return
    headerActionsRef.current = {
      onContactAdmin: () => beginAdminContact(),
      onClearHistory: () => setMessages([]),
    }
  })

  return (
    <div className="message-thread-panel flex h-full min-h-0 min-w-0 flex-col overflow-hidden overscroll-none bg-transparent">
      <div className="message-thread-canvas relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="message-thread-scroll relative min-h-0 flex-1 overflow-hidden"
        style={{ '--message-composer-offset': `${composerOffset}px` }}
      >
      <div
        ref={messageListRef}
        className="scrollbar-hidden h-full overscroll-contain overflow-y-auto bg-transparent px-4 pt-3 sm:px-6"
        data-testid="message-scroll-region"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <AssistantMessage text={messagesText(t, 'messages.assistant.greeting')} />
          {!messages.length || showAllQuestions ? (
            <div className="ml-10 grid gap-2 sm:grid-cols-2">
              {ASSISTANT_SUGGESTION_KEYS.map((key) => {
                const suggestion = messagesText(t, key)
                return (
                  <button
                    key={key}
                    className="rounded-2xl bg-[var(--app-surface)] p-3 text-left text-sm font-bold shadow-[0_8px_24px_rgb(15_23_42/0.08)] hover:shadow-lg"
                    onClick={() => {
                      setShowAllQuestions(false)
                      ask(suggestion)
                    }}
                  >
                    <FiZap className="mb-2 text-brand-500" />
                    {suggestion}
                  </button>
                )
              })}
            </div>
          ) : null}
          {messages.map((message, index) =>
            message.role === 'assistant' ? (
              <AssistantMessage
                key={message.id}
                text={message.text}
                actions={message.actions}
                sources={message.sources}
                suggestions={index === messages.length - 1 ? message.suggestions : null}
                onSuggestion={ask}
                showAllQuestionsLabel={
                  index === messages.length - 1
                    ? messagesText(
                        t,
                        showAllQuestions
                          ? 'messages.assistant.hideAllQuestions'
                          : 'messages.assistant.showAllQuestions',
                      )
                    : null
                }
                onShowAllQuestions={
                  index === messages.length - 1
                    ? () => setShowAllQuestions((value) => !value)
                    : null
                }
                sourcesLabel={messagesText(t, 'messages.assistant.sources', {
                  list: (message.sources || []).join(' · '),
                })}
              />
            ) : (
              <div
                key={message.id}
                className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-brand-700 px-4 py-3 text-sm leading-6 text-white"
              >
                {message.text}
                {message.attachment ? (
                  <span className="mt-2 flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-xl bg-white/10 px-3 py-2 text-xs">
                    <FiPaperclip className="shrink-0" />
                    <span className="min-w-0 truncate" title={message.attachment.name}>
                      {shortenFileName(message.attachment.name, 28)}
                    </span>
                  </span>
                ) : null}
              </div>
            ),
          )}
          {adminCompose ? (
            <div className="ml-10 rounded-2xl border border-brand-200 bg-brand-50/70 p-4 shadow-sm dark:border-brand-900/40 dark:bg-brand-950/30">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-700 text-white">
                  <LuHeadphones strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-brand-800 dark:text-brand-200">
                    {messagesText(t, 'messages.assistant.adminComposeTitle')}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
                    {messagesText(t, 'messages.assistant.adminComposeBody')}
                  </p>
                  <textarea
                    value={adminDraft}
                    onChange={(event) => setAdminDraft(event.target.value)}
                    rows={4}
                    placeholder={messagesText(t, 'messages.assistant.adminComposePlaceholder')}
                    className="mt-3 w-full rounded-xl bg-[var(--app-surface)] p-3 text-sm outline-none ring-1 ring-[var(--app-border)] focus:ring-brand-500"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!adminDraft.trim() || adminSending}
                      onClick={submitAdminContact}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white disabled:opacity-40"
                    >
                      <FiSend />
                      {adminSending
                        ? messagesText(t, 'messages.assistant.adminSending')
                        : messagesText(t, 'messages.assistant.adminSend')}
                    </button>
                    <button
                      type="button"
                      disabled={adminSending}
                      onClick={() => {
                        setAdminCompose(false)
                        setAdminDraft('')
                      }}
                      className="inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-bold text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {loading ? <TypingIndicator /> : null}
          {error ? <p className="ml-10 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
      </div>
      </div>

      <div
        ref={composerShellRef}
        className="message-composer-shell z-20 w-full shrink-0 bg-transparent p-0"
        data-testid="message-composer"
        style={{ '--message-composer-offset': `${composerOffset}px` }}
      >
        <div className="message-composer-dock relative px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:pt-4">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 bg-[var(--app-surface-muted)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 -top-8 -z-10 h-8 bg-gradient-to-b from-transparent to-[var(--app-surface-muted)]"
            aria-hidden="true"
          />
        {attachment ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-xs">
            <FiPaperclip />
            <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              aria-label={messagesText(t, 'messages.assistant.removeDocAria')}
            >
              <FiX />
            </button>
          </div>
        ) : null}
        <form
          className="message-composer-form mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[var(--app-border)]/40 bg-[var(--app-surface)] p-2 shadow-inner"
          onSubmit={(event) => {
            event.preventDefault()
            ask()
          }}
        >
          <label
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-[var(--app-surface)] text-lg text-[var(--app-accent)] shadow-sm hover:bg-[var(--app-accent-soft)]"
            aria-label={messagesText(t, 'messages.assistant.addDocAria')}
          >
            <FiPaperclip aria-hidden="true" />
            <input
              className="sr-only"
              type="file"
              onChange={(event) => setAttachment(event.target.files?.[0] || null)}
            />
          </label>
          <textarea
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            value={question}
            rows={1}
            disabled={adminCompose}
            onChange={(event) => setQuestion(event.target.value)}
            onBlur={() => {
              syncKeyboardInsetAfterBlur()
            }}
            placeholder={
              adminCompose
                ? messagesText(t, 'messages.assistant.adminComposeLocked')
                : messagesText(t, 'messages.assistant.placeholder')
            }
          />
          <button
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-700 text-lg text-white shadow-md transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
            type="submit"
            disabled={!question.trim() || loading || adminCompose}
            aria-label={messagesText(t, 'messages.assistant.sendAria')}
          >
            <FiSend aria-hidden="true" />
          </button>
        </form>
        </div>
      </div>
    </div>
  )
}

function renderMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let key = 0
  for (const line of lines) {
    const trimmed = line.trimStart()
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const content = trimmed.slice(2)
      elements.push(
        <li key={key++} className="ml-4 list-disc">
          {inlineBold(content)}
        </li>,
      )
    } else if (trimmed === '') {
      elements.push(<br key={key++} />)
    } else {
      elements.push(
        <span key={key++} className="block">
          {inlineBold(trimmed)}
        </span>,
      )
    }
  }
  return elements
}

function inlineBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))
}

function AssistantMessage({
  actions,
  sources,
  sourcesLabel,
  suggestions,
  onSuggestion,
  showAllQuestionsLabel,
  onShowAllQuestions,
  text,
}) {
  return (
    <div className="grid max-w-[min(100%,36rem)] gap-2">
      <div className="flex gap-2">
        <span className="mt-auto grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white">
          <FiCpu />
        </span>
        <div className="min-w-0 rounded-2xl rounded-bl-md bg-[var(--app-surface)] px-4 py-3 text-sm leading-6 shadow-[0_8px_24px_rgb(15_23_42/0.09)]">
          <div className="prose-sm">{renderMarkdown(text)}</div>
          {actions?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="rounded-xl bg-[var(--app-accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--app-accent)]"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
          {sources?.length ? (
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
              {sourcesLabel || `Sources: ${sources.join(' · ')}`}
            </p>
          ) : null}
        </div>
      </div>
      {suggestions?.length ? (
        <div className="ml-10 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestion(s)}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--app-text-2)] transition hover:border-brand-400 hover:text-brand-600"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
      {showAllQuestionsLabel && onShowAllQuestions ? (
        <div className="ml-10">
          <button
            type="button"
            onClick={onShowAllQuestions}
            className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-800 transition hover:border-brand-400 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
          >
            <FiZap className="mr-1.5 inline text-brand-500" />
            {showAllQuestionsLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex max-w-[88%] gap-2">
      <span className="mt-auto grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white">
        <FiCpu />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-[var(--app-surface)] px-4 py-3 shadow-[0_8px_24px_rgb(15_23_42/0.09)]">
        <span className="size-2 animate-bounce rounded-full bg-[var(--app-text-muted)] [animation-delay:0ms]" />
        <span className="size-2 animate-bounce rounded-full bg-[var(--app-text-muted)] [animation-delay:150ms]" />
        <span className="size-2 animate-bounce rounded-full bg-[var(--app-text-muted)] [animation-delay:300ms]" />
      </div>
    </div>
  )
}
