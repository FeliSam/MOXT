export const FEED_ENTRY_HINT_DURATION_MS = 3000
export const FEED_ENTRY_HINT_DISTANCE_RATIO = 0.3
/** Slightly quicker peek, slower settle — total still 3s. */
export const FEED_ENTRY_HINT_PEAK_AT = 0.42

export function prefersReducedMotion(
  media = typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-reduced-motion: reduce)')
    : null,
) {
  return Boolean(media?.matches)
}

export function easeInOutCubic(t) {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

/** Offset from the start scroll position at normalized time `t` in [0, 1]. */
export function feedEntryHintOffset(t, delta, peakAt = FEED_ENTRY_HINT_PEAK_AT) {
  const x = Math.min(1, Math.max(0, t))
  const peak = Math.min(0.9, Math.max(0.1, peakAt))
  const progress =
    x <= peak ? easeInOutCubic(x / peak) : 1 - easeInOutCubic((x - peak) / (1 - peak))
  return delta * progress
}

/**
 * Scroll down ~30% of the viewport then back to the start. Total ~3 seconds.
 * Disables CSS scroll-snap for the duration so snap-mandatory cannot yank to the next slide.
 */
export function playFeedEntryHint(scroller, options = {}) {
  const {
    durationMs = FEED_ENTRY_HINT_DURATION_MS,
    distanceRatio = FEED_ENTRY_HINT_DISTANCE_RATIO,
    peakAt = FEED_ENTRY_HINT_PEAK_AT,
    raf = (cb) => window.requestAnimationFrame(cb),
    cancelRaf = (id) => window.cancelAnimationFrame(id),
    shouldCancel = () => false,
  } = options

  return new Promise((resolve) => {
    if (!scroller) {
      resolve('skipped')
      return
    }

    const startTop = Number(scroller.scrollTop) || 0
    const delta = Math.round((Number(scroller.clientHeight) || 0) * distanceRatio)
    if (delta < 8) {
      resolve('skipped')
      return
    }

    const style = scroller.style
    const previousSnap = style?.scrollSnapType
    if (style) style.scrollSnapType = 'none'

    let rafId = 0
    let startTs = null
    let settled = false

    function finish(reason) {
      if (settled) return
      settled = true
      if (rafId) cancelRaf(rafId)
      scroller.scrollTop = startTop
      if (style) style.scrollSnapType = previousSnap || ''
      resolve(reason)
    }

    function frame(ts) {
      if (shouldCancel()) {
        finish('cancelled')
        return
      }
      if (startTs == null) startTs = ts
      const t = Math.min(1, (ts - startTs) / durationMs)
      scroller.scrollTop = startTop + feedEntryHintOffset(t, delta, peakAt)
      if (t >= 1) {
        finish('done')
        return
      }
      rafId = raf(frame)
    }

    rafId = raf(frame)
  })
}
