import { describe, expect, it } from 'vitest'
import {
  exchangeMethodCountryForP2POffer,
  methodCountryForP2POffer,
  receiveCountryForP2POffer,
} from './usePaymentMethodOptions'

describe('methodCountryForP2POffer', () => {
  it('uses RU banks when offering RUB, else origin country methods', () => {
    expect(methodCountryForP2POffer('RUB', 'BJ')).toBe('RU')
    expect(methodCountryForP2POffer('XOF', 'BJ')).toBe('BJ')
    expect(methodCountryForP2POffer('NGN', 'NG')).toBe('NG')
  })
})

describe('receiveCountryForP2POffer', () => {
  it('follows the currency received (toCurrency), not the one offered', () => {
    expect(receiveCountryForP2POffer('XOF', 'BJ')).toBe('BJ')
    expect(receiveCountryForP2POffer('RUB', 'BJ')).toBe('RU')
    expect(receiveCountryForP2POffer('RUB', 'NG')).toBe('RU')
  })
})

describe('exchangeMethodCountryForP2POffer', () => {
  it('matches receive country for the sought currency (method select)', () => {
    expect(exchangeMethodCountryForP2POffer('XOF', 'BJ')).toBe('BJ')
    expect(exchangeMethodCountryForP2POffer('RUB', 'BJ')).toBe('RU')
    expect(exchangeMethodCountryForP2POffer('NGN', 'NG')).toBe('NG')
  })
})
