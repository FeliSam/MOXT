import { describe, expect, it } from 'vitest'
import {
  COUNTRY_CURRENCIES,
  FALLBACK_RUB_TO_CURRENCY,
} from './transferConfig'

/** Devises pour lesquelles un corridor de transfert est réellement ouvert. */
const OPEN_CORRIDOR_CURRENCIES = ['XOF', 'XAF', 'GHS', 'NGN', 'KES', 'UGX', 'TZS', 'RWF']

describe('taux de secours', () => {
  it('couvre toutes les devises des corridors ouverts', () => {
    for (const currency of OPEN_CORRIDOR_CURRENCIES) {
      expect(FALLBACK_RUB_TO_CURRENCY[currency], `devise manquante : ${currency}`).toBeGreaterThan(0)
    }
  })

  it('ne référence que des devises réellement utilisées par un pays', () => {
    const known = new Set(Object.values(COUNTRY_CURRENCIES))
    for (const currency of Object.keys(FALLBACK_RUB_TO_CURRENCY)) {
      expect(known.has(currency), `devise inconnue : ${currency}`).toBe(true)
    }
  })

  it('expose des taux strictement positifs et finis', () => {
    for (const [currency, rate] of Object.entries(FALLBACK_RUB_TO_CURRENCY)) {
      expect(Number.isFinite(rate), `taux non fini : ${currency}`).toBe(true)
      expect(rate).toBeGreaterThan(0)
    }
  })
})
