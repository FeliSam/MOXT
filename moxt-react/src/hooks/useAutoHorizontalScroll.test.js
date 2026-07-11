import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  getLoopWidth,
  nextScrollLeft,
  normalizeLoopPosition,
  useAutoHorizontalScroll,
} from './useAutoHorizontalScroll'

function mockTrack(children, scrollLeft = 0) {
  return {
    scrollLeft,
    scrollWidth: 2000,
    clientWidth: 300,
    children,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    scrollTo: vi.fn(),
  }
}

describe('useAutoHorizontalScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('avance le carrousel automatiquement', () => {
    const el = mockTrack([{ offsetLeft: 0 }, { offsetLeft: 320 }, { offsetLeft: 640 }])
    const ref = { current: el }

    renderHook(() => useAutoHorizontalScroll(ref))

    vi.advanceTimersByTime(4500)
    expect(el.scrollTo).toHaveBeenCalledWith({ left: 320, behavior: 'smooth' })
  })

  it('reboucle vers le clone en mode loop', () => {
    const el = mockTrack(
      [
        { offsetLeft: 0 },
        { offsetLeft: 320 },
        { offsetLeft: 640 },
        { offsetLeft: 960 },
        { offsetLeft: 1280 },
        { offsetLeft: 1600 },
      ],
      640,
    )
    const ref = { current: el }

    renderHook(() => useAutoHorizontalScroll(ref, { loop: true }))
    vi.advanceTimersByTime(4500)

    expect(el.scrollTo).toHaveBeenCalledWith({ left: 960, behavior: 'smooth' })
  })
})

describe('loop helpers', () => {
  it('calcule la largeur de boucle au milieu du carrousel', () => {
    const el = {
      children: [{ offsetLeft: 0 }, { offsetLeft: 300 }, { offsetLeft: 600 }, { offsetLeft: 900 }],
    }
    expect(getLoopWidth(el)).toBe(600)
  })

  it('normalise la position quand on entre dans le clone', () => {
    const el = { scrollLeft: 620 }
    normalizeLoopPosition(el, 600)
    expect(el.scrollLeft).toBe(20)
  })

  it('passe au clone quand la fin est atteinte', () => {
    const el = {
      scrollLeft: 580,
      children: [{ offsetLeft: 0 }, { offsetLeft: 300 }, { offsetLeft: 600 }, { offsetLeft: 900 }],
    }
    expect(nextScrollLeft(el, 600)).toBe(600)
  })
})
