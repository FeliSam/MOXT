import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SwipeToAccept } from './SwipeToAccept'

describe('SwipeToAccept', () => {
  it('appelle onComplete avec End', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<SwipeToAccept label="Glisser pour accepter" onComplete={onComplete} />)

    fireEvent.keyDown(screen.getByRole('slider', { name: 'Glisser pour accepter' }), {
      key: 'End',
    })
    vi.advanceTimersByTime(200)

    expect(onComplete).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
