import { TRANSFER_STATUS, TRANSFER_TRANSITIONS } from '../transferConfig'
import { transferNextStepConfig } from './transferDetailConfig'
import {
  canClientDeclareReception,
  isBusinessViewerForTransfer,
  isClaimOnlyPhase,
  transferNeedsBusinessAction,
  transferNeedsClientAction,
} from '../transferActionUtils'
export function getTransferRoleLanes(transfer, access) {
  const status = transfer.status
  const nextBusinessStatus = TRANSFER_TRANSITIONS[status]
  const globalStep = transferNextStepConfig[status]

  const clientLane = {
    id: 'client',
    title: 'Côté client',
    subtitle: `${transfer.sender.firstName} ${transfer.sender.lastName}`,
    isYou: access.isSender,
    isActive: false,
    isWaiting: true,
    statusLabel: 'En attente',
    instruction: 'Aucune action requise pour le moment.',
    completedSteps: [],
    actionType: null,
  }

  const businessLane = {
    id: 'business',
    title: 'Côté entreprise',
    subtitle: transfer.exchanger?.name || 'Partenaire MOXT',
    isYou: access.isBusinessViewer,
    isActive: false,
    isWaiting: true,
    statusLabel: 'En attente',
    instruction: 'Aucune action requise pour le moment.',
    completedSteps: [],
    actionType: null,
  }

  switch (status) {
    case TRANSFER_STATUS.PENDING:
      clientLane.isActive = true
      clientLane.isWaiting = false
      clientLane.statusLabel = 'À faire maintenant'
      clientLane.instruction =
        'Effectuez le paiement sur les coordonnées indiquées, ajoutez une preuve puis déclarez le paiement.'
      clientLane.actionType = 'declare_payment'
      businessLane.instruction =
        'Le client doit d’abord payer et déclarer son virement. Vous serez notifié automatiquement.'
      break
    case TRANSFER_STATUS.DECLARED:
      clientLane.completedSteps = ['Paiement déclaré']
      clientLane.instruction =
        'Votre déclaration est envoyée. Attendez que l’entreprise confirme la réception du paiement.'
      businessLane.isActive = true
      businessLane.isWaiting = false
      businessLane.statusLabel = 'À faire maintenant'
      businessLane.instruction =
        'Étape 1 : confirmez la réception du paiement. Étape 2 : ajoutez la preuve puis confirmez le transfert.'
      businessLane.actionType = 'confirm_received'
      break
    case TRANSFER_STATUS.RECEIVED:
      clientLane.completedSteps = ['Paiement déclaré', 'Réception confirmée par l’entreprise']
      clientLane.instruction =
        'Attendez que l’entreprise confirme le virement avec preuve — vous pourrez ensuite déclarer la réception des fonds.'
      businessLane.completedSteps = ['Réception du paiement confirmée']
      businessLane.isActive = true
      businessLane.isWaiting = false
      businessLane.statusLabel = 'À faire maintenant'
      businessLane.instruction =
        'Étape 1 terminée. Ajoutez la preuve de virement puis confirmez le transfert.'
      businessLane.actionType = 'pay_out'
      break
    case TRANSFER_STATUS.PAID_OUT:
      clientLane.completedSteps = ['Paiement déclaré', 'Virement effectué par l’entreprise']
      if (transfer.receivedAt) {
        clientLane.completedSteps.push('Réception confirmée')
        clientLane.statusLabel = 'Terminé'
        clientLane.instruction =
          'Toutes les étapes sont complétées. Seule une réclamation reste possible en cas de problème.'
      } else {
        clientLane.isActive = true
        clientLane.isWaiting = false
        clientLane.statusLabel = 'À faire maintenant'
        clientLane.instruction =
          'L’entreprise a confirmé le virement avec preuve. Vous pouvez maintenant déclarer la réception des fonds.'
        clientLane.actionType = 'declare_reception'
      }
      businessLane.completedSteps = ['Virement confirmé avec preuve']
      businessLane.statusLabel = 'Terminé'
      businessLane.instruction = 'Le virement est confirmé. En attente de la déclaration de réception du client.'
      break
    case TRANSFER_STATUS.COMPLETED:
      clientLane.completedSteps = ['Paiement déclaré', 'Virement effectué', 'Réception confirmée']
      clientLane.statusLabel = 'Terminé'
      clientLane.instruction =
        'L’opération est terminée. Seule une réclamation reste possible en cas de problème.'
      businessLane.completedSteps = ['Virement confirmé avec preuve', 'Opération clôturée']
      businessLane.statusLabel = 'Terminé'
      businessLane.instruction =
        'L’opération est clôturée. Seule une réclamation reste possible en cas de problème.'
      break
    case TRANSFER_STATUS.CANCELLED:
      clientLane.statusLabel = 'Annulé'
      clientLane.instruction = 'Ce transfert a été annulé.'
      businessLane.statusLabel = 'Annulé'
      businessLane.instruction = 'Ce transfert a été annulé.'
      break
    case TRANSFER_STATUS.EXPIRED:
      clientLane.statusLabel = 'Expiré'
      clientLane.instruction = 'Le délai de paiement est dépassé.'
      businessLane.statusLabel = 'Expiré'
      businessLane.instruction = 'Le client n’a pas déclaré le paiement à temps.'
      break
    default:
      break
  }

  if (globalStep?.title?.includes('client')) {
    clientLane.highlight = access.isSender
  }
  if (globalStep?.title?.includes('entreprise')) {
    businessLane.highlight = access.isBusinessViewer
  }

  return {
    client: clientLane,
    business: businessLane,
    nextBusinessStatus,
    globalStep,
  }
}

