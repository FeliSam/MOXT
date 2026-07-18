import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogSearch } from './CatalogSearch'

vi.mock('../../contexts/useLanguage', () => ({
  useLanguage: () => ({
    t: (key, vars) => {
      const map = {
        'catalog.search.label': 'Rechercher',
        'catalog.search.placeholder': 'Rechercher',
        'catalog.search.clearSearch': 'Effacer la recherche',
        'catalog.search.filters': 'Filtres',
        'catalog.search.results': `${vars?.count ?? 0} résultat`,
        'catalog.search.resultsPlural': `${vars?.count ?? 0} résultats`,
        'catalog.search.advancedTitle': 'Filtres avancés',
        'catalog.search.advancedDescription': 'Affinez les résultats avec plusieurs critères.',
        'catalog.search.clearAll': 'Tout effacer',
      }
      return map[key] || key
    },
  }),
}))

describe('CatalogSearch', () => {
  it('transmet la recherche et ouvre les filtres avances', () => {
    const onQueryChange = vi.fn()
    const onToggleAdvanced = vi.fn()

    const { rerender } = render(
      <CatalogSearch
        advancedOpen={false}
        count={7}
        query=""
        onQueryChange={onQueryChange}
        onToggleAdvanced={onToggleAdvanced}
        onClear={vi.fn()}
        placeholder="Rechercher"
      >
        <div>Filtres métier</div>
      </CatalogSearch>,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Rechercher' }), {
      target: { value: 'Cotonou' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Filtres' }))

    expect(onQueryChange).toHaveBeenCalledWith('Cotonou')
    expect(onToggleAdvanced).toHaveBeenCalled()

    rerender(
      <CatalogSearch
        advancedOpen
        count={3}
        query="Cotonou"
        onQueryChange={onQueryChange}
        onToggleAdvanced={onToggleAdvanced}
        onClear={vi.fn()}
        placeholder="Rechercher"
      >
        <div>Filtres métier</div>
      </CatalogSearch>,
    )

    expect(screen.getByText('Filtres métier')).toBeVisible()
    expect(screen.getByText('3 résultats')).toBeVisible()
  })
})
