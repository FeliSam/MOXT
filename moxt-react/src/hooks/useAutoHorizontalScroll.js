import { useEffect, useRef } from 'react'

const DEFAULT_INTERVAL_MS = 4500

function canScrollHorizontally(el) {
  return el.scrollWidth - el.clientWidth > 4
}

function getLoopWidth(el) {
  const count = el.children.length
  if (count < 2 || count % 2 !== 0) return 0
  const firstClone = el.children[count / 2]
  return firstClone?.offsetLeft ?? 0
}

function normalizeLoopPosition(el, loopWidth) {
  if (!loopWidth) return
  if (el.scrollLeft >= loopWidth - 1) {
    el.scrollLeft -= loopWidth
  }
}

function nextScrollLeft(el, loopWidth) {
  const current = el.scrollLeft
  for (const child of el.children) {
    const left = child.offsetLeft
    if (left > current + 8) return left
  }
  return loopWidth || 0
}

/**
 * Défilement horizontal automatique pour carrousels (pause au survol / interaction).
 * Avec `loop: true`, le contenu doit être dupliqué dans le DOM pour une boucle fluide.
 */
export function useAutoHorizontalScroll(
  scrollRef,
  { enabled = true, intervalMs = DEFAULT_INTERVAL_MS, loop = false } = {},
) {
  const pausedRef = useRef(false)
  const timerRef = useRef(0)
  const loopWidthRef = useRef(0)

  useEffect(() => {
    const el = scrollRef?.current
    if (!enabled || !el) return undefined

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const prefersReducedMotion = () => reducedMotion?.matches ?? false

    function refreshLoopWidth() {
      loopWidthRef.current = loop ? getLoopWidth(el) : 0
    }

    function pause() {
      pausedRef.current = true
    }

    function resume() {
      pausedRef.current = false
    }

    function onScroll() {
      if (!loop) return
      normalizeLoopPosition(el, loopWidthRef.current)
    }

    function tick() {
      if (pausedRef.current || prefersReducedMotion() || document.hidden || !canScrollHorizontally(el)) {
        return
      }
      refreshLoopWidth()
      el.scrollTo({
        left: nextScrollLeft(el, loopWidthRef.current),
        behavior: 'smooth',
      })
    }

    function schedule() {
      window.clearInterval(timerRef.current)
      timerRef.current = window.setInterval(tick, intervalMs)
    }

    refreshLoopWidth()
    schedule()

    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)
    el.addEventListener('focusin', pause)
    el.addEventListener('focusout', resume)
    el.addEventListener('pointerdown', pause)
    el.addEventListener('pointerup', resume)
    el.addEventListener('pointercancel', resume)
    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('touchend', resume, { passive: true })
    document.addEventListener('visibilitychange', resume)
    reducedMotion?.addEventListener('change', schedule)

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(refreshLoopWidth)
        : null
    resizeObserver?.observe(el)
    Array.from(el.children).forEach((child) => resizeObserver?.observe(child))

    return () => {
      window.clearInterval(timerRef.current)
      resizeObserver?.disconnect()
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
      el.removeEventListener('focusin', pause)
      el.removeEventListener('focusout', resume)
      el.removeEventListener('pointerdown', pause)
      el.removeEventListener('pointerup', resume)
      el.removeEventListener('pointercancel', resume)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('touchend', resume)
      document.removeEventListener('visibilitychange', resume)
      reducedMotion?.removeEventListener('change', schedule)
    }
  }, [enabled, intervalMs, loop, scrollRef])
}

export { getLoopWidth, nextScrollLeft, normalizeLoopPosition }
