import { useEffect } from 'react'

/** Seuil anti faux-positifs (chrome Safari / URL bar ≈ 40–100px). */
const KEYBOARD_OPEN_PX = 180

/**
 * Tracks soft-keyboard height via visualViewport and exposes:
 * - CSS var `--keyboard-inset` (0 si pas un vrai clavier)
 * - class `keyboard-open` on <html>
 */
export function useKeyboardInset() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    function update() {
      const raw = vv
        ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
        : 0
      const open = raw >= KEYBOARD_OPEN_PX
      // Fermé → forcer 0 (pas de margin fantôme sur le composer).
      root.style.setProperty('--keyboard-inset', open ? `${raw}px` : '0px')
      root.classList.toggle('keyboard-open', open)
    }

    update()
    window.addEventListener('resize', update)
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      root.style.removeProperty('--keyboard-inset')
      root.classList.remove('keyboard-open')
    }
  }, [])
}
