import { describe, expect, it } from 'vitest'
import {
  applyP2PRateMargin,
  calculateP2PFee,
  clampP2PRateMargin,
  formatP2PRate,
  frankfurterRateForPair,
  P2P_CONFIG,
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
})
