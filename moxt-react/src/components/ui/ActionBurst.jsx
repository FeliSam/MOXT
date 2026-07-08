import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { FiCheck } from 'react-icons/fi'

const CONFETTI = [
  { x: -28, y: -36, rot: -25, color: '#12bfa3' },
  { x: 8, y: -42, rot: 12, color: '#08705f' },
  { x: 32, y: -28, rot: 30, color: '#f59e0b' },
  { x: -18, y: -18, rot: -40, color: '#f43f5e' },
  { x: 22, y: -14, rot: 18, color: '#3b82f6' },
  { x: -4, y: -48, rot: 8, color: '#a855f7' },
  { x: 14, y: -32, rot: -15, color: '#10b981' },
  { x: -30, y: -24, rot: 22, color: '#f97316' },
]

/**
 * Micro-confetti + check morphé, ancré au point de clic (ou au centre).
 * Appeler via `triggerActionBurst(x, y)` ou monter `<ActionBurst active onDone />`.
 */
export function ActionBurst({
  active = false,
  x = null,
  y = null,
  onDone,
  duration = 700,
}) {
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(t)
  }, [active, duration, onDone])

  if (!active || typeof document === 'undefined') return null

  const left = x ?? window.innerWidth / 2
  const top = y ?? window.innerHeight / 2

  return createPortal(
    <div className="action-burst" style={{ left, top }} aria-hidden="true">
      <span className="action-burst-check">
        <FiCheck strokeWidth={3} />
      </span>
      {CONFETTI.map((piece, index) => (
        <span
          key={index}
          className="action-burst-piece"
          style={{
            '--piece-x': `${piece.x}px`,
            '--piece-y': `${piece.y}px`,
            '--piece-rot': `${piece.rot}deg`,
            background: piece.color,
            animationDelay: `${index * 18}ms`,
          }}
        />
      ))}
    </div>,
    document.body,
  )
}

/** Hook léger pour déclencher un burst depuis un handler de clic. */
export function useActionBurst() {
  const [burst, setBurst] = useState({ active: false, x: 0, y: 0 })

  function trigger(event) {
    const point =
      event?.clientX != null
        ? { x: event.clientX, y: event.clientY }
        : { x: window.innerWidth / 2, y: window.innerHeight * 0.4 }
    setBurst({ active: true, ...point })
  }

  function clear() {
    setBurst((current) => ({ ...current, active: false }))
  }

  const node = (
    <ActionBurst active={burst.active} x={burst.x} y={burst.y} onDone={clear} />
  )

  return { trigger, node }
}
