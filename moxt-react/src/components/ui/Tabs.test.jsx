import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from './Tabs'

describe('Tabs', () => {
  it('permet la navigation au clavier', () => {
    const onChange = vi.fn()
    render(
      <Tabs
        active="first"
        onChange={onChange}
        items={[
          { value: 'first', label: 'Premier' },
          { value: 'second', label: 'Second' },
        ]}
      />,
    )
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Premier' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('second')
  })
})
