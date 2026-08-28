import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { FEED_SLIDE_SECTION_CLASS } from './feedActionStyles.jsx'

/** Au-delà, 3 copies feraient trop de placeholders — wrap en fin de liste. */
export const FEED_LOOP_MAX_ITEMS = 64
export const FEED_PULL_REFRESH_PX = 64
/** Slides montées autour de l’index actif (±N) — le reste est placeholder hauteur fixe. */
export const FEED_MOUNT_RADIUS = 2

export function isFeedAtFirstLogical(activeIndex, looping, loopSize) {
  if (loopSize < 1) return true
  if (!looping) return activeIndex <= 0
  return activeIndex % loopSize === 0
}

export function shouldTriggerFeedRefresh(pullPx, threshold = FEED_PULL_REFRESH_PX) {
  return Number(pullPx) >= threshold
}

/**
 * Fenêtre ±radius autour de l’actif, et les mêmes fenêtres sur les copies
 * de boucle (sinon le haut/bas du scroller est un placeholder noir).
 */
export function isSlideMounted(
  index,
  activeIndex,
  { radius = FEED_MOUNT_RADIUS, looping = false, loopSize = 0 } = {},
) {
  if (Math.abs(index - activeIndex) <= radius) return true
  if (!looping || loopSize < 2) return false
  return (
    Math.abs(index - (activeIndex - loopSize)) <= radius ||
    Math.abs(index - (activeIndex + loopSize)) <= radius
  )
}

/**
 * Scroller vertical snap-y plein cadre (1 slide = 100 %).
 * Boucle infinie (3 copies) ; virtualisation ±2 slides ; pull-to-refresh sur la 1re.
 */
