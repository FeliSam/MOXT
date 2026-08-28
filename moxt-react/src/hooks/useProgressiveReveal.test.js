import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useProgressiveReveal } from './useProgressiveReveal.js'

describe('useProgressiveReveal', () => {
  let observers

  beforeEach(() => {
    observers = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb, options) {
          this.cb = cb
          this.options = options
          observers.push(this)
        }
        observe() {}
        unobserve() {}
        disconnect() {}
        trigger(isIntersecting = true) {
          this.cb([{ isIntersecting, target: {} }])
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('précharge initial puis ajoute au fur et à mesure', () => {
    const items = Array.from({ length: 45 }, (_, i) => ({ id: `L${i}` }))
    const { result } = renderHook(() => useProgressiveReveal(items, { initial: 20, step: 20 }))

    expect(result.current.visibleItems).toHaveLength(20)
    expect(result.current.hasMore).toBe(true)

    act(() => {
      result.current.sentinelRef(document.createElement('div'))
    })
    expect(observers).toHaveLength(1)

    act(() => {
      observers[0]?.trigger(true)
    })
    expect(result.current.visibleItems).toHaveLength(40)

    act(() => {
      observers[observers.length - 1]?.trigger(true)
    })
    expect(result.current.visibleItems).toHaveLength(45)
    expect(result.current.hasMore).toBe(false)
  })

  it('repart de initial quand la liste change', () => {
    const first = Array.from({ length: 30 }, (_, i) => ({ id: `A${i}` }))
    const { result, rerender } = renderHook(
      ({ list }) => useProgressiveReveal(list, { initial: 20, step: 20 }),
      { initialProps: { list: first } },
    )

    act(() => {
      result.current.sentinelRef(document.createElement('div'))
    })
    act(() => {
      observers[0]?.trigger(true)
    })
    expect(result.current.visibleItems).toHaveLength(30)

    const second = Array.from({ length: 25 }, (_, i) => ({ id: `B${i}` }))
    rerender({ list: second })
    expect(result.current.visibleItems).toHaveLength(20)
    expect(result.current.hasMore).toBe(true)
  })
})
