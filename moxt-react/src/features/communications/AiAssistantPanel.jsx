import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiArrowLeft, FiCpu, FiHeadphones, FiPaperclip, FiSend, FiTrash2, FiX, FiZap } from 'react-icons/fi'
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
import { shortenFileName } from '../../services/uploadProgress'

export function AiAssistantPanel({ onBack, showBack = true, userId }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const storageKey = `moxt-ai-assistant-${userId}`
  const messageListRef = useRef(null)
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

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)))
  }, [messages, storageKey])

  useLayoutEffect(() => {
    const messageList = messageListRef.current
    if (messageList) messageList.scrollTop = messageList.scrollHeight
  }, [messages.length, loading, adminCompose])

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
        response = await llmAssistantProvider.respond({
          question: text,
          searchIndex,
          history: messages,
          language,
        })
      } catch {
        response = await localAssistantProvider.respond({ question: text, searchIndex, language, t })
      }
      setMessages((current) => [
        ...current,
        {
          id: `AI-${Date.now()}`,
          role: 'assistant',
          text: response.text,
          actions: response.actions,
          sources: response.sources,
          createdAt: new Date().toISOString(),
        },
      ])
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

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden overscroll-none">
      <header className="message-thread-header relative z-10 flex min-h-20 shrink-0 items-center gap-3 bg-[var(--app-surface)] px-4 py-3 shadow-[0_10px_30px_rgb(15_23_42/0.07)] sm:px-5">
        {showBack ? (
          <button
            className="grid size-10 place-items-center rounded-xl hover:bg-[var(--app-surface-muted)]"
            onClick={onBack}
            aria-label={messagesText(t, 'messages.assistant.backAria')}
          >
            <FiArrowLeft />
          </button>
        ) : null}
        <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 text-xl text-white">
          <FiCpu />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-black">{messagesText(t, 'messages.assistant.name')}</h2>
          <p className="text-xs text-[var(--app-text-muted)]">
            {messagesText(t, 'messages.assistant.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => beginAdminContact()}
          disabled={!user || adminCompose}
          className="grid size-10 place-items-center rounded-xl hover:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={messagesText(t, 'messages.assistant.contactAdminAria')}
          title={messagesText(t, 'messages.assistant.contactAdmin')}
        >
          <FiHeadphones />
        </button>
        <button
          type="button"
          onClick={() => setMessages([])}
          className="grid size-10 place-items-center rounded-xl hover:bg-[var(--app-surface-muted)]"
          aria-label={messagesText(t, 'messages.assistant.clearHistoryAria')}
        >
          <FiTrash2 />
        </button>
      </header>

      <div
        ref={messageListRef}
        className="scrollbar-hidden min-h-0 flex-1 overscroll-contain overflow-y-auto bg-[var(--app-surface)] p-4 sm:p-6"
        data-testid="message-scroll-region"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <AssistantMessage text={messagesText(t, 'messages.assistant.greeting')} />
          {!messages.length ? (
            <div className="ml-10 grid gap-2 sm:grid-cols-2">
              {ASSISTANT_SUGGESTION_KEYS.map((key) => {
                const suggestion = messagesText(t, key)
                return (
                  <button
                    key={key}
                    className="rounded-2xl bg-[var(--app-surface)] p-3 text-left text-sm font-bold shadow-[0_8px_24px_rgb(15_23_42/0.08)] hover:shadow-lg"
                    onClick={() => ask(suggestion)}
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
                  <FiHeadphones />
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

      <div
        className="message-composer-shell relative z-10 shrink-0 bg-[var(--app-surface)] p-3 shadow-[0_-10px_30px_rgb(15_23_42/0.06)] sm:p-4"
        data-testid="message-composer"
      >
        {attachment ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2 text-xs">
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
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-2 shadow-inner"
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

function AssistantMessage({ actions, sources, sourcesLabel, suggestions, onSuggestion, text }) {
  return (
    <div className="flex max-w-[88%] gap-2">
      <span className="mt-auto grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white">
        <FiCpu />
      </span>
      <div className="rounded-2xl rounded-bl-md bg-[var(--app-surface)] px-4 py-3 text-sm leading-6 shadow-[0_8px_24px_rgb(15_23_42/0.09)]">
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
      {suggestions?.length ? (
        <div className="ml-10 mt-2 flex flex-wrap gap-2">
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
