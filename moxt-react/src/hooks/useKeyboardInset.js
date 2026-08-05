import { useEffect } from 'react'

/** Seuil anti faux-positifs (chrome Safari / URL bar ≈ 40–100px). */
export const KEYBOARD_OPEN_PX = 180

const BLUR_SYNC_DELAYS_MS = [0, 50, 120, 280, 450, 700, 1000]

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
export function isMessagesScrollLock(root) {
  return root.classList.contains('messages-route-lock')
}

/** @param {HTMLElement} root */
export function syncVisualViewportMetrics(root, vv) {
  const keyboardOpen = root.classList.contains('keyboard-open')
  if (isMessagesScrollLock(root) && !keyboardOpen) {
    root.style.setProperty('--visual-viewport-offset-top', '0px')
    return
  }
  const offsetTop = Math.max(0, Math.round(vv?.offsetTop ?? 0))
  root.style.setProperty('--visual-viewport-offset-top', `${offsetTop}px`)
}

/** @param {HTMLElement} root */
function syncViewportBottomGap(root, raw, { keyboardOpen = false } = {}) {
  const gap = isMessagesScrollLock(root) || keyboardOpen ? 0 : raw
  root.style.setProperty('--viewport-bottom-gap', `${gap}px`)
}

export function shouldPinThreadHeader() {
  return (
    document.documentElement.classList.contains('keyboard-open') ||
    isEditableField(document.activeElement)
  )
}

/** @param {HTMLElement} root */
export function applyKeyboardInsetState(root, raw, { editing = false } = {}) {
  syncVisualViewportMetrics(root, window.visualViewport)
  const open = editing && raw >= KEYBOARD_OPEN_PX
  root.style.setProperty('--keyboard-inset', open ? `${raw}px` : '0px')
  root.classList.toggle('keyboard-open', open)
  syncViewportBottomGap(root, raw, { keyboardOpen: open })
}

/** @param {HTMLElement} root */
export function forceKeyboardClosed(root) {
  syncVisualViewportMetrics(root, window.visualViewport)
  root.style.setProperty('--keyboard-inset', '0px')
  root.classList.remove('keyboard-open')
  syncViewportBottomGap(root, measureKeyboardInset(window.visualViewport))
}

const blurSyncTimers = new Set()

function resolveComposerBottomPx(vv) {
  if (!isEditableField(document.activeElement)) return 0
  const raw = measureKeyboardInset(vv)
  return raw >= KEYBOARD_OPEN_PX ? raw : 0
}

/**
 * iOS Safari omet parfois visualViewport.resize à la fermeture du clavier.
 * Re-mesure plusieurs fois après blur pour remettre le composer / la bottom nav en bas.
 */
export function syncKeyboardInsetAfterBlur() {
  const root = document.documentElement

  function run() {
    if (!isEditableField(document.activeElement)) {
      forceKeyboardClosed(root)
      return
    }
    applyKeyboardInsetState(root, measureKeyboardInset(window.visualViewport), {
      editing: true,
    })
  }

  blurSyncTimers.forEach((id) => clearTimeout(id))
  blurSyncTimers.clear()
  BLUR_SYNC_DELAYS_MS.forEach((ms) => {
    const id = setTimeout(run, ms)
    blurSyncTimers.add(id)
  })
}

/**
 * Offset bas du composer en px — 0 sauf clavier ouvert ET champ focus.
 * iOS peut laisser visualViewport « petit » après fermeture : on ignore sans focus.
 */
export function useMessageComposerBottom() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    function setComposerKeyboardBottom(px) {
      root.style.setProperty('--composer-keyboard-bottom', `${px}px`)
    }

    function syncComposer() {
      const px = resolveComposerBottomPx(vv)
      setComposerKeyboardBottom(px)
    }

    function syncAll() {
      const editing = isEditableField(document.activeElement)
      const raw = measureKeyboardInset(vv)
      if (!editing) {
        forceKeyboardClosed(root)
        setComposerKeyboardBottom(0)
        return
      }
      applyKeyboardInsetState(root, raw, { editing: true })
      setComposerKeyboardBottom(raw >= KEYBOARD_OPEN_PX ? raw : 0)
    }

    function onFocusIn(event) {
      if (isEditableField(event.target)) syncAll()
    }

    function onFocusOut(event) {
      if (!isEditableField(event.target)) return
      setComposerKeyboardBottom(0)
      syncKeyboardInsetAfterBlur()
      BLUR_SYNC_DELAYS_MS.forEach((ms) => {
        setTimeout(syncComposer, ms)
      })
    }

    syncAll()
    window.addEventListener('resize', syncAll)
    window.addEventListener('scroll', syncAll, { passive: true })
    document.addEventListener('focusin', onFocusIn, true)
    document.addEventListener('focusout', onFocusOut, true)
    vv?.addEventListener('resize', syncAll)
    vv?.addEventListener('scroll', syncAll)

    return () => {
      window.removeEventListener('resize', syncAll)
      window.removeEventListener('scroll', syncAll)
      document.removeEventListener('focusin', onFocusIn, true)
      document.removeEventListener('focusout', onFocusOut, true)
      vv?.removeEventListener('resize', syncAll)
      vv?.removeEventListener('scroll', syncAll)
      root.style.removeProperty('--composer-keyboard-bottom')
    }
  }, [])
}

/**
 * Suit le visual viewport pour la bottom nav (hors composer — géré par useMessageComposerBottom).
 */
export function useKeyboardInset() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    function update() {
      syncVisualViewportMetrics(root, vv)
      const editing = isEditableField(document.activeElement)
      const raw = measureKeyboardInset(vv)
      if (!editing) {
        forceKeyboardClosed(root)
        return
      }
      applyKeyboardInsetState(root, raw, { editing: true })
    }

    function onFocusIn(event) {
      if (isEditableField(event.target)) update()
    }

    function onFocusOut(event) {
      if (isEditableField(event.target)) syncKeyboardInsetAfterBlur()
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, { passive: true })
    document.addEventListener('focusin', onFocusIn, true)
    document.addEventListener('focusout', onFocusOut, true)
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
      document.removeEventListener('focusin', onFocusIn, true)
      document.removeEventListener('focusout', onFocusOut, true)
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      blurSyncTimers.forEach((id) => clearTimeout(id))
      blurSyncTimers.clear()
      root.style.removeProperty('--keyboard-inset')
      root.style.removeProperty('--viewport-bottom-gap')
      root.style.removeProperty('--visual-viewport-offset-top')
      root.classList.remove('keyboard-open')
    }
  }, [])
}
