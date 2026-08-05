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
export function isMessagesThreadImmersive(root) {
  return root.classList.contains('messages-thread-immersive')
}

/** Fil mobile ouvert — layout détail sans scroll lock document. */
export function isMessagesThreadDetail(root) {
  return root.classList.contains('messages-thread-detail')
}

function hasMessagesComposerChrome(root) {
  return isMessagesScrollLock(root) || isMessagesThreadDetail(root)
}

/** @param {HTMLElement} root */
export function syncVisualViewportMetrics(root, vv) {
  const keyboardOpen = root.classList.contains('keyboard-open')
  if (isMessagesThreadImmersive(root) && !keyboardOpen) {
    root.style.setProperty('--visual-viewport-offset-top', '0px')
    return
  }
  const offsetTop = Math.max(0, Math.round(vv?.offsetTop ?? 0))
  root.style.setProperty('--visual-viewport-offset-top', `${offsetTop}px`)
}

/** @param {HTMLElement} root */
function syncViewportBottomGap(root, raw, { keyboardOpen = false } = {}) {
  const gap = isMessagesThreadImmersive(root) || keyboardOpen ? 0 : raw
  root.style.setProperty('--viewport-bottom-gap', `${gap}px`)
}

/** @param {HTMLElement} root */
function setComposerKeyboardBottom(root, px) {
  root.style.setProperty('--composer-keyboard-bottom', `${Math.max(0, Math.round(px))}px`)
}

/** @param {HTMLElement} root */
function clearComposerKeyboardBottom(root) {
  root.style.setProperty('--composer-keyboard-bottom', '0px')
}

/** Re-mesure le gap Safari après retour liste messages ou changement de route. */
export function resyncViewportBottomGap(root = document.documentElement) {
  const vv = window.visualViewport
  const raw = measureKeyboardInset(vv)
  syncVisualViewportMetrics(root, vv)
  syncViewportBottomGap(root, raw, { keyboardOpen: root.classList.contains('keyboard-open') })
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
  const threadDetail = isMessagesThreadDetail(root)
  // resizes-content : raw peut être ~0 alors que le clavier est ouvert — on marque quand même open en fil.
  const open = editing && (raw >= KEYBOARD_OPEN_PX || threadDetail)
  root.style.setProperty('--keyboard-inset', open && raw >= KEYBOARD_OPEN_PX ? `${raw}px` : '0px')
  root.classList.toggle('keyboard-open', open)
  syncViewportBottomGap(root, raw, { keyboardOpen: open })
}

/** @param {HTMLElement} root */
export function forceKeyboardClosed(root) {
  syncVisualViewportMetrics(root, window.visualViewport)
  root.style.setProperty('--keyboard-inset', '0px')
  root.classList.remove('keyboard-open')
  syncViewportBottomGap(root, measureKeyboardInset(window.visualViewport))
  clearComposerKeyboardBottom(root)
}

/**
 * Point de sync unique : bottom nav, clavier global, composer messagerie.
 * @param {HTMLElement} root
 * @param {VisualViewport | null | undefined} vv
 */
export function syncKeyboardState(root, vv) {
  syncVisualViewportMetrics(root, vv)
  const editing = isEditableField(document.activeElement)
  const raw = measureKeyboardInset(vv)

  if (!editing) {
    forceKeyboardClosed(root)
    return
  }

  applyKeyboardInsetState(root, raw, { editing: true })
  const composerPx = hasMessagesComposerChrome(root) && raw >= KEYBOARD_OPEN_PX ? raw : 0
  setComposerKeyboardBottom(root, composerPx)
}

const blurSyncTimers = new Set()

/**
 * iOS Safari omet parfois visualViewport.resize à la fermeture du clavier.
 * Re-mesure plusieurs fois après blur pour remettre le composer / la bottom nav en bas.
 */
export function syncKeyboardInsetAfterBlur() {
  const root = document.documentElement
  const vv = window.visualViewport

  function run() {
    syncKeyboardState(root, vv)
  }

  blurSyncTimers.forEach((id) => clearTimeout(id))
  blurSyncTimers.clear()
  clearComposerKeyboardBottom(root)
  BLUR_SYNC_DELAYS_MS.forEach((ms) => {
    const id = setTimeout(run, ms)
    blurSyncTimers.add(id)
  })
}

/**
 * Suit visualViewport : bottom nav, clavier, composer messagerie (hook unique).
 */
export function useKeyboardInset() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    function update() {
      syncKeyboardState(root, vv)
    }

    function onFocusIn(event) {
      if (isEditableField(event.target)) update()
    }

    function onFocusOut(event) {
      if (!isEditableField(event.target)) return
      clearComposerKeyboardBottom(root)
      syncKeyboardInsetAfterBlur()
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
      root.style.removeProperty('--composer-keyboard-bottom')
      root.classList.remove('keyboard-open')
    }
  }, [])
}
