import { useEffect, useRef } from 'react'

const AXIS_LOCK_PX = 8

/**
 * Ref pour carrousels horizontaux : verrouillage d'axe tactile + molette.
 * `wheelToHorizontal` convertit la molette verticale en défilement horizontal.
 */
export function useHorizontalScroll({ wheelToHorizontal = false } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let startX = 0
    let startY = 0
    let axis = null

    function resetGesture() {
      axis = null
    }

    function canScrollX() {
      return el.scrollWidth - el.clientWidth > 1
    }

    function onTouchStart(event) {
      if (event.touches.length !== 1) return
      startX = event.touches[0].clientX
      startY = event.touches[0].clientY
      axis = null
    }

    function onTouchMove(event) {
      if (!canScrollX() || event.touches.length !== 1) return

      const dx = event.touches[0].clientX - startX
      const dy = event.touches[0].clientY - startY

      if (!axis) {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }

      if (axis !== 'x') return

      const maxScroll = el.scrollWidth - el.clientWidth
      const goingRight = dx > 0
      const goingLeft = dx < 0
      const atStart = el.scrollLeft <= 0
      const atEnd = el.scrollLeft >= maxScroll - 1

      if ((goingRight && atStart) || (goingLeft && atEnd)) return

      event.stopPropagation()
    }

    function onWheel(event) {
      if (!canScrollX()) return

      const maxScroll = el.scrollWidth - el.clientWidth
      const atStart = el.scrollLeft <= 0
      const atEnd = el.scrollLeft >= maxScroll - 1
      const horizontalDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : null
      const verticalDelta = event.shiftKey || wheelToHorizontal ? event.deltaY : 0
      const delta = horizontalDelta ?? verticalDelta

      if (!delta) return
      if (delta < 0 && atStart) return
      if (delta > 0 && atEnd) return

      event.preventDefault()
      el.scrollLeft += delta
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', resetGesture, { passive: true })
    el.addEventListener('touchcancel', resetGesture, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', resetGesture)
      el.removeEventListener('touchcancel', resetGesture)
      el.removeEventListener('wheel', onWheel)
    }
  }, [wheelToHorizontal])

  return ref
}
