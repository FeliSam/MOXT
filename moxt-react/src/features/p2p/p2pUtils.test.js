import { describe, expect, it } from 'vitest'
import {
  applyP2PRateMargin,
  calculateP2PFee,
  clampP2PRateMargin,
  computeP2PReputation,
  formatCountdown,
  formatP2PRate,
  frankfurterRateForPair,
  isPastDue,
  P2P_CONFIG,
  p2pOrderStepIndex,
} from './p2pUtils'

describe('p2pUtils', () => {
  it('uses 0% platform fee by default', () => {
    expect(P2P_CONFIG.platformFeePercent).toBe(0)
    expect(calculateP2PFee(100_000, 'XOF')).toBe(0)
    expect(calculateP2PFee(100_000, 'XOF', 2)).toBe(2000)
  })

  it('applies signed margin on Frankfurter rate both ways', () => {
    expect(applyP2PRateMargin(0.1, 0)).toBe(0.1)
    expect(applyP2PRateMargin(0.1, 10)).toBeCloseTo(0.11)
    expect(applyP2PRateMargin(0.1, -10)).toBeCloseTo(0.09)
    expect(clampP2PRateMargin(40)).toBe(15)
    expect(clampP2PRateMargin(-40)).toBe(-15)
  })

  it('resolves Frankfurter pair direction', () => {
    const live = { originToRub: 0.13, rubToOrigin: 7.7 }
    expect(frankfurterRateForPair(live, 'XOF', 'RUB', 'XOF')).toBe(0.13)
    expect(frankfurterRateForPair(live, 'RUB', 'XOF', 'XOF')).toBe(7.7)
    expect(formatP2PRate(0.13672)).toBe('0.13672')
  })

  it('maps order steps and countdown helpers', () => {
    expect(p2pOrderStepIndex('created')).toBe(0)
    expect(p2pOrderStepIndex('waiting_payment')).toBe(1)
    expect(p2pOrderStepIndex('completed')).toBe(3)
    expect(formatCountdown(90_000)).toBe('01:30')
    expect(isPastDue(new Date(Date.now() - 1000).toISOString())).toBe(true)
  })

  it('computes public reputation from completed orders and reviews', () => {
    const stats = computeP2PReputation('u1', {
      orders: [
        { buyerId: 'u1', sellerId: 'u2', status: 'completed' },
        { buyerId: 'u1', sellerId: 'u2', status: 'cancelled' },
      ],
      reviews: [{ targetId: 'u1', targetType: 'user_profile', rating: 4 }],
    })
    expect(stats.completed).toBe(1)
    expect(stats.successRate).toBe(50)
    expect(stats.avgRating).toBe(4)
  })
})
