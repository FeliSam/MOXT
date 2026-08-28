import { describe, expect, it } from 'vitest'
import { combinedBonusRemaining, mergeLinkedWalletBalances, totalStarsAvailable } from './starsWalletUi'

describe('totalStarsAvailable', () => {
  it('sums paid and the current bonus pool', () => {
    expect(totalStarsAvailable({ paid: 510, bonusPool: 30 })).toBe(540)
  })

  it('uses the combined personal + business + shared paid total', () => {
    expect(
      totalStarsAvailable({
        paid: 510,
        personalBonus: 30,
        businessBonus: 40,
        combinedTotal: 580,
      }),
    ).toBe(580)
  })
})

describe('combinedBonusRemaining', () => {
  it('adds personal and business pools', () => {
    expect(combinedBonusRemaining({ personalBonus: 60, businessBonus: 150 })).toBe(210)
  })
})

describe('mergeLinkedWalletBalances', () => {
  it('adds the company pool on top of the personal pool', () => {
    const merged = mergeLinkedWalletBalances(
      { bonusPool: 60, bonusPoolGranted: 60, paid: 510, quotas: { pool: 60 } },
      { bonusPool: 150, bonusPoolGranted: 150, quotas: { pool: 150 } },
      'BIZ-1',
    )
    expect(merged.linkedBusinessId).toBe('BIZ-1')
    expect(merged.personalBonus).toBe(60)
    expect(merged.businessBonus).toBe(150)
    expect(merged.bonusPool).toBe(210)
    expect(merged.combinedTotal).toBe(720)
  })
})
