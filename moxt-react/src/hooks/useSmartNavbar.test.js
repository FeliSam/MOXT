import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSmartNavbar } from './useSmartNavbar.js'

describe('useSmartNavbar', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('keyboard-open')
  })

  afterEach(() => {
    document.documentElement.classList.remove('keyboard-open')
  })

  it('reste visible quand disabled', () => {
    const { result } = renderHook(() => useSmartNavbar({ disabled: true }))
    expect(result.current).toBe(true)
  })

  it('masque le header après scroll bas dans la liste des conversations', async () => {
    const scrollRoot = document.createElement('div')
    scrollRoot.dataset.testid = 'messages-list-scroll'
    Object.defineProperty(scrollRoot, 'scrollTop', { value: 0, writable: true })
    Object.defineProperty(scrollRoot, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scrollRoot, 'clientHeight', { value: 400, configurable: true })
    document.body.appendChild(scrollRoot)

    const { result } = renderHook(() =>
      useSmartNavbar({ scrollRootSelector: '[data-testid="messages-list-scroll"]' }),
    )

    expect(result.current).toBe(true)

    await act(async () => {
      scrollRoot.scrollTop = 120
      scrollRoot.dispatchEvent(new Event('scroll', { bubbles: false }))
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })

    expect(result.current).toBe(false)

    document.body.removeChild(scrollRoot)
  })

  it('reste toujours visible dans un fil de conversation (smart nav désactivée)', async () => {
    const scrollRoot = document.createElement('div')
    scrollRoot.dataset.testid = 'message-scroll-region'
    Object.defineProperty(scrollRoot, 'scrollTop', { value: 0, writable: true })
    Object.defineProperty(scrollRoot, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scrollRoot, 'clientHeight', { value: 400, configurable: true })
    document.body.appendChild(scrollRoot)

    const { result } = renderHook(() => useSmartNavbar({ disabled: true }))

    await act(async () => {
      scrollRoot.scrollTop = 200
      scrollRoot.dispatchEvent(new Event('scroll', { bubbles: false }))
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })

    expect(result.current).toBe(true)

    document.body.removeChild(scrollRoot)
  })

  it('reste visible si le clavier est ouvert', async () => {
    document.documentElement.classList.add('keyboard-open')
    const scrollRoot = document.createElement('div')
    scrollRoot.dataset.testid = 'messages-list-scroll'
    Object.defineProperty(scrollRoot, 'scrollTop', { value: 0, writable: true })
    Object.defineProperty(scrollRoot, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scrollRoot, 'clientHeight', { value: 400, configurable: true })
    document.body.appendChild(scrollRoot)

    const { result } = renderHook(() =>
      useSmartNavbar({ scrollRootSelector: '[data-testid="messages-list-scroll"]' }),
    )

    await act(async () => {
      scrollRoot.scrollTop = 200
      scrollRoot.dispatchEvent(new Event('scroll', { bubbles: false }))
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })

    expect(result.current).toBe(true)

    document.body.removeChild(scrollRoot)
  })
})