export function getTransferDetailAccess(transfer, user, business, ownedBusinessIds = []) {
  const isSender = transfer.userId === user.id
  const isBusinessViewer = isBusinessViewerForTransfer(
    transfer,
    user,
    business,
    ownedBusinessIds,
  )
  const isAdminViewer = ['admin', 'superadmin'].includes(user.role)
  const nextBusinessStatus = TRANSFER_TRANSITIONS[transfer.status]
  const claimOnly = isClaimOnlyPhase(transfer)

  return {
    isSender,
    isBusinessViewer,
    isAdminViewer,
    isClaimOnly: claimOnly,
    canDeclare: !claimOnly && isSender && transfer.status === TRANSFER_STATUS.PENDING,
    canCancel:
      !claimOnly &&
      isSender &&
      [TRANSFER_STATUS.PENDING, TRANSFER_STATUS.DECLARED].includes(transfer.status),
    canConfirmPaymentReception:
      !claimOnly && isBusinessViewer && transfer.status === TRANSFER_STATUS.DECLARED,
    canConfirmPayout:
      !claimOnly && isBusinessViewer && transfer.status === TRANSFER_STATUS.RECEIVED,
    canModerateBusiness:
      !claimOnly &&
      isBusinessViewer &&
      transferNeedsBusinessAction(transfer),
    canUploadBusinessProof:
      !claimOnly &&
      isBusinessViewer &&
      nextBusinessStatus === TRANSFER_STATUS.PAID_OUT,
    canDeclareReception: canClientDeclareReception(transfer, isSender),
    canOpenClaim: claimOnly,
    contactId: isBusinessViewer ? transfer.userId : transfer.businessOwnerId,
    contactTitle: isBusinessViewer
      ? `${transfer.sender.firstName} ${transfer.sender.lastName}`
      : transfer.exchanger?.name,
    nextStep: transferNextStepConfig[transfer.status],
    nextBusinessStatus,
  }
}

/** Espace d’actions affiché : client, entreprise, ou les deux (admin). */
export function resolveTransferActionView(access, hints = {}, transfer = null) {
  if (access.isAdminViewer) return 'admin'

  const preferred = hints.transferView || hints.view || null

  if (transfer) {
    if (access.isBusinessViewer && transferNeedsBusinessAction(transfer)) return 'business'
    if (access.isSender && transferNeedsClientAction(transfer)) return 'client'
  }

  if (preferred === 'business' && access.isBusinessViewer) return 'business'
  if (preferred === 'client' && access.isSender) return 'client'

  if (access.isBusinessViewer && !access.isSender) return 'business'
  if (access.isSender && !access.isBusinessViewer) return 'client'
  if (access.isBusinessViewer && access.isSender) {
    return preferred === 'business' ? 'business' : 'client'
  }

  return null
}

