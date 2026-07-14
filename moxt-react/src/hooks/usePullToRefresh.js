import { useCallback, useEffect, useRef, useState } from 'react'

const THRESHOLD_PX = 72
const MAX_PULL_PX = 120

function getScrollTop() {
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  )
}

/**
 * Pull-to-refresh soft (Safari PWA + Capacitor WebView).
 * Ne s’active qu’en haut de page ; ignore Messagerie immersives / nested scroll agressif.
 */
export function usePullToRefresh({ onRefresh, disabled = false }) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const tracking = useRef(false)
  const pullRef = useRef(0)
  const refreshingRef = useRef(false)

  useEffect(() => {
    pullRef.current = pull
  }, [pull])

  useEffect(() => {
    refreshingRef.current = refreshing
  }, [refreshing])

  const runRefresh = useCallback(async () => {
    if (refreshingRef.current) return
    setRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setRefreshing(false)
      setPull(0)
    }
  }, [onRefresh])

  useEffect(() => {
    if (disabled) return undefined

    function onTouchStart(event) {
      if (refreshingRef.current) return
      if (getScrollTop() > 2) return
      const target = event.target
      if (target instanceof Element) {
        if (target.closest('.messages-thread-immersive, [data-no-pull-refresh]')) return
        const scrollParent = target.closest('[data-scroll-container], .overflow-y-auto, .overflow-auto')
        if (scrollParent && scrollParent.scrollTop > 2) return
      }
      tracking.current = true
      startY.current = event.touches[0]?.clientY ?? 0
    }

    function onTouchMove(event) {
      if (!tracking.current || refreshingRef.current) return
      if (getScrollTop() > 2) {
        tracking.current = false
        setPull(0)
        return
      }
      const y = event.touches[0]?.clientY ?? 0
      const delta = y - startY.current
      if (delta <= 0) {
        setPull(0)
        return
      }
      const resisted = Math.min(MAX_PULL_PX, delta * 0.45)
      setPull(resisted)
      if (resisted > 12 && event.cancelable) {
        event.preventDefault()
      }
    }

    function onTouchEnd() {
      if (!tracking.current) return
      tracking.current = false
      if (pullRef.current >= THRESHOLD_PX) {
        void runRefresh()
      } else {
        setPull(0)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('touchcancel', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [disabled, runRefresh])

  return {
    pull,
    refreshing,
    progress: Math.min(1, pull / THRESHOLD_PX),
    armed: pull >= THRESHOLD_PX,
  }
}
