import { describe, expect, it } from 'vitest'
import {
  KEYBOARD_OPEN_PX,
  applyKeyboardInsetState,
  forceKeyboardClosed,
  isMessagesScrollLock,
  isMessagesThreadImmersive,
  measureKeyboardInset,
  resyncViewportBottomGap,
  syncKeyboardState,
} from './useKeyboardInset.js'

describe('useKeyboardInset helpers', () => {
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

  it('compense le gap viewport sur la liste messages', () => {
    const root = document.createElement('html')
    root.classList.add('messages-route-lock')
    applyKeyboardInsetState(root, KEYBOARD_OPEN_PX + 40, { editing: false })
    expect(root.style.getPropertyValue('--viewport-bottom-gap')).toBe(`${KEYBOARD_OPEN_PX + 40}px`)
    expect(isMessagesScrollLock(root)).toBe(true)
    expect(isMessagesThreadImmersive(root)).toBe(false)
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
})
