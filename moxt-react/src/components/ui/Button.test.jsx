import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('affiche son libelle et utilise le type button par defaut', () => {
    render(<Button>Continuer</Button>)

    expect(screen.getByRole('button', { name: 'Continuer' })).toHaveAttribute('type', 'button')
  })
})
