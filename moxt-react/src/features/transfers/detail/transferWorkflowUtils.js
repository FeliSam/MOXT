import { TRANSFER_STATUS } from '../transferConfig'
import { getTransferProgressState } from '../transferProgressUtils'
import { isClaimOnlyPhase } from '../transferActionUtils'

const CLIENT_WAITING_KEYS = {
  [TRANSFER_STATUS.DECLARED]: 'transfers.workflow.clientWaiting.declared',
  [TRANSFER_STATUS.RECEIVED]: 'transfers.workflow.clientWaiting.received',
  [TRANSFER_STATUS.PAID_OUT]: 'transfers.workflow.clientWaiting.paidOut',
  [TRANSFER_STATUS.COMPLETED]: 'transfers.workflow.clientWaiting.completed',
}

const BUSINESS_WAITING_KEYS = {
  [TRANSFER_STATUS.PENDING]: 'transfers.workflow.businessWaiting.pending',
  [TRANSFER_STATUS.PAID_OUT]: 'transfers.workflow.businessWaiting.paidOut',
  [TRANSFER_STATUS.COMPLETED]: 'transfers.workflow.businessWaiting.completed',
}

export function getTransferWorkflowForView(transfer, actionView, access) {
  const { steps, activeIndex, completedCount } = getTransferProgressState(transfer)
  const activeStep = steps[activeIndex] || null

  if (access.isClaimOnly || isClaimOnlyPhase(transfer)) {
    return {
      steps,
      activeIndex,
      completedCount,
      activeStep,
      currentAction: { type: 'claim' },
      waitingMessageKey: null,
    }
  }

  if (actionView === 'business' || (actionView === 'admin' && access.isBusinessViewer)) {
    if (access.canConfirmPaymentReception) {
      return {
        steps,
        activeIndex,
        completedCount,
        activeStep,
        currentAction: {
          type: 'confirm_payment_reception',
          titleKey: 'transfers.workflow.actions.confirmPaymentReception.title',
          descriptionKey: 'transfers.workflow.actions.confirmPaymentReception.description',
        },
        waitingMessageKey: null,
      }
    }
    if (access.canConfirmPayout) {
      return {
        steps,
        activeIndex,
        completedCount,
        activeStep,
        currentAction: {
          type: 'confirm_payout',
          titleKey: 'transfers.workflow.actions.confirmPayout.title',
          descriptionKey: 'transfers.workflow.actions.confirmPayout.description',
        },
        waitingMessageKey: null,
      }
    }
    return {
      steps,
      activeIndex,
      completedCount,
      activeStep,
      currentAction: null,
      waitingMessageKey:
        BUSINESS_WAITING_KEYS[transfer.status] || 'transfers.workflow.waiting.none',
    }
  }

  if (actionView === 'client' || (actionView === 'admin' && access.isSender)) {
    if (access.canDeclare) {
      return {
        steps,
        activeIndex,
        completedCount,
        activeStep,
        currentAction: {
          type: 'declare_payment',
          titleKey: 'transfers.workflow.actions.declarePayment.title',
          descriptionKey: 'transfers.workflow.actions.declarePayment.description',
        },
        waitingMessageKey: null,
      }
    }
    if (access.canDeclareReception) {
      return {
        steps,
        activeIndex,
        completedCount,
        activeStep,
        currentAction: {
          type: 'declare_reception',
          titleKey: 'transfers.workflow.actions.declareReception.title',
          descriptionKey: 'transfers.workflow.actions.declareReception.description',
        },
        waitingMessageKey: null,
      }
    }
    return {
      steps,
      activeIndex,
      completedCount,
      activeStep,
      currentAction: null,
      waitingMessageKey: CLIENT_WAITING_KEYS[transfer.status] || 'transfers.workflow.waiting.none',
    }
  }

  return {
    steps,
    activeIndex,
    completedCount,
    activeStep,
    currentAction: null,
    waitingMessageKey: null,
  }
}
