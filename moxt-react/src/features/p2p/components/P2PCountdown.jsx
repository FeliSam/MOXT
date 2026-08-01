import { useEffect, useState } from 'react'
import { FiClock } from 'react-icons/fi'
import { formatCountdown, remainingMs } from '../p2pUtils'

export function P2PCountdown({ dueAt, label, onExpire, urgentBelowMs = 5 * 60 * 1000 }) {
  const [left, setLeft] = useState(() => remainingMs(dueAt))

  useEffect(() => {
    if (!dueAt) return undefined
    const tick = () => {
      const next = remainingMs(dueAt)
      setLeft(next)
      if (next === 0) onExpire?.()
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [dueAt, onExpire])

  if (dueAt == null || left == null) return null

  const urgent = left > 0 && left <= urgentBelowMs
  const expired = left === 0

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold tabular-nums ${
        expired
          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200'
          : urgent
            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
            : 'bg-cyan-50 text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100'
      }`}
      role="timer"
      aria-live="polite"
    >
      <FiClock className="shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="shrink-0">{expired ? '00:00' : formatCountdown(left)}</span>
    </div>
  )
}
