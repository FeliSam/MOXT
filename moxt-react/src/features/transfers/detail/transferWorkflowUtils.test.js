import { describe, expect, it } from 'vitest'
import { TRANSFER_STATUS } from '../transferConfig'
import { getTransferWorkflowForView } from './transferWorkflowUtils'

const baseTransfer = {
  id: 'TR-1',
  status: TRANSFER_STATUS.PENDING,
  timeline: [{ status: TRANSFER_STATUS.PENDING, at: '2026-01-01' }],
}

describe('transferWorkflowUtils', () => {
  it('propose une seule action client a la fois', () => {
    const workflow = getTransferWorkflowForView(
      baseTransfer,
      'client',
      { canDeclare: true, canDeclareReception: false, isClaimOnly: false },
    )
    expect(workflow.currentAction?.type).toBe('declare_payment')
  })

  it('propose la confirmation de reception paiement cote entreprise', () => {
    const workflow = getTransferWorkflowForView(
      {
        ...baseTransfer,
        status: TRANSFER_STATUS.DECLARED,
        paymentProof: { name: 'client.pdf' },
        timeline: [
          { status: TRANSFER_STATUS.PENDING, at: '2026-01-01' },
          { status: TRANSFER_STATUS.DECLARED, at: '2026-01-02' },
        ],
      },
      'business',
      { canConfirmPaymentReception: true, canConfirmPayout: false, isClaimOnly: false },
    )
    expect(workflow.currentAction?.type).toBe('confirm_payment_reception')
  })

  it('propose la preuve et confirmation de virement en deuxieme etape entreprise', () => {
    const workflow = getTransferWorkflowForView(
      {
        ...baseTransfer,
        status: TRANSFER_STATUS.RECEIVED,
        paymentProof: { name: 'client.pdf' },
        timeline: [
          { status: TRANSFER_STATUS.PENDING, at: '2026-01-01' },
          { status: TRANSFER_STATUS.DECLARED, at: '2026-01-02' },
          { status: TRANSFER_STATUS.RECEIVED, at: '2026-01-03' },
        ],
      },
      'business',
      { canConfirmPaymentReception: false, canConfirmPayout: true, isClaimOnly: false },
    )
    expect(workflow.currentAction?.type).toBe('confirm_payout')
  })

  it('affiche uniquement la reclamation en phase finale', () => {
    const workflow = getTransferWorkflowForView(
      {
        ...baseTransfer,
        status: TRANSFER_STATUS.PAID_OUT,
        paymentProof: { name: 'client.pdf' },
        businessProof: { name: 'virement.pdf' },
        receivedAt: null,
        timeline: [
          { status: TRANSFER_STATUS.PENDING, at: '2026-01-01' },
          { status: TRANSFER_STATUS.DECLARED, at: '2026-01-02' },
          { status: TRANSFER_STATUS.RECEIVED, at: '2026-01-03' },
          { status: TRANSFER_STATUS.PAID_OUT, at: '2026-01-04' },
        ],
      },
      'client',
      { isClaimOnly: true },
    )
    expect(workflow.currentAction?.type).toBe('claim')
  })
})
