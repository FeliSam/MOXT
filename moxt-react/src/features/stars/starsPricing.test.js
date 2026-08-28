import { describe, expect, it } from 'vitest'
import { resolveStarsActionCost, resolveBoostCost } from './starsPricing'

describe('starsPricing', () => {
  it('expose les formules vedette distinctes du standard', () => {
    expect(resolveStarsActionCost({ category: 'marketplace', formulaKey: 'standard' })).toBe(20)
    expect(resolveStarsActionCost({ category: 'marketplace', formulaKey: 'featured_24h' })).toBe(45)
    expect(resolveStarsActionCost({ category: 'marketplace', formulaKey: 'featured_7d' })).toBe(90)
  })

  it('résout le coût boost standalone', () => {
    expect(resolveBoostCost({ entityType: 'marketplace', durationKey: '24h' })).toBe(25)
    expect(resolveBoostCost({ entityType: 'video', durationKey: '7d' })).toBe(125)
  })
})
