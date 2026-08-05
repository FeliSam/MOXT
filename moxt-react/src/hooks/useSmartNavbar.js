import { useEffect, useRef, useState } from 'react'
import { shouldPinThreadHeader } from './useKeyboardInset'

function resolveScrollRoot(event, scrollRootSelector) {
  const target = event?.target
  if (!(target instanceof Element)) return null

  if (scrollRootSelector) {
    return target.matches(scrollRootSelector)
      ? target
      : target.closest(scrollRootSelector)
  }

  if (target === document.documentElement || target === document.body) {
    return null
  }

  if (target.scrollHeight > target.clientHeight + 1) {
    return target
  }

  return null
}

function readScrollY(scrollRoot) {
  if (scrollRoot instanceof Element) return scrollRoot.scrollTop
  return window.scrollY
}

export function useSmartNavbar({ disabled = false, scrollRootSelector = null } = {}) {
  const [visible, setVisible] = useState(true)
  const visibleRef = useRef(true)

  useEffect(() => {
    visibleRef.current = true
    const resetId = requestAnimationFrame(() => setVisible(true))

    if (disabled) {
      return () => cancelAnimationFrame(resetId)
    }

    let lastScrollY = readScrollY(document.querySelector(scrollRootSelector))
    let upDistance = 0
    let downDistance = 0
    let frame = null
    let pendingRoot = scrollRootSelector ? document.querySelector(scrollRootSelector) : null

    function showBar() {
      if (!visibleRef.current) {
        visibleRef.current = true
        setVisible(true)
      }
    }

    function hideBar() {
      if (visibleRef.current) {
        visibleRef.current = false
        setVisible(false)
      }
    }

    function update() {
      frame = null

      if (shouldPinThreadHeader()) {
        showBar()
        upDistance = 0
        downDistance = 0
        return
      }

      const currentScrollY = readScrollY(pendingRoot)
      const delta = currentScrollY - lastScrollY
      lastScrollY = currentScrollY

      if (currentScrollY < 40) {
        showBar()
        upDistance = 0
        downDistance = 0
        return
      }

      if (delta > 0) {
        downDistance += delta
        upDistance = 0
        if (downDistance > 60) hideBar()
      } else if (delta < 0) {
        upDistance += -delta
        downDistance = 0
        if (upDistance > 30) showBar()
      }
    }

    function onScroll(event) {
      if (event.target?.closest?.('[data-navbar-ignore]')) return

      const root = resolveScrollRoot(event, scrollRootSelector)
      if (scrollRootSelector && !root) return

      pendingRoot = root
      if (frame === null) frame = window.requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })

    let bindObserver = null
    if (scrollRootSelector) {
      bindObserver = new MutationObserver(() => {
        const next = document.querySelector(scrollRootSelector)
        if (next && next !== pendingRoot) {
          pendingRoot = next
          lastScrollY = next.scrollTop
        }
      })
      bindObserver.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      cancelAnimationFrame(resetId)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll, { capture: true })
      bindObserver?.disconnect()
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [disabled, scrollRootSelector])

  return disabled ? true : visible
}
