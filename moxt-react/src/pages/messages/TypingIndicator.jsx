import { MessageAvatar } from './MessageBubble'

export function TypingIndicator({ label, peerName }) {
  return (
    <div
      className="message-row message-row--spaced"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <MessageAvatar name={peerName} />
      <div className="message-typing-bubble" aria-hidden="true">
        <span className="message-typing-dot" />
        <span className="message-typing-dot" />
        <span className="message-typing-dot" />
      </div>
    </div>
  )
}

export function TypingDots({ className = '' }) {
  return (
    <span className={`message-typing-dots ${className}`.trim()} aria-hidden="true">
      <span className="message-typing-dot message-typing-dot--inline" />
      <span className="message-typing-dot message-typing-dot--inline" />
      <span className="message-typing-dot message-typing-dot--inline" />
    </span>
  )
}
