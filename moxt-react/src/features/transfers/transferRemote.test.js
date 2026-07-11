import { describe, expect, it } from 'vitest'
import { transferFromRemoteRow } from './transferRemote'

describe('transferRemote', () => {
  it('reconstruit les montants depuis amount et payload', () => {
    const transfer = transferFromRemoteRow({
      id: 'MXT-1',
      user_id: 'u1',
      direction: 'BJ_TO_RU',
      origin_country: 'BJ',
      amount: 100000,
      fee: 2500,
      status: 'declared',
      sender: { firstName: 'Jean' },
      recipient: { firstName: 'Ivan' },
      timeline: [],
      payload: {},
    })

    expect(transfer.amountSent).toBe(100000)
    expect(transfer.fees).toBe(2500)
    expect(transfer.totalToPay).toBe(102500)
    expect(transfer.currencyFrom).toBe('XOF')
    expect(transfer.currencyTo).toBe('RUB')
  })

  it('lit la reception depuis payload si colonnes absentes', () => {
    const transfer = transferFromRemoteRow({
      id: 'MXT-2',
      direction: 'BJ_TO_RU',
      amount: 50000,
      fee: 1000,
      status: 'completed',
      payload: {
        receivedAt: '2026-07-11T12:00:00.000Z',
        receivedMethod: 'cash',
        totalToPay: 51000,
        currencyFrom: 'XOF',
      },
      timeline: [],
    })

    expect(transfer.receivedAt).toBe('2026-07-11T12:00:00.000Z')
    expect(transfer.receivedMethod).toBe('cash')
    expect(transfer.totalToPay).toBe(51000)
    expect(transfer.currencyFrom).toBe('XOF')
  })
})
