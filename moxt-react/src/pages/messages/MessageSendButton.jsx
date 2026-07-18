import { useEffect, useState } from 'react'
import { FiSend } from 'react-icons/fi'

export function MessageSendButton({ ariaLabel, disabled, ready, sending }) {
  const [burst, setBurst] = useState(false)

  useEffect(() => {
    if (!sending) return undefined
    setBurst(true)
    const timer = window.setTimeout(() => setBurst(false), 520)
    return () => window.clearTimeout(timer)
  }, [sending])

  return (
    <button
      type="submit"
      className={`message-send-btn ${ready ? 'message-send-btn--ready' : ''} ${
        sending ? 'message-send-btn--sending' : ''
      } ${burst ? 'message-send-btn--burst' : ''}`}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-busy={sending}
    >
      <span className="message-send-btn__glow" aria-hidden="true" />
      <span className="message-send-btn__ripple" aria-hidden="true" />
      <span className="message-send-btn__icon" aria-hidden="true">
        <FiSend />
      </span>
      {sending ? <span className="message-send-btn__ring" aria-hidden="true" /> : null}
    </button>
  )
}
