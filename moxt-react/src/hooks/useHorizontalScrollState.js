import { useLayoutEffect, useState } from 'react'

/**
 * État d'un carrousel horizontal : débordement, flèches, page active (pour points).
 */
export function useHorizontalScrollState(scrollRef) {
  const [state, setState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    overflow: false,
    pageCount: 0,
    activePage: 0,
  })

  useLayoutEffect(() => {
    const el = scrollRef?.current
    if (!el) return undefined

    function update() {
      const maxScroll = el.scrollWidth - el.clientWidth
      const overflow = maxScroll > 4
      const childCount = el.children.length
      const pageCount = overflow ? Math.min(childCount, Math.max(2, Math.ceil(el.scrollWidth / el.clientWidth))) : 0
      const activePage =
        overflow && pageCount > 1
          ? Math.min(pageCount - 1, Math.round((el.scrollLeft / maxScroll) * (pageCount - 1)))
          : 0

      setState({
        canScrollLeft: el.scrollLeft > 4,
        canScrollRight: el.scrollLeft < maxScroll - 4,
        overflow,
        pageCount,
        activePage,
      })
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    observer.observe(el)
    Array.from(el.children).forEach((child) => observer.observe(child))

    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [scrollRef])

  return state
}
