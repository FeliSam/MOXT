import { useCallback, useEffect, useRef, useState } from 'react'
import { FiCheck, FiChevronRight } from 'react-icons/fi'

const KNOB = 40
const PAD = 4
const COMPLETE_RATIO = 0.86

function travelWidth(track) {
  if (!track) return 0
  return Math.max(0, track.clientWidth - KNOB - PAD * 2)
}

/**
 * Glissière « slide to unlock » : à la fin du geste, `onComplete` est appelé
 * (ex. ouvrir le modal de confirmation P2P).
 */
export function SwipeToAccept({
  label,
  onComplete,
  className = '',
  disabled = false,
}) {
  const trackRef = useRef(null)
  const dragRef = useRef(null)
  const offsetRef = useRef(0)
  const completeRef = useRef(onComplete)
  const [offset, setOffset] = useState(0)
  const [max, setMax] = useState(0)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    completeRef.current = onComplete
  }, [onComplete])

  function setKnob(next) {
    offsetRef.current = next
    setOffset(next)
  }

  const measure = useCallback(() => {
    setMax(travelWidth(trackRef.current))
  }, [])

  useEffect(() => {
    measure()
    const track = trackRef.current
    if (!track || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [measure])

  function finish(success) {
    dragRef.current = null
    if (!success) {
      setKnob(0)
      setArmed(false)
      return
    }
    setKnob(travelWidth(trackRef.current))
    setArmed(true)
    window.setTimeout(() => {
      completeRef.current?.()
      setKnob(0)
      setArmed(false)
    }, 180)
  }

  function onPointerDown(event) {
    if (disabled || armed) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      startX: event.clientX,
      origin: offsetRef.current,
    }
  }

  function onPointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    event.preventDefault()
    event.stopPropagation()
    const next = Math.min(
      travelWidth(trackRef.current),
      Math.max(0, drag.origin + event.clientX - drag.startX),
    )
    setKnob(next)
  }

  function onPointerUp(event) {
    if (!dragRef.current) return
    event.preventDefault()
    event.stopPropagation()
    const limit = travelWidth(trackRef.current)
    finish(limit > 0 && offsetRef.current >= limit * COMPLETE_RATIO)
  }

  function onKeyDown(event) {
    if (disabled || armed) return
    if (event.key === 'End' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      finish(true)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const limit = travelWidth(trackRef.current)
      const next = Math.min(limit, offsetRef.current + Math.max(24, limit * 0.2))
      setKnob(next)
      if (next >= limit * COMPLETE_RATIO) finish(true)
    }
    if (event.key === 'Home' || event.key === 'Escape') {
      event.preventDefault()
      setKnob(0)
    }
  }

  const percent = max > 0 ? Math.round((offset / max) * 100) : 0

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`relative isolate flex h-11 w-full min-w-0 select-none items-center overflow-hidden rounded-2xl bg-brand-700 shadow-[0_4px_14px_rgba(8,112,95,0.25)] touch-none ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
      } ${className}`}
    >
      <div
        className="absolute inset-y-0 left-0 bg-brand-800/80 transition-[width] duration-75"
        style={{ width: offset + KNOB / 2 + PAD }}
        aria-hidden
      />
      <p
        className={`pointer-events-none relative z-[1] w-full px-14 text-center text-xs font-black tracking-wide text-white transition-opacity ${
          offset > max * 0.35 ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {label}
      </p>
      <span
        className="pointer-events-none absolute left-1 top-1 z-[2] grid place-items-center rounded-full bg-white text-brand-800 shadow-sm"
        style={{
          width: KNOB,
          height: KNOB,
          transform: `translateX(${offset}px)`,
        }}
        aria-hidden
      >
        {armed ? <FiCheck className="text-base" /> : <FiChevronRight className="text-base" />}
      </span>
    </div>
  )
}
