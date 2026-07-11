import { describe, expect, it } from 'vitest'
import { TRANSFER_STATUS } from './transferConfig'
import {
  canApplyModerateTransfer,
  canClientDeclareReception,
  hasBusinessPayoutWithProof,
  hasRecipientDeclaredReception,
  isClaimOnlyPhase,
} from './transferActionUtils'

const baseTransfer = {
  id: 'MXT-1',
  status: TRANSFER_STATUS.PAID_OUT,
  paymentProof: { name: 'client.pdf' },
  businessProof: { name: 'virement.pdf' },
  timeline: [
    { status: TRANSFER_STATUS.PENDING, at: '2026-01-01' },
    { status: TRANSFER_STATUS.DECLARED, at: '2026-01-02' },
    { status: TRANSFER_STATUS.RECEIVED, at: '2026-01-03' },
    { status: TRANSFER_STATUS.PAID_OUT, at: '2026-01-04' },
  ],
}

describe('transferActionUtils', () => {
  it('detecte la phase reclamation seule', () => {
    expect(isClaimOnlyPhase(baseTransfer)).toBe(false)
    expect(
      isClaimOnlyPhase({
        ...baseTransfer,
        receivedAt: '2026-01-05',
      }),
    ).toBe(true)
  })

  it('autorise la declaration de reception avant la phase reclamation', () => {
    expect(canClientDeclareReception(baseTransfer, true)).toBe(true)
    expect(
      canClientDeclareReception({ ...baseTransfer, receivedAt: '2026-01-05' }, true),
    ).toBe(false)
  })

  it('exige une preuve pour le virement entreprise', () => {
    expect(hasBusinessPayoutWithProof(baseTransfer)).toBe(true)
    expect(hasBusinessPayoutWithProof({ ...baseTransfer, businessProof: null })).toBe(false)
    expect(
      hasBusinessPayoutWithProof({
        ...baseTransfer,
        status: TRANSFER_STATUS.PAID_OUT,
        timeline: baseTransfer.timeline.filter((e) => e.status !== TRANSFER_STATUS.PAID_OUT),
      }),
    ).toBe(false)
  })

  it('valide les transitions entreprise', () => {
    const transfer = {
      status: TRANSFER_STATUS.DECLARED,
      timeline: [],
    }
    expect(canApplyModerateTransfer(transfer, TRANSFER_STATUS.RECEIVED)).toBe(true)
    expect(canApplyModerateTransfer(transfer, TRANSFER_STATUS.PAID_OUT)).toBe(false)
  })
})
