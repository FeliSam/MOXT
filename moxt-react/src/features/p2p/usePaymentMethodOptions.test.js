import { describe, expect, it } from 'vitest'
import { methodCountryForP2POffer } from './usePaymentMethodOptions'

describe('methodCountryForP2POffer', () => {
  it('uses RU banks when offering RUB, else origin country methods', () => {
    expect(methodCountryForP2POffer('RUB', 'BJ')).toBe('RU')
    expect(methodCountryForP2POffer('XOF', 'BJ')).toBe('BJ')
    expect(methodCountryForP2POffer('NGN', 'NG')).toBe('NG')
  })
})
