import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LazyContent } from './LazyContent'

describe('LazyContent', () => {
  it('garde le contenu dans le DOM (rendu paresseux natif via content-visibility)', () => {
    const { container } = render(
      <LazyContent minHeight="9rem">
        <article>Contenu charge</article>
      </LazyContent>,
    )
    // Le contenu est immédiatement présent : trouvable par Ctrl+F et accessible.
    expect(screen.getByText('Contenu charge')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('lazy-content')
  })
})
