import { describe, expect, it } from 'vitest'
import { TRANSFER_STATUS } from './transferConfig'
import {
  businessHasPublicationModules,
  computeBusinessTransferStats,
} from './businessTransferStats.js'

describe('businessHasPublicationModules', () => {
  it('détecte les modules publication', () => {
    expect(businessHasPublicationModules(['Transfert'])).toBe(false)
    expect(businessHasPublicationModules(['Transfert', 'Marketplace'])).toBe(true)
    expect(businessHasPublicationModules(['Jobs'])).toBe(true)
  })
})

describe('computeBusinessTransferStats', () => {
  it('agrège volumes, statuts et actions en attente', () => {
    const stats = computeBusinessTransferStats(
      [
        {
          id: '1',
          status: TRANSFER_STATUS.DECLARED,
          direction: 'BJ_TO_RU',
          originCountry: 'BJ',
          amountSent: 10000,
          fees: 250,
          totalToPay: 10250,
          amountReceived: 900,
          currencyFrom: 'XOF',
          currencyTo: 'RUB',
          createdAt: '2026-07-01T10:00:00.000Z',
          timeline: [
            { status: TRANSFER_STATUS.PENDING, at: '2026-07-01T10:00:00.000Z' },
            { status: TRANSFER_STATUS.DECLARED, at: '2026-07-01T11:00:00.000Z' },
          ],
        },
        {
          id: '2',
          status: TRANSFER_STATUS.COMPLETED,
          direction: 'RU_TO_BJ',
          originCountry: 'BJ',
          amountSent: 5000,
          fees: 125,
          totalToPay: 5125,
          amountReceived: 48000,
          currencyFrom: 'RUB',
          currencyTo: 'XOF',
          createdAt: '2026-06-15T10:00:00.000Z',
          timeline: [
            { status: TRANSFER_STATUS.DECLARED, at: '2026-06-15T10:00:00.000Z' },
            { status: TRANSFER_STATUS.RECEIVED, at: '2026-06-15T12:00:00.000Z' },
            { status: TRANSFER_STATUS.PAID_OUT, at: '2026-06-15T14:00:00.000Z' },
            { status: TRANSFER_STATUS.COMPLETED, at: '2026-06-15T16:00:00.000Z' },
          ],
        },
      ],
      { average: 4.5, count: 2 },
    )

    expect(stats.total).toBe(2)
    expect(stats.awaitingBusinessAction).toBe(1)
    expect(stats.completed).toBe(1)
    expect(stats.inPipeline).toBe(1)
    expect(stats.byStatus[TRANSFER_STATUS.DECLARED]).toBe(1)
    expect(stats.volumes.sent.find((row) => row.currency === 'XOF')?.amount).toBe(10000)
    expect(stats.volumes.fees.find((row) => row.currency === 'RUB')?.amount).toBe(125)
    expect(stats.averages.declaredToReceivedHours).toBe(2)
    expect(stats.averages.receivedToPayoutHours).toBe(2)
    expect(stats.rating.count).toBe(2)
  })

  it('gère une liste vide', () => {
    const stats = computeBusinessTransferStats([])
    expect(stats.total).toBe(0)
    expect(stats.awaitingBusinessAction).toBe(0)
    expect(stats.monthly).toHaveLength(6)
  })
})
