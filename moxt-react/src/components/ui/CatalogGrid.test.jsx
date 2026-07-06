import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CatalogGrid } from './CatalogGrid'

describe('CatalogGrid', () => {
  it('applique la grille responsive commune 2, 3 puis 4 colonnes', () => {
    render(
      <CatalogGrid>
        <article>Élément</article>
      </CatalogGrid>,
    )
    const grid = screen.getByText('Élément').closest('section')
    expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'xl:grid-cols-4')
  })

  it('peut afficher immédiatement les cartes sans conteneur différé', () => {
    render(
      <CatalogGrid lazy={false}>
        <article data-testid="card">Carte directe</article>
      </CatalogGrid>,
    )

    expect(screen.getByTestId('card').parentElement).toHaveClass('grid')
  })
})
