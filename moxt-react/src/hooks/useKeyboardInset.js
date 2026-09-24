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

let iosNativeKeyboardOpen = false

export function setIosNativeKeyboardOpen(open) {
  iosNativeKeyboardOpen = Boolean(open)
}

function isIosNativeShell(root) {
  return root.classList.contains('capacitor-ios')
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

/**
 * Compense uniquement le chrome navigateur (barre d’URL ≈ 40–100px).
 * Un écart « taille clavier » sans `.keyboard-open` est quasi toujours un
 * visualViewport périmé (1er paint WebView, blur iOS, retour de route) :
 * l’appliquer soulève la bottom nav au milieu du contenu.
 * @param {number} raw
 * @param {{ keyboardOpen?: boolean, immersive?: boolean }} [opts]
 */
export function chromeViewportBottomGap(raw, { keyboardOpen = false, immersive = false } = {}) {
  if (immersive || keyboardOpen) return 0
  const gap = Math.max(0, Math.round(Number(raw) || 0))
  return gap >= KEYBOARD_OPEN_PX ? 0 : gap
}

/** @param {HTMLElement} root */
function syncViewportBottomGap(root, raw, { keyboardOpen = false } = {}) {
  const gap = chromeViewportBottomGap(raw, {
    keyboardOpen,
    immersive: isMessagesThreadImmersive(root),
  })
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
 * iOS often skips keyboardWillHide when the app is backgrounded.
 * Clear the native-open latch so resume cannot leave `.keyboard-open`
 * (bottom nav `pointer-events: none`) or a mismatched WKWebView frame.
 */
export function resetKeyboardAfterBackground(root = document.documentElement) {
  setIosNativeKeyboardOpen(false)
  if (typeof document !== 'undefined') {
    const active = document.activeElement
    if (isEditableField(active)) active.blur()
  }
  forceKeyboardClosed(root)
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

  if (isIosNativeShell(root) && iosNativeKeyboardOpen) {
    root.style.setProperty('--keyboard-inset', '0px')
    root.classList.add('keyboard-open')
    syncViewportBottomGap(root, 0, { keyboardOpen: true })
    clearComposerKeyboardBottom(root)
    return
  }

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

    const settleTimers = new Set()
    function settle() {
      update()
      // WebView / Safari : innerHeight vs visualViewport souvent faux au 1er paint.
      settleTimers.forEach((id) => clearTimeout(id))
      settleTimers.clear()
      ;[0, 50, 150, 400].forEach((ms) => {
        settleTimers.add(window.setTimeout(update, ms))
      })
    }

    settle()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('orientationchange', settle)
    window.addEventListener('pageshow', settle)
    document.addEventListener('focusin', onFocusIn, true)
    document.addEventListener('focusout', onFocusOut, true)
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)

    let removeShow
    let removeHide
    let cancelled = false
    if (root.classList.contains('capacitor-ios')) {
      import('@capacitor/keyboard')
        .then(({ Keyboard }) => {
          if (cancelled) return
          return Promise.all([
            Keyboard.addListener('keyboardWillShow', () => {
              setIosNativeKeyboardOpen(true)
              update()
            }),
            Keyboard.addListener('keyboardDidShow', () => {
              setIosNativeKeyboardOpen(true)
              update()
            }),
            Keyboard.addListener('keyboardWillHide', () => {
              setIosNativeKeyboardOpen(false)
              update()
            }),
            Keyboard.addListener('keyboardDidHide', () => {
              setIosNativeKeyboardOpen(false)
              update()
            }),
          ]).then(([willShow, didShow, willHide, didHide]) => {
            removeShow = () => {
              willShow.remove()
              didShow.remove()
            }
            removeHide = () => {
              willHide.remove()
              didHide.remove()
            }
          })
        })
        .catch(() => {})
    }

    return () => {
      cancelled = true
      removeShow?.()
      removeHide?.()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
      window.removeEventListener('orientationchange', settle)
      window.removeEventListener('pageshow', settle)
      document.removeEventListener('focusin', onFocusIn, true)
      document.removeEventListener('focusout', onFocusOut, true)
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      settleTimers.forEach((id) => clearTimeout(id))
      settleTimers.clear()
      blurSyncTimers.forEach((id) => clearTimeout(id))
      blurSyncTimers.clear()
      setIosNativeKeyboardOpen(false)
      root.style.removeProperty('--keyboard-inset')
      root.style.removeProperty('--viewport-bottom-gap')
      root.style.removeProperty('--visual-viewport-offset-top')
      root.style.removeProperty('--composer-keyboard-bottom')
      root.classList.remove('keyboard-open')
    }
  }, [])
}
