import { TRANSFER_STATUS } from './transferConfig'
import {
  hasBusinessConfirmedReception,
  hasBusinessPayoutWithProof,
  hasClientDeclaredPayment,
  hasRecipientDeclaredReception,
} from './transferActionUtils'

export const TRANSFER_PROGRESS_MILESTONES = [
  { key: 'created', label: 'Créé', isDone: () => true },
  { key: TRANSFER_STATUS.DECLARED, label: 'Déclaré', isDone: hasClientDeclaredPayment },
  {
    key: TRANSFER_STATUS.RECEIVED,
    label: 'Paiement reçu',
    isDone: hasBusinessConfirmedReception,
  },
  {
    key: TRANSFER_STATUS.PAID_OUT,
    label: 'Payé',
    isDone: hasBusinessPayoutWithProof,
  },
  {
    key: TRANSFER_STATUS.COMPLETED,
    label: 'Terminé',
    isDone: (transfer) =>
      transfer.status === TRANSFER_STATUS.COMPLETED || hasRecipientDeclaredReception(transfer),
  },
]

export function getTransferProgressState(transfer) {
  if (!transfer) {
    return { steps: [], activeIndex: 0, completedCount: 0 }
  }

  const steps = TRANSFER_PROGRESS_MILESTONES.map((step) => ({
    ...step,
    done: step.isDone(transfer),
  }))

  steps.forEach((step, index) => {
    const previousDone = steps.slice(0, index).every((entry) => entry.done)
    step.active = !step.done && previousDone
  })

  const completedCount = steps.filter((step) => step.done).length
  const activeIndex = steps.findIndex((step) => step.active)
  const firstPendingIndex = steps.findIndex((step) => !step.done)

  return {
    steps,
    activeIndex: activeIndex >= 0 ? activeIndex : firstPendingIndex === -1 ? steps.length - 1 : firstPendingIndex,
    completedCount,
  }
}
