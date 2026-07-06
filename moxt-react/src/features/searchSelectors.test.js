import { describe, expect, it } from 'vitest'
import { filterSearchIndex } from './searchSelectors'

const index = [
  { type: 'business', title: 'MOXT Express', subtitle: 'Logistique', typeLabel: 'Entreprise' },
  { type: 'job', title: 'Développeur React', subtitle: 'Cotonou', typeLabel: 'Job' },
]

describe('global search', () => {
  it('filtre par texte et domaine', () => {
    expect(filterSearchIndex(index, 'react', 'all')).toHaveLength(1)
    expect(filterSearchIndex(index, '', 'business')).toHaveLength(1)
    expect(filterSearchIndex(index, 'moxt', 'job')).toHaveLength(0)
  })
})
