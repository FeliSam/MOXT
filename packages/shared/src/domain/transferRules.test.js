import { describe, expect, it } from 'vitest'
import { TRANSFER_STATUS } from './transferConfig.js'
import { transferFromRemoteRow } from './transferRemote.js'
import { transferNeedsClientAction } from './transferActionUtils.js'
import { getTransferPricing } from './transferPricing.js'

describe('transferRemote (partagé)', () => {
  it('fusionne le payload et calcule la tarification comme le web', () => {
    const t = transferFromRemoteRow({
      id: 't1',
      user_id: 'u1',
      status: 'pending_payment',
      direction: 'RU_TO_BJ',
      payload: JSON.stringify({ amountSent: 866.15, currencyFrom: 'RUB', exchanger: { name: 'MOXT' } }),
    })
    expect(t.amountSent).toBe(866.15)
    expect(t.currencyFrom).toBe('RUB')
    expect(t.userId).toBe('u1')
    expect(t.totalToPay).toBeGreaterThanOrEqual(866.15)
  })
})

describe('transferNeedsClientAction', () => {
  it('à votre tour : acceptation en attente ou refus', () => {
    expect(transferNeedsClientAction({ status: TRANSFER_STATUS.PENDING_ACCEPTANCE })).toBe(true)
    expect(transferNeedsClientAction({ status: TRANSFER_STATUS.DECLINED })).toBe(true)
    expect(transferNeedsClientAction({ status: TRANSFER_STATUS.COMPLETED })).toBe(false)
  })
  it('tarification par défaut', () => {
    expect(getTransferPricing({ amountSent: 100, fees: 2 }).totalToPay).toBe(102)
  })
})
