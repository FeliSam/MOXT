import { TRANSFER_STATUS } from '../transferConfig'
import { getTransferProgressState } from '../transferProgressUtils'
import { isClaimOnlyPhase } from '../transferActionUtils'

const CLIENT_WAITING = {
  [TRANSFER_STATUS.DECLARED]: 'Votre déclaration est envoyée. L’entreprise vérifie la réception du paiement.',
  [TRANSFER_STATUS.RECEIVED]:
    'L’entreprise prépare le virement. Vous serez notifié dès qu’il sera confirmé.',
  [TRANSFER_STATUS.PAID_OUT]:
    'Le virement a été confirmé. Vous pourrez bientôt déclarer la réception des fonds.',
  [TRANSFER_STATUS.COMPLETED]: 'Transfert terminé.',
}

const BUSINESS_WAITING = {
  [TRANSFER_STATUS.PENDING]: 'En attente de la déclaration de paiement du client.',
  [TRANSFER_STATUS.PAID_OUT]: 'Virement confirmé. En attente de la déclaration de réception.',
  [TRANSFER_STATUS.COMPLETED]: 'Transfert clôturé.',
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
      waitingMessage: null,
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
          title: 'Confirmer la réception du paiement',
          description: 'Vérifiez votre compte puis validez cette étape pour passer au virement.',
        },
        waitingMessage: null,
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
          title: 'Confirmer le transfert',
          description: 'Ajoutez la preuve du virement vers le destinataire, puis validez.',
        },
        waitingMessage: null,
      }
    }
    return {
      steps,
      activeIndex,
      completedCount,
      activeStep,
      currentAction: null,
      waitingMessage: BUSINESS_WAITING[transfer.status] || 'Aucune action requise pour le moment.',
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
          title: 'Déclarer votre paiement',
          description: 'Ajoutez une preuve puis confirmez votre déclaration.',
        },
        waitingMessage: null,
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
          title: 'Déclarer la réception des fonds',
          description: 'Confirmez que le destinataire a bien reçu le montant.',
        },
        waitingMessage: null,
      }
    }
    return {
      steps,
      activeIndex,
      completedCount,
      activeStep,
      currentAction: null,
      waitingMessage: CLIENT_WAITING[transfer.status] || 'Aucune action requise pour le moment.',
    }
  }

  return {
    steps,
    activeIndex,
    completedCount,
    activeStep,
    currentAction: null,
    waitingMessage: null,
  }
}
