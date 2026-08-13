import { beforeEach, describe, expect, it } from 'vitest'
import reducer, {
  acceptTransferRequest,
  cancelTransfer,
  createTransfer,
  declarePayment,
  declineTransferRequest,
  expireOverdueTransfers,
  moderateTransfer,
  reassignTransferExchanger,
  receiveRemoteTransfer,
} from './transferSlice'
import { canRevealPaymentDetails, canClientDeclarePayment } from './transferAcceptanceUtils'
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
    expect(state.items[0].acceptanceRequired).toBe(false)
    expect(state.items[0]).toMatchObject({
      businessId: 'EXC-1',
      businessOwnerId: 'business-owner',
      feePercent: 3,
    })
    expect(new Date(state.items[0].paymentDeadlineAt).getTime()).toBeGreaterThan(
      new Date(state.items[0].createdAt).getTime(),
    )
    expect(canRevealPaymentDetails(state.items[0])).toBe(true)
  })

  it('cree un transfert en attente d acceptation quand l option est active', () => {
    const action = createTransfer({
      ...payload,
      exchanger: {
        ...payload.exchanger,
        transferAcceptanceRequired: true,
        paymentAccount: 'MTN 97000000',
        paymentDetails: { phone: '97000000', method: 'MTN MoMo' },
      },
    })
    const state = reducer({ items: [] }, action)
    const transfer = state.items[0]

    expect(transfer.status).toBe(TRANSFER_STATUS.PENDING_ACCEPTANCE)
    expect(transfer.acceptanceRequired).toBe(true)
    expect(transfer.paymentDeadlineAt).toBeNull()
    expect(transfer.acceptanceExpiresAt).toBeTruthy()
    expect(transfer.exchanger.paymentDetails).toBeNull()
    expect(transfer.pendingPaymentDetails?.phone).toBe('97000000')
    expect(canRevealPaymentDetails(transfer)).toBe(false)
  })

  it('accepte une demande et debloque le paiement', () => {
    const created = reducer(
      { items: [] },
      createTransfer({
        ...payload,
        exchanger: {
          ...payload.exchanger,
          transferAcceptanceRequired: true,
          paymentDetails: { phone: '97000000' },
        },
      }),
    )
    const id = created.items[0].id
    const accepted = reducer(
      created,
      acceptTransferRequest({ id, actorId: 'business-owner', actorRole: 'user' }),
    )
    expect(accepted.items[0].status).toBe(TRANSFER_STATUS.PENDING)
    expect(accepted.items[0].paymentDeadlineAt).toBeTruthy()
    expect(accepted.items[0].exchanger.paymentDetails?.phone).toBe('97000000')
    expect(canRevealPaymentDetails(accepted.items[0])).toBe(true)
  })

  it('refuse puis permet la reassignation du meme transfert', () => {
    const created = reducer(
      { items: [] },
      createTransfer({
        ...payload,
        exchanger: { ...payload.exchanger, transferAcceptanceRequired: true },
      }),
    )
    const id = created.items[0].id
    const declined = reducer(
      created,
      declineTransferRequest({ id, actorId: 'business-owner', actorRole: 'user' }),
    )
    expect(declined.items[0].status).toBe(TRANSFER_STATUS.DECLINED)
    expect(canRevealPaymentDetails(declined.items[0])).toBe(false)

    const reassigned = reducer(
      declined,
      reassignTransferExchanger({
        id,
        actorId: 'u1',
        exchanger: {
          id: 'EXC-2',
          ownerId: 'other-owner',
          name: 'Pont Change',
          feePercent: 2.5,
          transferAcceptanceRequired: true,
          paymentDetails: { phone: '96000000' },
        },
      }),
    )
    expect(reassigned.items[0].businessId).toBe('EXC-2')
    expect(reassigned.items[0].previousBusinessId).toBe('EXC-1')
    expect(reassigned.items[0].status).toBe(TRANSFER_STATUS.PENDING_ACCEPTANCE)
    expect(reassigned.items[0].id).toBe(id)
  })

  it('expire automatiquement une acceptation depassee', () => {
    const created = reducer(
      { items: [] },
      createTransfer({
        ...payload,
        exchanger: { ...payload.exchanger, transferAcceptanceRequired: true },
      }),
    )
    const pending = {
      items: [
        {
          ...created.items[0],
          acceptanceExpiresAt: '2020-01-01T00:00:00.000Z',
        },
      ],
    }
    const expired = reducer(pending, expireOverdueTransfers('2020-01-02T00:00:00.000Z'))
    expect(expired.items[0].status).toBe(TRANSFER_STATUS.DECLINED)
    expect(expired.items[0].timeline.at(-1).note).toBe('acceptance_timeout')
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

  it('insère un transfert distant dès la création pour le tableau entreprise', () => {
    const remote = {
      id: 'MXT-REMOTE1',
      userId: 'client-1',
      businessId: 'EXC-1',
      businessOwnerId: 'business-owner',
      status: TRANSFER_STATUS.PENDING,
    }
    const added = reducer({ items: [] }, receiveRemoteTransfer(remote))
    expect(added.items[0].id).toBe('MXT-REMOTE1')
    const updated = reducer(
      added,
      receiveRemoteTransfer({ ...remote, status: TRANSFER_STATUS.DECLARED }),
    )
    expect(updated.items).toHaveLength(1)
    expect(updated.items[0].status).toBe(TRANSFER_STATUS.DECLARED)
  })

  it('refuse la declaration de paiement sans acceptation entreprise', () => {
    const created = reducer(
      { items: [] },
      createTransfer({
        ...payload,
        exchanger: {
          ...payload.exchanger,
          transferAcceptanceRequired: true,
          paymentDetails: { phone: '97000000' },
        },
      }),
    )
    const id = created.items[0].id
    const tampered = {
      items: [
        {
          ...created.items[0],
          status: TRANSFER_STATUS.PENDING,
          exchanger: {
            ...created.items[0].exchanger,
            paymentDetails: { phone: '97000000' },
          },
        },
      ],
    }
    expect(canRevealPaymentDetails(tampered.items[0])).toBe(false)
    expect(canClientDeclarePayment(tampered.items[0])).toBe(false)

    const declared = reducer(
      tampered,
      declarePayment({ id, actorId: 'u1', proof: { name: 'preuve.pdf' } }),
    )
    expect(declared.items[0].status).toBe(TRANSFER_STATUS.PENDING)
  })

  it('masque les coordonnees distantes tant que l acceptation est en attente', () => {
    const remote = {
      id: 'MXT-REMOTE2',
      userId: 'client-1',
      businessId: 'EXC-1',
      businessOwnerId: 'business-owner',
      status: TRANSFER_STATUS.PENDING_ACCEPTANCE,
      acceptanceRequired: true,
      acceptanceResolvedAt: null,
      exchanger: {
        name: 'MOXT Change',
        paymentAccount: 'Secret account',
        paymentDetails: { phone: '+7900' },
      },
    }
    const added = reducer({ items: [] }, receiveRemoteTransfer(remote))
    expect(added.items[0].exchanger.paymentDetails).toBeNull()
    expect(added.items[0].exchanger.paymentAccount).toBeNull()
  })
})