export function FeedSnapScroller({
  items,
  initialIndex = 0,
  renderSlide,
  onRefresh,
  refreshNonce = 0,
  className = '',
  testId = 'feed-snap-scroll',
}) {
  const scrollerRef = useRef(null)
  const looping = items.length >= 2
  const loopSize = items.length
  const displayItems = useMemo(() => {
    if (!looping) return items
    return [...items, ...items, ...items]
  }, [items, looping])

  const baseOffset = looping ? loopSize : 0
  const clampedInitial = Math.max(0, Math.min(initialIndex, Math.max(items.length - 1, 0)))
  const [activeIndex, setActiveIndex] = useState(baseOffset + clampedInitial)
  const itemSetKey = useMemo(
    () =>
      [...new Set(items.map((item) => item.id))]
        .sort()
        .join('|'),
    [items],
  )
  const jumpLockRef = useRef(false)
  const activeIndexRef = useRef(activeIndex)
  const loopingRef = useRef(looping)
  const loopSizeRef = useRef(loopSize)
  const [pullPx, setPullPx] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullPxRef = useRef(0)
  const refreshingRef = useRef(false)
  const pullStartYRef = useRef(0)
  const pullingRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    loopingRef.current = looping
    loopSizeRef.current = loopSize
  }, [looping, loopSize])

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  function scrollToIndex(index, behavior = 'auto') {
    const scroller = scrollerRef.current
    if (!scroller) return
    const slide = scroller.querySelector(`[data-feed-slide][data-index="${index}"]`)
    if (!slide) return
    slide.scrollIntoView({ block: 'start', behavior })
  }

  useEffect(() => {
    const next = baseOffset + clampedInitial
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reposition scroll when feed items change
    setActiveIndex(next)
    jumpLockRef.current = true
    scrollToIndex(next, 'auto')
    const t = window.setTimeout(() => {
      jumpLockRef.current = false
    }, 120)
    return () => window.clearTimeout(t)
  }, [baseOffset, clampedInitial, itemSetKey, refreshNonce])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return undefined
    const slideCount = looping ? loopSize * 3 : loopSize
    let frame = 0

    function readIndex() {
      const height = scroller.clientHeight || 1
      const max = Math.max(slideCount - 1, 0)
      return Math.max(0, Math.min(max, Math.round(scroller.scrollTop / height)))
    }

    function commitIndex(index) {
      if (looping && loopSize >= 2 && index < loopSize) {
        jumpLockRef.current = true
        const target = index + loopSize
        scrollToIndex(target, 'auto')
        setActiveIndex(target)
        window.setTimeout(() => {
          jumpLockRef.current = false
        }, 120)
        return
      }
      if (looping && loopSize >= 2 && index >= loopSize * 2) {
        jumpLockRef.current = true
        const target = index - loopSize
        scrollToIndex(target, 'auto')
        setActiveIndex(target)
        window.setTimeout(() => {
          jumpLockRef.current = false
        }, 120)
        return
      }
      if (index === activeIndexRef.current) return
      setActiveIndex(index)
    }

    function flushIndex() {
      if (jumpLockRef.current) return
      commitIndex(readIndex())
    }

    function onScroll() {
      if (jumpLockRef.current) return
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        flushIndex()
      })
    }

    scroller.addEventListener('scroll', onScroll, { passive: true })
    scroller.addEventListener('scrollend', flushIndex)
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('scrollend', flushIndex)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [itemSetKey, looping, loopSize])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return undefined

    function atFirst() {
      return isFeedAtFirstLogical(activeIndexRef.current, loopingRef.current, loopSizeRef.current)
    }

    function onTouchStart(event) {
      if (!onRefreshRef.current || refreshingRef.current || !atFirst()) {
        pullingRef.current = false
        return
      }
      const height = scroller.clientHeight || 1
      const expectedTop = activeIndexRef.current * height
      if (Math.abs(scroller.scrollTop - expectedTop) > 16) {
        pullingRef.current = false
        return
      }
      pullStartYRef.current = event.touches[0]?.clientY || 0
      pullingRef.current = true
    }

    function onTouchMove(event) {
      if (!pullingRef.current || refreshingRef.current) return
      const dy = (event.touches[0]?.clientY || 0) - pullStartYRef.current
      if (dy <= 0) {
        pullPxRef.current = 0
        setPullPx(0)
        return
      }
      event.preventDefault()
      const next = Math.min(96, dy * 0.42)
      pullPxRef.current = next
      setPullPx(next)
    }

    async function onTouchEnd() {
      if (!pullingRef.current) return
      pullingRef.current = false
      const pulled = pullPxRef.current
      if (!shouldTriggerFeedRefresh(pulled) || !onRefreshRef.current) {
        pullPxRef.current = 0
        setPullPx(0)
        return
      }
      refreshingRef.current = true
      setRefreshing(true)
      setPullPx(FEED_PULL_REFRESH_PX)
      try {
        await onRefreshRef.current()
      } finally {
        pullPxRef.current = 0
        setPullPx(0)
        refreshingRef.current = false
        setRefreshing(false)
      }
    }

    scroller.addEventListener('touchstart', onTouchStart, { passive: true })
    scroller.addEventListener('touchmove', onTouchMove, { passive: false })
    scroller.addEventListener('touchend', onTouchEnd)
    scroller.addEventListener('touchcancel', onTouchEnd)
    return () => {
      scroller.removeEventListener('touchstart', onTouchStart)
      scroller.removeEventListener('touchmove', onTouchMove)
      scroller.removeEventListener('touchend', onTouchEnd)
      scroller.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  const showPull = pullPx > 6 || refreshing

  return (
    <div className="relative min-h-0 flex-1 md:hidden">
      {showPull ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center pt-[max(0.85rem,env(safe-area-inset-top))]"
          data-testid="feed-pull-refresh"
          aria-hidden
        >
          <span
            className="grid size-9 place-items-center rounded-full bg-white/15 text-sm font-black text-white backdrop-blur-md ring-1 ring-white/25"
            style={{ transform: `translateY(${Math.max(0, pullPx - 8)}px)` }}
          >
            {refreshing ? '…' : '↓'}
          </span>
        </div>
      ) : null}
      <div
        ref={scrollerRef}
        data-navbar-ignore
        data-testid={testId}
        className={`feed-snap-scroller scrollbar-hidden h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain bg-black ${className}`}
      >
        {displayItems.map((item, index) => {
          const mounted = isSlideMounted(index, activeIndex, { looping, loopSize })
          if (!mounted) {
            return (
              <section
                key={`feed-ph-${item.id}-${index}`}
                data-feed-slide
                data-index={index}
                className={FEED_SLIDE_SECTION_CLASS}
                aria-hidden="true"
              />
            )
          }
          return (
            <Fragment key={`feed-slide-${item.id}-${index}`}>
              {renderSlide(item, {
                index,
                active: index === activeIndex,
                logicalIndex: looping ? index % loopSize : index,
              })}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
