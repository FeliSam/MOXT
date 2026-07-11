import { describe, expect, it } from 'vitest'
import { TRANSFER_STATUS } from './transferConfig'
import { getTransferProgressState } from './transferProgressUtils'

describe('transferProgressUtils', () => {
  it('avance la progression selon les actions effectuees', () => {
    const created = getTransferProgressState({
      status: TRANSFER_STATUS.PENDING,
      timeline: [{ status: TRANSFER_STATUS.PENDING, at: '2026-01-01' }],
    })
    expect(created.activeIndex).toBe(1)
    expect(created.steps[0].done).toBe(true)
    expect(created.steps[1].done).toBe(false)

    const declared = getTransferProgressState({
      status: TRANSFER_STATUS.DECLARED,
      paymentProof: { name: 'preuve.pdf' },
      timeline: [
        { status: TRANSFER_STATUS.PENDING, at: '2026-01-01' },
        { status: TRANSFER_STATUS.DECLARED, at: '2026-01-02' },
      ],
    })
    expect(declared.activeIndex).toBe(2)
    expect(declared.steps[1].done).toBe(true)
    expect(declared.steps[3].done).toBe(false)
  })

  it('n active Paye qu apres confirmation du transfert avec preuve', () => {
    const afterPaymentReception = getTransferProgressState({
      status: TRANSFER_STATUS.RECEIVED,
      paymentProof: { name: 'client.pdf' },
      timeline: [
        { status: TRANSFER_STATUS.PENDING, at: '2026-01-01' },
        { status: TRANSFER_STATUS.DECLARED, at: '2026-01-02' },
        { status: TRANSFER_STATUS.RECEIVED, at: '2026-01-03' },
      ],
    })
    expect(afterPaymentReception.steps[2].done).toBe(true)
    expect(afterPaymentReception.steps[3].done).toBe(false)
    expect(afterPaymentReception.steps[3].active).toBe(true)
    expect(afterPaymentReception.activeIndex).toBe(3)

    const afterTransferConfirmed = getTransferProgressState({
      status: TRANSFER_STATUS.PAID_OUT,
      paymentProof: { name: 'client.pdf' },
      businessProof: { name: 'virement.pdf' },
      timeline: [
        { status: TRANSFER_STATUS.PENDING, at: '2026-01-01' },
        { status: TRANSFER_STATUS.DECLARED, at: '2026-01-02' },
        { status: TRANSFER_STATUS.RECEIVED, at: '2026-01-03' },
        { status: TRANSFER_STATUS.PAID_OUT, at: '2026-01-04' },
      ],
    })
    expect(afterTransferConfirmed.steps[3].done).toBe(true)
    expect(afterTransferConfirmed.steps[3].active).toBe(false)
    expect(afterTransferConfirmed.activeIndex).toBe(4)
  })

  it('termine apres reception declaree', () => {
    const finished = getTransferProgressState({
      status: TRANSFER_STATUS.COMPLETED,
      paymentProof: { name: 'client.pdf' },
      businessProof: { name: 'virement.pdf' },
      receivedAt: '2026-01-05',
      timeline: [
        { status: TRANSFER_STATUS.PENDING, at: '2026-01-01' },
        { status: TRANSFER_STATUS.DECLARED, at: '2026-01-02' },
        { status: TRANSFER_STATUS.RECEIVED, at: '2026-01-03' },
        { status: TRANSFER_STATUS.PAID_OUT, at: '2026-01-04' },
      ],
    })
    expect(finished.activeIndex).toBe(4)
    expect(finished.completedCount).toBe(5)
  })
})
