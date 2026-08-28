import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Affiche `initial` éléments puis en ajoute `step` à l’approche du bas (IntersectionObserver).
 * Pas d’UI de pagination — le sentinel déclenche le complément.
 */
export function useProgressiveReveal(
  items = [],
  { initial = 20, step = 20, rootMargin = '480px 0px' } = {},
) {
  const [limit, setLimit] = useState(initial)
  const [sentinelNode, setSentinelNode] = useState(null)
  const itemsRef = useRef(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const sentinelRef = useCallback((node) => {
    setSentinelNode(node)
  }, [])

  const listKey = useMemo(() => {
    if (!items?.length) return 'empty'
    return `${items.length}:${items[0]?.id ?? ''}:${items[items.length - 1]?.id ?? ''}`
  }, [items])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination when list identity changes
    setLimit(initial)
  }, [listKey, initial])

  useEffect(() => {
    if (!sentinelNode || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setLimit((prev) => {
          const total = itemsRef.current?.length || 0
          if (prev >= total) return prev
          return Math.min(prev + step, total)
        })
      },
      { root: null, rootMargin, threshold: 0 },
    )
    observer.observe(sentinelNode)
    return () => observer.disconnect()
  }, [sentinelNode, listKey, rootMargin, step])

  const visibleItems = useMemo(() => items.slice(0, limit), [items, limit])
  const hasMore = limit < items.length

  return { visibleItems, sentinelRef, hasMore, shownCount: Math.min(limit, items.length) }
}
