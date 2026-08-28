import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { FEED_SLIDE_SECTION_CLASS } from './feedActionStyles.jsx'

/** Au-delà, la boucle 3× et le DOM complet font planter Safari mobile. */
export const FEED_LOOP_MAX_ITEMS = 12
/** Slides montées autour de l’index actif (±N) — le reste est placeholder hauteur fixe. */
export const FEED_MOUNT_RADIUS = 1

function isSlideMounted(index, activeIndex, radius = FEED_MOUNT_RADIUS) {
  return Math.abs(index - activeIndex) <= radius
}

/**
 * Scroller vertical snap-y plein cadre (1 slide = 100 %).
 * Boucle infinie (3 copies) pour petits feeds ; virtualisation ±1 slide sur mobile.
 * @param {{
 *   items: Array<{ id: string }>,
 *   initialIndex?: number,
 *   renderSlide: (item: object, ctx: { index: number, active: boolean }) => import('react').ReactNode,
 *   className?: string,
 *   testId?: string,
 * }} props
 */
export function FeedSnapScroller({
  items,
  initialIndex = 0,
  renderSlide,
  className = '',
  testId = 'feed-snap-scroll',
}) {
  const scrollerRef = useRef(null)
  const looping = items.length >= 2 && items.length <= FEED_LOOP_MAX_ITEMS
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

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  function scrollToIndex(index, behavior = 'auto') {
    const scroller = scrollerRef.current
    if (!scroller) return
    const slide = scroller.querySelector(`[data-feed-slide][data-index="${index}"]`)
    if (!slide) return
    slide.scrollIntoView({ block: 'start', behavior })
  }

  // Reset scroll uniquement quand le set d’items change (ajout/suppression), pas au re-tri.
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
  }, [baseOffset, clampedInitial, itemSetKey])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return undefined
    const slides = [...scroller.querySelectorAll('[data-feed-slide]')]
    let debounceTimer = null

    const observer = new IntersectionObserver(
      (entries) => {
        if (jumpLockRef.current) return
        const visible = entries
          .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const index = Number(visible.target.getAttribute('data-index') || 0)
        if (index === activeIndexRef.current) return

        if (debounceTimer) window.clearTimeout(debounceTimer)
        debounceTimer = window.setTimeout(() => {
          if (jumpLockRef.current) return
          setActiveIndex(index)

          if (!looping || loopSize < 2) return
          if (index < loopSize) {
            jumpLockRef.current = true
            const target = index + loopSize
            scrollToIndex(target, 'auto')
            setActiveIndex(target)
            window.setTimeout(() => {
              jumpLockRef.current = false
            }, 120)
          } else if (index >= loopSize * 2) {
            jumpLockRef.current = true
            const target = index - loopSize
            scrollToIndex(target, 'auto')
            setActiveIndex(target)
            window.setTimeout(() => {
              jumpLockRef.current = false
            }, 120)
          }
        }, 80)
      },
      { root: scroller, threshold: [0.6, 0.75, 0.9] },
    )
    slides.forEach((slide) => observer.observe(slide))
    return () => {
      observer.disconnect()
      if (debounceTimer) window.clearTimeout(debounceTimer)
    }
  }, [itemSetKey, looping, loopSize])

  return (
    <div
      ref={scrollerRef}
      data-navbar-ignore
      data-testid={testId}
      className={`feed-snap-scroller scrollbar-hidden w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain bg-black md:hidden ${className}`}
    >
      {displayItems.map((item, index) => {
        const mounted = isSlideMounted(index, activeIndex)
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
  )
}
