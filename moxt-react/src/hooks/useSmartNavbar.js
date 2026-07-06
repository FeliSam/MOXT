import { useEffect, useRef, useState } from 'react'

export function useSmartNavbar({ disabled = false } = {}) {
  const [visible, setVisible] = useState(true)
  const visibleRef = useRef(true)

  useEffect(() => {
    if (disabled) return undefined

    // État local à cette exécution de l'effet — pas de WeakMap persistante
    // entre navigations qui causerait des lastY périmés.
    let lastScrollY = window.scrollY
    let upDistance = 0
    let downDistance = 0
    let frame = null

    function update() {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY
      lastScrollY = currentScrollY
      frame = null

      if (currentScrollY < 40) {
        // Proche du haut : toujours visible
        if (!visibleRef.current) {
          visibleRef.current = true
          setVisible(true)
        }
        upDistance = 0
        downDistance = 0
        return
      }

      if (delta > 0) {
        // Défilement vers le bas
        downDistance += delta
        upDistance = 0
        if (downDistance > 60 && visibleRef.current) {
          visibleRef.current = false
          setVisible(false)
        }
      } else if (delta < 0) {
        // Défilement vers le haut
        upDistance += -delta
        downDistance = 0
        if (upDistance > 30 && !visibleRef.current) {
          visibleRef.current = true
          setVisible(true)
        }
      }
    }

    function onScroll(event) {
      if (event.target?.closest?.('[data-navbar-ignore]')) return
      if (frame === null) frame = window.requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll, { capture: true })
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [disabled])

  return disabled ? true : visible
}
