import { describe, expect, it } from 'vitest'
import { DIRECTIONS, TRANSFER_LIMITS_POLICY } from './transferConfig'
import {
  calculateTransfer,
  getTransferPricing,
  roundMoneyUp,
  roundTransferInput,
  totalToPayFromReceived,
  validateTransferAmount,
} from './transferUtils'

function withAmountLimits(fn) {
  const previous = TRANSFER_LIMITS_POLICY.enforceAmountLimits
  TRANSFER_LIMITS_POLICY.enforceAmountLimits = true
  try {
    return fn()
  } finally {
    TRANSFER_LIMITS_POLICY.enforceAmountLimits = previous
  }
}

describe('calcul des transferts', () => {
  it('applique la marge et les frais inclus dans le montant saisi (XOF vers RUB)', () => {
    const result = calculateTransfer(50000, DIRECTIONS.BJ_TO_RU)

    expect(result.rate).toBeCloseTo(0.100485)
    expect(result.totalToPay).toBe(50000)
    expect(result.fees).toBe(1250)
    expect(result.amountSent).toBe(48750)
    expect(result.amountReceived).toBe(4899)
  })

  it('utilise les devises opposees dans le sens Russie vers Benin', () => {
    const result = calculateTransfer(1000, DIRECTIONS.RU_TO_BJ)

    expect(result.currencyFrom).toBe('RUB')
    expect(result.currencyTo).toBe('XOF')
    expect(result.totalToPay).toBe(1000)
    expect(result.amountSent).toBe(975)
    expect(result.amountReceived).toBe(roundMoneyUp(975 * result.rate))
  })

  it('applique la reduction d entreprise a la place de la marge plateforme', () => {
    const result = calculateTransfer(1000, DIRECTIONS.BJ_TO_RU, 2.5, 0.1, 'BJ', 5)

    expect(result.rateMarginPercent).toBe(5)
    expect(result.rate).toBeCloseTo(0.095)
    expect(result.totalToPay).toBe(1000)
    expect(result.fees).toBe(25)
    expect(result.amountSent).toBe(975)
    expect(result.amountReceived).toBe(93)
  })

  it('retrouve le total a payer depuis le montant exact a recevoir', () => {
    const back = totalToPayFromReceived(4900, DIRECTIONS.BJ_TO_RU, 2.5, 0.1, 'BJ', 5)

    expect(Number.isInteger(back)).toBe(true)
    expect(back).toBeGreaterThanOrEqual(50000)
    expect(back).toBe(roundMoneyUp(4900 / ((1 - 2.5 / 100) * 0.095)))
  })

  it('arrondit les montants a l entier superieur', () => {
    expect(roundMoneyUp(8810.56)).toBe(8811)
    expect(roundMoneyUp(8810)).toBe(8810)
    expect(roundTransferInput(8810.56)).toBe('8811')
    expect(roundTransferInput(6329.01)).toBe('6330')
    expect(roundMoneyUp(4275 + Number.EPSILON)).toBe(4275)
  })

  it('borne la reduction entre 0 et 15 %', () => {
    const high = calculateTransfer(1000, DIRECTIONS.BJ_TO_RU, 0, 1, 'BJ', 99)
    const low = calculateTransfer(1000, DIRECTIONS.BJ_TO_RU, 0, 1, 'BJ', -3)

    expect(high.rateMarginPercent).toBe(15)
    expect(high.rate).toBeCloseTo(0.85)
    expect(low.rateMarginPercent).toBe(0)
    expect(low.rate).toBe(1)
  })

  it('refuse un montant sous le minimum', () => {
    withAmountLimits(() => {
      expect(validateTransferAmount(999, DIRECTIONS.BJ_TO_RU, true)).toContain('minimum')
    })
  })

  it('applique un plafond plus bas aux comptes non verifies', () => {
    withAmountLimits(() => {
      expect(validateTransferAmount(600000, DIRECTIONS.BJ_TO_RU, false)).toContain('plafond')
      expect(validateTransferAmount(600000, DIRECTIONS.BJ_TO_RU, true)).toBeNull()
    })
  })

  it('applique le plafond mensuel cumule aux comptes non verifies', () => {
    withAmountLimits(() => {
      expect(validateTransferAmount(100000, DIRECTIONS.BJ_TO_RU, false, 450000)).toContain('mensuel')
      expect(validateTransferAmount(50000, DIRECTIONS.BJ_TO_RU, false, 450000)).toBeNull()
    })
  })

  it('utilise les seuils du pays d origine quand ils changent de devise', () => {
    withAmountLimits(() => {
      expect(validateTransferAmount(40, DIRECTIONS.BJ_TO_RU, false, 0, 'GH')).toContain('minimum')
      expect(validateTransferAmount(30000, DIRECTIONS.BJ_TO_RU, false, 0, 'GH')).toContain(
        'plafond',
      )
    })
  })

  it('ignore min et plafond quand la politique est désactivée', () => {
    expect(TRANSFER_LIMITS_POLICY.enforceAmountLimits).toBe(false)
    expect(validateTransferAmount(1, DIRECTIONS.BJ_TO_RU, false)).toBeNull()
    expect(validateTransferAmount(9_999_999, DIRECTIONS.BJ_TO_RU, false)).toBeNull()
  })

  it('reconstruit les frais et le total quand des anciens transferts n ont pas ces champs', () => {
    const result = getTransferPricing({
      amountSent: 50000,
      feePercent: 2.5,
    })

    expect(result.amountSent).toBe(50000)
    expect(result.fees).toBe(1250)
    expect(result.totalToPay).toBe(51250)
  })
})
