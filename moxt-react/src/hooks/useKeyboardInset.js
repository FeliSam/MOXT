import { useEffect } from 'react'

const KEYBOARD_OPEN_PX = 80

/**
 * Tracks soft-keyboard height via visualViewport and exposes:
 * - CSS var `--keyboard-inset`
 * - class `keyboard-open` on <html>
 */
export function useKeyboardInset() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    function update() {
      const inset = vv
        ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
        : 0
      root.style.setProperty('--keyboard-inset', `${inset}px`)
      root.classList.toggle('keyboard-open', inset >= KEYBOARD_OPEN_PX)
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