export function getVisibleRoleLanes(transfer, access, actionView) {
  const lanes = getTransferRoleLanes(transfer, access)

  if (actionView === 'admin') {
    return { lanes, showClient: true, showBusiness: true }
  }
  if (actionView === 'client') {
    return { lanes, showClient: access.isSender, showBusiness: false }
  }
  if (actionView === 'business') {
    return { lanes, showClient: false, showBusiness: access.isBusinessViewer }
  }

  return { lanes, showClient: false, showBusiness: false }
}

const clientNextStepView = {
  [TRANSFER_STATUS.PENDING]: {
    title: 'Votre paiement est attendu',
    description:
      'Effectuez le virement puis déclarez votre paiement avec une preuve avant la date limite.',
  },
  [TRANSFER_STATUS.DECLARED]: {
    title: 'En attente de l’entreprise',
    description:
      'Votre paiement a été déclaré. Attendez que l’entreprise confirme la réception du paiement.',
  },
  [TRANSFER_STATUS.RECEIVED]: {
    title: 'En attente du virement',
    description:
      'L’entreprise a confirmé la réception. Attendez qu’elle confirme le virement avec preuve avant de déclarer la réception des fonds.',
  },
  [TRANSFER_STATUS.PAID_OUT]: {
    title: 'Virement confirmé',
    description:
      'L’entreprise a confirmé le virement avec preuve. Vous pouvez maintenant déclarer la réception des fonds.',
  },
  [TRANSFER_STATUS.COMPLETED]: {
    title: 'Opération terminée',
    description:
      'Toutes les étapes sont complétées. Seule une réclamation reste possible en cas de problème.',
  },
  [TRANSFER_STATUS.CANCELLED]: {
    title: 'Opération annulée',
    description: 'Aucune autre action n’est possible sur ce transfert.',
  },
  [TRANSFER_STATUS.EXPIRED]: {
    title: 'Délai dépassé',
    description: 'Le paiement n’a pas été déclaré dans le temps prévu.',
  },
}

const businessNextStepView = {
  [TRANSFER_STATUS.PENDING]: {
    title: 'En attente de paiement',
    description: 'Ce transfert est en attente. Vous serez notifié dès qu’une déclaration sera reçue.',
  },
  [TRANSFER_STATUS.DECLARED]: {
    title: 'Étape 1 — Réception du paiement',
    description: 'Vérifiez votre compte puis confirmez la réception du paiement du client.',
  },
  [TRANSFER_STATUS.RECEIVED]: {
    title: 'Étape 2 — Confirmer le transfert',
    description:
      'Ajoutez la preuve du virement vers le destinataire, puis confirmez le transfert.',
  },
  [TRANSFER_STATUS.PAID_OUT]: {
    title: 'Virement confirmé',
    description: 'Le virement a été confirmé avec preuve. En attente de la déclaration de réception.',
  },
  [TRANSFER_STATUS.COMPLETED]: {
    title: 'Réclamation uniquement',
    description: 'L’opération est terminée. Seule une réclamation reste possible en cas de problème.',
  },
  [TRANSFER_STATUS.CANCELLED]: {
    title: 'Opération annulée',
    description: 'Ce transfert a été annulé.',
  },
  [TRANSFER_STATUS.EXPIRED]: {
    title: 'Délai dépassé',
    description: 'Le paiement n’a pas été déclaré à temps.',
  },
}

export function getTransferNextStepForView(transfer, actionView) {
  if (isClaimOnlyPhase(transfer)) {
    return {
      title: 'Réclamation uniquement',
      description:
        'La réception a été déclarée et l’entreprise a confirmé le virement avec preuve. Seule une réclamation est possible.',
    }
  }
  if (actionView === 'admin') return transferNextStepConfig[transfer.status]
  if (actionView === 'client') return clientNextStepView[transfer.status] || null
  if (actionView === 'business') return businessNextStepView[transfer.status] || null
  return null
}
