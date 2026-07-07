import { describe, expect, it } from 'vitest'
import { countrySortRank, sortByCountryPriority } from './countryPriority.js'

describe('countryPriority', () => {
  it('priorise le pays de l utilisateur', () => {
    const sorted = sortByCountryPriority(
      [
        { id: 'b', country: 'RU', createdAt: '2026-01-02' },
        { id: 'a', country: 'BJ', createdAt: '2026-01-01' },
      ],
      'BJ',
      (item) => item.country,
    )
    expect(sorted.map((item) => item.id)).toEqual(['a', 'b'])
  })

  it('classe les pays inconnus en dernier', () => {
    expect(countrySortRank(null, 'BJ')).toBe(2)
    expect(countrySortRank('BJ', 'BJ')).toBe(0)
    expect(countrySortRank('RU', 'BJ')).toBe(1)
  })
})
