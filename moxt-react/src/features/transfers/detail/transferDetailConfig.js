import { TRANSFER_STATUS } from '../transferConfig'

export const TRANSFER_PROGRESS_STEPS = [
  { key: TRANSFER_STATUS.PENDING, label: 'Créé' },
  { key: TRANSFER_STATUS.DECLARED, label: 'Déclaré' },
  { key: TRANSFER_STATUS.RECEIVED, label: 'Reçu' },
  { key: TRANSFER_STATUS.PAID_OUT, label: 'Payé' },
  { key: TRANSFER_STATUS.COMPLETED, label: 'Terminé' },
]

export const transferTimelineLabels = {
  [TRANSFER_STATUS.PENDING]: 'Transfert créé, paiement attendu',
  [TRANSFER_STATUS.DECLARED]: 'Paiement déclaré par le client',
  [TRANSFER_STATUS.RECEIVED]: 'Paiement reçu par le partenaire',
  [TRANSFER_STATUS.PROCESSING]: 'Ancien transfert en traitement',
  [TRANSFER_STATUS.PAID_OUT]: 'Transfert effectué par l’entreprise',
  [TRANSFER_STATUS.COMPLETED]: 'Paiement validé, transfert terminé',
  [TRANSFER_STATUS.CANCELLED]: 'Transfert annulé',
  [TRANSFER_STATUS.EXPIRED]: 'Délai de paiement expiré',
}

export const transferNextStepConfig = {
  [TRANSFER_STATUS.PENDING]: {
    title: 'Action attendue du client',
    description:
      'Ajoutez une preuve puis déclarez le paiement. L’entreprise sera notifiée automatiquement.',
  },
  [TRANSFER_STATUS.DECLARED]: {
    title: 'Action attendue de l’entreprise',
    description:
      'Le partenaire doit confirmer la réception du paiement depuis son tableau de bord.',
  },
  [TRANSFER_STATUS.RECEIVED]: {
    title: 'Virement en préparation',
    description: 'L’entreprise doit effectuer le transfert et peut ajouter sa preuve de virement.',
  },
  [TRANSFER_STATUS.PAID_OUT]: {
    title: 'Validation finale attendue',
    description: 'L’entreprise doit valider la fin du transfert. Le reçu sera ensuite conservé.',
  },
  [TRANSFER_STATUS.COMPLETED]: {
    title: 'Opération terminée',
    description: 'Le reçu est disponible et le transfert ne peut plus être annulé.',
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

export function getTransferDetailAccess(transfer, user, business) {
  const isSender = transfer.userId === user.id
  const isBusinessViewer = business?.id === transfer.businessId
  const isAdminViewer = ['admin', 'superadmin'].includes(user.role)

  return {
    isSender,
    isBusinessViewer,
    isAdminViewer,
    canDeclare: transfer.status === TRANSFER_STATUS.PENDING,
    canCancel: [TRANSFER_STATUS.PENDING, TRANSFER_STATUS.DECLARED].includes(transfer.status),
    canReceive:
      isSender &&
      [TRANSFER_STATUS.DECLARED, TRANSFER_STATUS.VALIDATING, TRANSFER_STATUS.PAID].includes(
        transfer.status,
      ) &&
      !transfer.receivedAt,
    contactId: isBusinessViewer ? transfer.userId : transfer.businessOwnerId,
    contactTitle: isBusinessViewer
      ? `${transfer.sender.firstName} ${transfer.sender.lastName}`
      : transfer.exchanger?.name,
    nextStep: transferNextStepConfig[transfer.status],
  }
}
