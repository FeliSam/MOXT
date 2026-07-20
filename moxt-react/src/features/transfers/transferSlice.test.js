import { beforeEach, describe, expect, it } from 'vitest'
import reducer, {
  cancelTransfer,
  createTransfer,
  declarePayment,
  expireOverdueTransfers,
  moderateTransfer,
} from './transferSlice'
import { DIRECTIONS, TRANSFER_STATUS } from './transferConfig'

const payload = {
  amount: 50000,
  direction: DIRECTIONS.BJ_TO_RU,
  user: { id: 'u1' },
  sender: { firstName: 'Amina', lastName: 'Demo', phone: '+22901', method: 'MTN MoMo' },
  recipient: { firstName: 'Ivan', lastName: 'Demo', phone: '+7900', method: 'Sberbank' },
  exchanger: {
    id: 'EXC-1',
    ownerId: 'business-owner',
    name: 'MOXT Change',
    rating: 4.9,
    averageDelay: '10 min',
    feePercent: 3,
  },
}

describe('transferSlice', () => {
  beforeEach(() => localStorage.clear())

  it('cree un transfert avec une echeance et une reference', () => {
    const action = createTransfer(payload)
    const state = reducer({ items: [] }, action)

    expect(state.items[0].id).toMatch(/^MXT-/)
    expect(state.items[0].status).toBe(TRANSFER_STATUS.PENDING)
    expect(state.items[0]).toMatchObject({
      businessId: 'EXC-1',
      businessOwnerId: 'business-owner',
      feePercent: 3,
    })
    expect(new Date(state.items[0].paymentDeadlineAt).getTime()).toBeGreaterThan(
      new Date(state.items[0].createdAt).getTime(),
    )
  })

  it('refuse un transfert cree avec sa propre entreprise', () => {
    const state = reducer(
      { items: [] },
      createTransfer({
        ...payload,
        user: { id: 'business-owner' },
      }),
    )

    expect(state.items).toHaveLength(0)
  })

  it('refuse un transfert sans proprietaire entreprise', () => {
    const state = reducer(
      { items: [] },
      createTransfer({
        ...payload,
        exchanger: { ...payload.exchanger, ownerId: null },
      }),
    )

    expect(state.items).toHaveLength(0)
  })

  it('autorise la declaration puis l annulation du paiement', () => {
    const created = reducer({ items: [] }, createTransfer(payload))
    const id = created.items[0].id
    const declared = reducer(created, declarePayment({ id, actorId: 'u1' }))
    const cancelled = reducer(declared, cancelTransfer({ id, actorId: 'u1' }))

    expect(declared.items[0].status).toBe(TRANSFER_STATUS.DECLARED)
    expect(cancelled.items[0].status).toBe(TRANSFER_STATUS.CANCELLED)
    expect(cancelled.items[0].timeline).toHaveLength(3)
  })

  it('refuse les actions entreprise au client createur', () => {
    const created = reducer({ items: [] }, createTransfer(payload))
    const id = created.items[0].id
    const declared = reducer(created, declarePayment({ id, actorId: 'u1' }))
    const spoofed = reducer(
      declared,
      moderateTransfer({ id, status: TRANSFER_STATUS.RECEIVED, actorId: 'u1' }),
    )
    expect(spoofed.items[0].status).toBe(TRANSFER_STATUS.DECLARED)
  })

  it('conserve les métadonnées de preuve et expire un paiement en retard', () => {
    const created = reducer({ items: [] }, createTransfer(payload))
    const id = created.items[0].id
    const declared = reducer(
      created,
      declarePayment({
        id,
        actorId: 'u1',
        proof: { name: 'preuve.pdf', size: 1200, type: 'application/pdf' },
      }),
    )
    expect(declared.items[0].paymentProof.name).toBe('preuve.pdf')

    const pending = {
      items: [
        {
          ...created.items[0],
          paymentDeadlineAt: '2020-01-01T00:00:00.000Z',
          timeline: [],
        },
      ],
    }
    const expired = reducer(pending, expireOverdueTransfers('2020-01-02T00:00:00.000Z'))
    expect(expired.items[0].status).toBe(TRANSFER_STATUS.EXPIRED)
  })

  it('impose des actions entreprise uniques et ordonnées', () => {
    const created = reducer({ items: [] }, createTransfer(payload))
    const id = created.items[0].id
    const declared = reducer(created, declarePayment({ id, actorId: 'u1' }))
    const invalid = reducer(
      declared,
      moderateTransfer({
        id,
        status: TRANSFER_STATUS.COMPLETED,
        actorId: 'business-owner',
      }),
    )
    expect(invalid.items[0].status).toBe(TRANSFER_STATUS.DECLARED)

    const received = reducer(
      invalid,
      moderateTransfer({ id, status: TRANSFER_STATUS.RECEIVED, actorId: 'business-owner' }),
    )
    const duplicate = reducer(
      received,
      moderateTransfer({ id, status: TRANSFER_STATUS.RECEIVED, actorId: 'business-owner' }),
    )
    expect(duplicate.items[0].status).toBe(TRANSFER_STATUS.RECEIVED)
    expect(duplicate.items[0].timeline).toHaveLength(received.items[0].timeline.length)

    const paidOut = reducer(
      duplicate,
      moderateTransfer({
        id,
        status: TRANSFER_STATUS.PAID_OUT,
        actorId: 'business-owner',
        proof: { name: 'virement.pdf' },
      }),
    )
    const paidOutWithoutProof = reducer(
      duplicate,
      moderateTransfer({
        id,
        status: TRANSFER_STATUS.PAID_OUT,
        actorId: 'business-owner',
      }),
    )
    expect(paidOutWithoutProof.items[0].status).toBe(TRANSFER_STATUS.RECEIVED)
    expect(paidOut.items[0].businessProof.name).toBe('virement.pdf')
    expect(paidOut.items[0].status).toBe(TRANSFER_STATUS.PAID_OUT)
    expect(paidOut.items[0].timeline).toHaveLength(4)
  })
})
