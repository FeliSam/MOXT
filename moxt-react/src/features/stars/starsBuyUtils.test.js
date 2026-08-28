import { describe, expect, it } from 'vitest'
import { packUnitPriceRub, purchaseDisplayLabel, sortStarsPacks } from './starsBuyUtils'

describe('starsBuyUtils', () => {
  it('sorts packs by sort_order', () => {
    const sorted = sortStarsPacks([
      { id: 'b', sort_order: 20, price_rub: 100 },
      { id: 'a', sort_order: 5, price_rub: 50 },
    ])
    expect(sorted.map((pack) => pack.id)).toEqual(['a', 'b'])
  })

  it('computes unit price', () => {
    expect(packUnitPriceRub({ stars: 50, bonus_stars: 0, price_rub: 149 })).toBe(3)
  })

  it('uses pack title in purchase label', () => {
    expect(
      purchaseDisplayLabel({ package_id: 'pack-50', stars: 50 }, [
        { id: 'pack-50', title: '50 Stars' },
      ]),
    ).toBe('50 Stars')
  })
})
