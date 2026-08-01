import { describe, expect, it } from 'vitest'
import reducer, {
  clearPlatformRates,
  resolveDirectedPlatformRate,
  selectPlatformFees,
  selectPlatformPair,
  setPlatformFees,
  setPlatformRates,
} from './platformRatesSlice'

describe('platformRatesSlice', () => {
  it('stores transfer and p2p rates per currency', () => {
    let state = reducer(undefined, { type: '@@init' })
    state = reducer(
      state,
      setPlatformRates({
        currency: 'XOF',
        kind: 'p2p',
        originToRub: 0.14,
        rubToOrigin: 7.1,
        updatedBy: 'admin-1',
      }),
    )
    expect(selectPlatformPair({ platformRates: state }, 'XOF', 'p2p')).toEqual({
      originToRub: 0.14,
      rubToOrigin: 7.1,
    })
    expect(selectPlatformPair({ platformRates: state }, 'XOF', 'transfer')).toEqual({
      originToRub: null,
      rubToOrigin: null,
    })
  })

  it('resolves directed rates with Frankfurter fallback', () => {
    const pair = { originToRub: 0.14, rubToOrigin: null }
    expect(resolveDirectedPlatformRate(pair, 'XOF', 'RUB', 'XOF', 0.13)).toBe(0.14)
    expect(resolveDirectedPlatformRate(pair, 'RUB', 'XOF', 'XOF', 7.5)).toBe(7.5)
  })

  it('clears a kind back to empty', () => {
    let state = reducer(
      undefined,
      setPlatformRates({
        currency: 'XOF',
        kind: 'transfer',
        originToRub: 0.12,
        rubToOrigin: 8,
      }),
    )
    state = reducer(state, clearPlatformRates({ currency: 'XOF', kind: 'transfer' }))
    expect(selectPlatformPair({ platformRates: state }, 'XOF', 'transfer')).toEqual({
      originToRub: null,
      rubToOrigin: null,
    })
  })

  it('returns a stable empty pair for missing currencies', () => {
    const state = { pairs: {}, fees: {}, updatedAt: null, updatedBy: null }
    const a = selectPlatformPair({ platformRates: state }, 'XOF', 'transfer')
    const b = selectPlatformPair({ platformRates: state }, 'XOF', 'transfer')
    expect(a).toBe(b)
  })

  it('stores platform fee percentages', () => {
    let state = reducer(undefined, { type: '@@init' })
    state = reducer(
      state,
      setPlatformFees({
        feePercent: 3,
        transferFeePercent: 1.5,
        p2pFeePercent: 0.5,
        updatedBy: 'admin-1',
      }),
    )
    expect(selectPlatformFees({ platformRates: state })).toEqual({
      feePercent: 3,
      transferFeePercent: 1.5,
      p2pFeePercent: 0.5,
    })
  })
})
