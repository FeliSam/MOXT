import { useEffect, useRef } from 'react'

export function useHorizontalScroll() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onWheel(e) {
      if (e.deltaY === 0) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return ref
}
