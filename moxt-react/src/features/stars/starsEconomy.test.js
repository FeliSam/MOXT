import { describe, expect, it } from 'vitest'
import { DEFAULT_QUOTA_CONFIG } from './starsConfig'
import { applyConsume, quoteStarsSpend, twoConsumesOneSucceeds } from './starsEconomy'
import { resolveStarsActionCost } from './starsPricing'

describe('starsPricing', () => {
  it('résout les prix publication standard et vidéo', () => {
    expect(resolveStarsActionCost({ category: 'marketplace' })).toBe(20)
    expect(resolveStarsActionCost({ category: 'video' })).toBe(25)
  })

  it('résout les formules vedette', () => {
    expect(resolveStarsActionCost({ category: 'marketplace', formulaKey: 'featured_24h' })).toBe(45)
    expect(resolveStarsActionCost({ category: 'video', formulaKey: 'featured_7d' })).toBe(110)
  })

  it('résout les statuts à prix fixe', () => {
    expect(resolveStarsActionCost({ category: 'status', durationKey: '24h' })).toBe(15)
    expect(resolveStarsActionCost({ category: 'status', durationKey: '3d' })).toBe(28)
    expect(resolveStarsActionCost({ category: 'status', durationKey: '7d' })).toBe(40)
  })
})

describe('starsEconomy', () => {
  it('utilise d’abord le pool bonus, puis les Paid', () => {
    const quote = quoteStarsSpend({
      bonusAvailable: 30,
      paidAvailable: 20,
      category: 'marketplace',
    })
    expect(quote.bonus).toBe(20)
    expect(quote.paid).toBe(0)
    expect(quote.totalCost).toBe(20)
    expect(quote.insufficient).toBe(false)
  })

  it('complète avec des Paid si le pool bonus est insuffisant', () => {
    const quote = quoteStarsSpend({
      bonusAvailable: 5,
      paidAvailable: 25,
      category: 'video',
      formulaKey: 'standard',
    })
    expect(quote.bonus).toBe(5)
    expect(quote.paid).toBe(20)
    expect(quote.totalCost).toBe(25)
  })

  it('quote les statuts au prix total de la durée', () => {
    const quote = quoteStarsSpend({
      bonusAvailable: 10,
      paidAvailable: 50,
      category: 'status',
      durationKey: '7d',
    })
    expect(quote.totalCost).toBe(40)
    expect(quote.bonus).toBe(10)
    expect(quote.paid).toBe(30)
  })

  it('signale un solde insuffisant sans jamais passer en négatif', () => {
    const quote = quoteStarsSpend({
      bonusAvailable: 0,
      paidAvailable: 10,
      category: 'jobs',
      formulaKey: 'featured_7d',
    })
    expect(quote.insufficient).toBe(true)
    const applied = applyConsume({ bonus: 0, paid: 10 }, quote)
    expect(applied.ok).toBe(false)
  })

  it('n’autorise qu’un seul consume concurrent sur un solde juste', () => {
    const quote = quoteStarsSpend({
      bonusAvailable: 0,
      paidAvailable: 20,
      category: 'parcel',
    })
    const { first, second } = twoConsumesOneSucceeds({ bonus: 0, paid: 20 }, quote)
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(false)
  })

  it('lit le pool bonus mensuel depuis la config', () => {
    expect(DEFAULT_QUOTA_CONFIG.monthlyBonusPool.personal).toBe(30)
    expect(DEFAULT_QUOTA_CONFIG.monthlyBonusPool.business).toBe(100)
    expect(DEFAULT_QUOTA_CONFIG.enabled).toBe(true)
    expect(DEFAULT_QUOTA_CONFIG.rolloutPercent).toBe(100)
  })
})
