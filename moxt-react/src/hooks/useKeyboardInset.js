import { useEffect } from 'react'

/** Seuil anti faux-positifs (chrome Safari / URL bar ≈ 40–100px). */
export const KEYBOARD_OPEN_PX = 180

const BLUR_SYNC_DELAYS_MS = [0, 50, 120, 280, 450]

function isEditableField(el) {
  if (!el || !(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLInputElement) {
    const type = (el.type || 'text').toLowerCase()
    return !['button', 'checkbox', 'radio', 'submit', 'reset', 'file', 'hidden'].includes(type)
  }
  return false
}

/** @param {VisualViewport | null | undefined} vv */
export function measureKeyboardInset(vv) {
  if (!vv) return 0
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
}

/** @param {HTMLElement} root */
export function applyKeyboardInsetState(root, raw) {
  const open = raw >= KEYBOARD_OPEN_PX
  root.style.setProperty('--keyboard-inset', open ? `${raw}px` : '0px')
  root.classList.toggle('keyboard-open', open)
  root.style.setProperty('--viewport-bottom-gap', open ? '0px' : `${raw}px`)
}

/** @param {HTMLElement} root */
export function forceKeyboardClosed(root) {
  const raw = measureKeyboardInset(window.visualViewport)
  root.style.setProperty('--keyboard-inset', '0px')
  root.classList.remove('keyboard-open')
  root.style.setProperty('--viewport-bottom-gap', `${raw}px`)
}

const blurSyncTimers = new Set()

/**
 * iOS Safari omet parfois visualViewport.resize à la fermeture du clavier.
 * Re-mesure plusieurs fois après blur pour remettre le composer / la bottom nav en bas.
 */
export function syncKeyboardInsetAfterBlur() {
  const root = document.documentElement

  function run() {
    const raw = measureKeyboardInset(window.visualViewport)
    const editing = isEditableField(document.activeElement)
    if (!editing && raw < KEYBOARD_OPEN_PX) {
      forceKeyboardClosed(root)
      return
    }
    applyKeyboardInsetState(root, raw)
  }

  blurSyncTimers.forEach((id) => clearTimeout(id))
  blurSyncTimers.clear()
  BLUR_SYNC_DELAYS_MS.forEach((ms) => {
    const id = setTimeout(run, ms)
    blurSyncTimers.add(id)
  })
}

/**
 * Suit le visual viewport et expose deux mesures distinctes :
 *
 * - `--keyboard-inset` + classe `keyboard-open` : hauteur du clavier logiciel.
 * - `--viewport-bottom-gap` : écart entre le bas du *layout* viewport (sur
 *   lequel `position: fixed` se cale) et le bas réellement visible.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    function update() {
      applyKeyboardInsetState(root, measureKeyboardInset(vv))
    }

    function onFocusOut(event) {
      if (isEditableField(event.target)) {
        syncKeyboardInsetAfterBlur()
      }
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, { passive: true })
    document.addEventListener('focusout', onFocusOut, true)
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
      document.removeEventListener('focusout', onFocusOut, true)
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      blurSyncTimers.forEach((id) => clearTimeout(id))
      blurSyncTimers.clear()
      root.style.removeProperty('--keyboard-inset')
      root.style.removeProperty('--viewport-bottom-gap')
      root.classList.remove('keyboard-open')
    }
  }, [])
}
