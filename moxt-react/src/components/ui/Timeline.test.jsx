import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Timeline } from './Timeline'

describe('Timeline', () => {
  it('présente une chronologie accessible', () => {
    render(<Timeline events={[{ status: 'created', at: '2026-06-15T10:00:00.000Z' }]} />)
    expect(screen.getByRole('list', { name: 'Chronologie' })).toBeInTheDocument()
    expect(screen.getByText('created')).toBeInTheDocument()
  })
})
