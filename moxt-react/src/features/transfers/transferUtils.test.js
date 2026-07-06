import { describe, expect, it } from 'vitest'
import { DIRECTIONS } from './transferConfig'
import { calculateTransfer, getTransferPricing, validateTransferAmount } from './transferUtils'

describe('calcul des transferts', () => {
  it('applique la marge et les frais sur un transfert XOF vers RUB', () => {
    const result = calculateTransfer(50000, DIRECTIONS.BJ_TO_RU)

    expect(result.rate).toBeCloseTo(0.100485)
    expect(result.amountReceived).toBeCloseTo(5024.25)
    expect(result.fees).toBe(1250)
    expect(result.totalToPay).toBe(51250)
  })

  it('utilise les devises opposees dans le sens Russie vers Benin', () => {
    const result = calculateTransfer(1000, DIRECTIONS.RU_TO_BJ)

    expect(result.currencyFrom).toBe('RUB')
    expect(result.currencyTo).toBe('XOF')
    expect(result.amountReceived).toBeCloseTo(9751.5)
  })

  it('adapte la devise locale au pays d origine', () => {
    const result = calculateTransfer(1000, DIRECTIONS.BJ_TO_RU, undefined, undefined, 'NG')

    expect(result.currencyFrom).toBe('NGN')
    expect(result.currencyTo).toBe('RUB')
    expect(result.sourceCountry).toBe('NG')
    expect(result.destinationCountry).toBe('RU')
  })

  it('refuse un montant sous le minimum', () => {
    expect(validateTransferAmount(999, DIRECTIONS.BJ_TO_RU, true)).toContain('minimum')
  })

  it('applique un plafond plus bas aux comptes non verifies', () => {
    expect(validateTransferAmount(600000, DIRECTIONS.BJ_TO_RU, false)).toContain('plafond')
    expect(validateTransferAmount(600000, DIRECTIONS.BJ_TO_RU, true)).toBeNull()
  })

  it('applique le plafond mensuel cumule aux comptes non verifies', () => {
    expect(validateTransferAmount(100000, DIRECTIONS.BJ_TO_RU, false, 450000)).toContain('mensuel')
    expect(validateTransferAmount(50000, DIRECTIONS.BJ_TO_RU, false, 450000)).toBeNull()
  })

  it('utilise les seuils du pays d origine quand ils changent de devise', () => {
    expect(validateTransferAmount(40, DIRECTIONS.BJ_TO_RU, false, 0, 'GH')).toContain('minimum')
    expect(validateTransferAmount(30000, DIRECTIONS.BJ_TO_RU, false, 0, 'GH')).toContain(
      'plafond',
    )
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
