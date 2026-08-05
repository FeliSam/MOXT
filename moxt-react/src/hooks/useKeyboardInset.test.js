import { describe, expect, it } from 'vitest'
import {
  KEYBOARD_OPEN_PX,
  applyKeyboardInsetState,
  forceKeyboardClosed,
  measureKeyboardInset,
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
    applyKeyboardInsetState(root, 320, { editing: true })
    forceKeyboardClosed(root)
    expect(root.classList.contains('keyboard-open')).toBe(false)
    expect(root.style.getPropertyValue('--keyboard-inset')).toBe('0px')
  })
})
