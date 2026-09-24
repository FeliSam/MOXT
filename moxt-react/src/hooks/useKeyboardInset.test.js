import { describe, expect, it, beforeEach } from 'vitest'
import {
  KEYBOARD_OPEN_PX,
  applyKeyboardInsetState,
  chromeViewportBottomGap,
  clearComposerKeyboardSuppress,
  dockComposerAfterKeyboardClosed,
  forceKeyboardClosed,
  isMessagesScrollLock,
  isMessagesThreadImmersive,
  measureKeyboardInset,
  resetKeyboardAfterBackground,
  resolveComposerKeyboardBottom,
  resyncViewportBottomGap,
  setIosNativeKeyboardOpen,
  suppressComposerKeyboardBottom,
  syncKeyboardState,
} from './useKeyboardInset.js'

describe('useKeyboardInset helpers', () => {
  beforeEach(() => {
    setIosNativeKeyboardOpen(false)
    clearComposerKeyboardSuppress()
  })

  it('mesure l inset clavier depuis visualViewport', () => {
    expect(
      measureKeyboardInset({
        height: 500,
        offsetTop: 0,
      }),
    ).toBe(Math.max(0, Math.round(window.innerHeight - 500)))
  })

  it('applique keyboard-open seulement si le champ est focus', () => {
    const root = document.createElement('html')
    applyKeyboardInsetState(root, KEYBOARD_OPEN_PX + 40, { editing: true })
    expect(root.classList.contains('keyboard-open')).toBe(true)
    expect(root.style.getPropertyValue('--keyboard-inset')).toBe(`${KEYBOARD_OPEN_PX + 40}px`)

    applyKeyboardInsetState(root, KEYBOARD_OPEN_PX + 40, { editing: false })
    expect(root.classList.contains('keyboard-open')).toBe(false)
    expect(root.style.getPropertyValue('--keyboard-inset')).toBe('0px')
  })

  it('force la fermeture clavier', () => {
    const root = document.createElement('html')
    root.classList.add('messages-route-lock')
    applyKeyboardInsetState(root, 320, { editing: true })
    root.style.setProperty('--composer-keyboard-bottom', '320px')
    forceKeyboardClosed(root)
    expect(root.classList.contains('keyboard-open')).toBe(false)
    expect(root.style.getPropertyValue('--keyboard-inset')).toBe('0px')
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe('0px')
  })

  it('compense uniquement un gap chrome (pas un faux clavier) hors keyboard-open', () => {
    const root = document.createElement('html')
    root.classList.add('messages-route-lock')
    applyKeyboardInsetState(root, 72, { editing: false })
    expect(root.style.getPropertyValue('--viewport-bottom-gap')).toBe('72px')
    applyKeyboardInsetState(root, KEYBOARD_OPEN_PX + 40, { editing: false })
    expect(root.style.getPropertyValue('--viewport-bottom-gap')).toBe('0px')
    expect(isMessagesScrollLock(root)).toBe(true)
    expect(isMessagesThreadImmersive(root)).toBe(false)
  })

  it('chromeViewportBottomGap ignore les écarts taille clavier hors open/immersive', () => {
    expect(chromeViewportBottomGap(64)).toBe(64)
    expect(chromeViewportBottomGap(KEYBOARD_OPEN_PX)).toBe(0)
    expect(chromeViewportBottomGap(KEYBOARD_OPEN_PX + 80)).toBe(0)
    expect(chromeViewportBottomGap(320, { keyboardOpen: true })).toBe(0)
    expect(chromeViewportBottomGap(48, { immersive: true })).toBe(0)
  })

  it('resolveComposerKeyboardBottom ignore iOS Native, suppress et fermeture focus', () => {
    expect(
      resolveComposerKeyboardBottom(320, {
        editing: true,
        hasComposerChrome: true,
      }),
    ).toBe(320)
    expect(
      resolveComposerKeyboardBottom(320, {
        editing: true,
        hasComposerChrome: true,
        iosNative: true,
      }),
    ).toBe(0)
    expect(
      resolveComposerKeyboardBottom(320, {
        editing: true,
        hasComposerChrome: true,
        suppressed: true,
      }),
    ).toBe(0)
    expect(
      resolveComposerKeyboardBottom(320, {
        editing: true,
        hasComposerChrome: true,
        closingWhileFocused: true,
      }),
    ).toBe(0)
    expect(
      resolveComposerKeyboardBottom(80, {
        editing: true,
        hasComposerChrome: true,
      }),
    ).toBe(0)
    expect(
      resolveComposerKeyboardBottom(320, {
        editing: false,
        hasComposerChrome: true,
      }),
    ).toBe(0)
  })

  it('ignore le gap viewport en fil immersif', () => {
    const root = document.createElement('html')
    root.classList.add('messages-route-lock', 'messages-thread-immersive')
    applyKeyboardInsetState(root, KEYBOARD_OPEN_PX + 40, { editing: false })
    expect(root.style.getPropertyValue('--viewport-bottom-gap')).toBe('0px')
    expect(root.style.getPropertyValue('--visual-viewport-offset-top')).toBe('0px')
    forceKeyboardClosed(root)
    expect(root.style.getPropertyValue('--viewport-bottom-gap')).toBe('0px')
  })

  it('resyncViewportBottomGap remet la compensation liste messages', () => {
    const root = document.createElement('html')
    root.classList.add('messages-route-lock')
    root.style.setProperty('--viewport-bottom-gap', '0px')
    resyncViewportBottomGap(root)
    expect(root.style.getPropertyValue('--viewport-bottom-gap')).toBe(
      `${Math.max(0, Math.round(window.innerHeight - (window.visualViewport?.height ?? window.innerHeight)))}px`,
    )
  })

  it('syncKeyboardState remet composer et clavier à zéro sans focus', () => {
    const root = document.createElement('html')
    root.classList.add('messages-route-lock')
    root.classList.add('keyboard-open')
    root.style.setProperty('--composer-keyboard-bottom', '300px')
    syncKeyboardState(root, window.visualViewport)
    expect(root.classList.contains('keyboard-open')).toBe(false)
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe('0px')
  })

  it('détail mobile : composer-keyboard-bottom quand clavier en overlay', () => {
    const root = document.createElement('html')
    root.classList.add('messages-thread-detail')
    const input = document.createElement('textarea')
    document.body.appendChild(input)
    input.focus()
    const inset = KEYBOARD_OPEN_PX + 40
    syncKeyboardState(root, {
      height: window.innerHeight - inset,
      offsetTop: 0,
    })
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe(`${inset}px`)
    expect(root.classList.contains('keyboard-open')).toBe(true)
    input.remove()
  })

  it('détail mobile : keyboard-open sans offset si viewport redimensionné (resizes-content)', () => {
    const root = document.createElement('html')
    root.classList.add('messages-thread-detail')
    const input = document.createElement('textarea')
    document.body.appendChild(input)
    input.focus()
    syncKeyboardState(root, {
      height: window.innerHeight - 50,
      offsetTop: 0,
    })
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe('0px')
    expect(root.classList.contains('keyboard-open')).toBe(true)
    input.remove()
  })

  it('iOS natif : jamais d offset composer overlay (resize Native)', () => {
    const root = document.createElement('html')
    root.classList.add('capacitor-ios', 'messages-thread-detail')
    const input = document.createElement('textarea')
    document.body.appendChild(input)
    input.focus()
    const inset = KEYBOARD_OPEN_PX + 80
    syncKeyboardState(root, {
      height: window.innerHeight - inset,
      offsetTop: 0,
    })
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe('0px')
    input.remove()
  })

  it('hide/dock : suppress empêche un VV périmé de soulever le composer avec focus', () => {
    const root = document.createElement('html')
    root.classList.add('messages-thread-detail')
    const input = document.createElement('textarea')
    document.body.appendChild(input)
    input.focus()
    const inset = KEYBOARD_OPEN_PX + 100
    syncKeyboardState(root, {
      height: window.innerHeight - inset,
      offsetTop: 0,
    })
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe(`${inset}px`)

    dockComposerAfterKeyboardClosed(root)
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe('0px')

    // Focus encore là + VV encore réduit : ne pas re-soulever.
    syncKeyboardState(root, {
      height: window.innerHeight - inset,
      offsetTop: 0,
    })
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe('0px')
    input.remove()
  })

  it('chute d inset pendant focus : recoller le composer (fermeture sans blur)', () => {
    const root = document.createElement('html')
    root.classList.add('messages-thread-detail')
    const input = document.createElement('textarea')
    document.body.appendChild(input)
    input.focus()
    const inset = KEYBOARD_OPEN_PX + 60
    syncKeyboardState(root, {
      height: window.innerHeight - inset,
      offsetTop: 0,
    })
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe(`${inset}px`)

    syncKeyboardState(root, {
      height: window.innerHeight - 40,
      offsetTop: 0,
    })
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe('0px')
    input.remove()
  })

  it('iOS natif : clavier Native sans double offset overlay', () => {
    const root = document.createElement('html')
    root.classList.add('capacitor-ios')
    setIosNativeKeyboardOpen(true)
    syncKeyboardState(root, {
      height: window.innerHeight,
      offsetTop: 0,
    })
    expect(root.classList.contains('keyboard-open')).toBe(true)
    expect(root.style.getPropertyValue('--keyboard-inset')).toBe('0px')
    expect(root.style.getPropertyValue('--composer-keyboard-bottom')).toBe('0px')
    setIosNativeKeyboardOpen(false)
    syncKeyboardState(root, {
      height: window.innerHeight,
      offsetTop: 0,
    })
    expect(root.classList.contains('keyboard-open')).toBe(false)
  })

  it('resetKeyboardAfterBackground lâche le latch iOS et keyboard-open', () => {
    const root = document.createElement('html')
    root.classList.add('capacitor-ios', 'keyboard-open')
    setIosNativeKeyboardOpen(true)
    const input = document.createElement('textarea')
    document.body.appendChild(input)
    input.focus()
    resetKeyboardAfterBackground(root)
    expect(root.classList.contains('keyboard-open')).toBe(false)
    expect(root.style.getPropertyValue('--keyboard-inset')).toBe('0px')
    expect(document.activeElement === input).toBe(false)
    syncKeyboardState(root, {
      height: window.innerHeight,
      offsetTop: 0,
    })
    expect(root.classList.contains('keyboard-open')).toBe(false)
    input.remove()
  })

  it('suppressComposerKeyboardBottom est actif puis relâché', () => {
    suppressComposerKeyboardBottom(50)
    expect(
      resolveComposerKeyboardBottom(320, {
        editing: true,
        hasComposerChrome: true,
        suppressed: true,
      }),
    ).toBe(0)
    clearComposerKeyboardSuppress()
    expect(
      resolveComposerKeyboardBottom(320, {
        editing: true,
        hasComposerChrome: true,
        suppressed: false,
      }),
    ).toBe(320)
  })
})
