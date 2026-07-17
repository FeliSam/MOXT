import { TRANSFER_STATUS } from '../transferConfig'

export const TRANSFER_PROGRESS_STEPS = [
  { key: TRANSFER_STATUS.PENDING, labelKey: 'transfers.progress.created' },
  { key: TRANSFER_STATUS.DECLARED, labelKey: 'transfers.progress.declared' },
  { key: TRANSFER_STATUS.RECEIVED, labelKey: 'transfers.progress.received' },
  { key: TRANSFER_STATUS.PAID_OUT, labelKey: 'transfers.progress.paidOut' },
  { key: TRANSFER_STATUS.COMPLETED, labelKey: 'transfers.progress.completed' },
]

export const transferTimelineLabelKeys = {
  [TRANSFER_STATUS.PENDING]: 'transfers.timeline.pending',
  [TRANSFER_STATUS.DECLARED]: 'transfers.timeline.declared',
  [TRANSFER_STATUS.RECEIVED]: 'transfers.timeline.received',
  [TRANSFER_STATUS.PROCESSING]: 'transfers.timeline.processing',
  [TRANSFER_STATUS.PAID_OUT]: 'transfers.timeline.paidOut',
  [TRANSFER_STATUS.COMPLETED]: 'transfers.timeline.completed',
  [TRANSFER_STATUS.CANCELLED]: 'transfers.timeline.cancelled',
  [TRANSFER_STATUS.EXPIRED]: 'transfers.timeline.expired',
}

/** @deprecated Prefer transferTimelineLabelKeys + t() */
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

export const transferNextStepConfigKeys = {
  [TRANSFER_STATUS.PENDING]: {
    titleKey: 'transfers.nextStep.pending.title',
    descriptionKey: 'transfers.nextStep.pending.description',
  },
  [TRANSFER_STATUS.DECLARED]: {
    titleKey: 'transfers.nextStep.declared.title',
    descriptionKey: 'transfers.nextStep.declared.description',
  },
  [TRANSFER_STATUS.RECEIVED]: {
    titleKey: 'transfers.nextStep.received.title',
    descriptionKey: 'transfers.nextStep.received.description',
  },
  [TRANSFER_STATUS.PAID_OUT]: {
    titleKey: 'transfers.nextStep.paidOut.title',
    descriptionKey: 'transfers.nextStep.paidOut.description',
  },
  [TRANSFER_STATUS.COMPLETED]: {
    titleKey: 'transfers.nextStep.completed.title',
    descriptionKey: 'transfers.nextStep.completed.description',
  },
  [TRANSFER_STATUS.CANCELLED]: {
    titleKey: 'transfers.nextStep.cancelled.title',
    descriptionKey: 'transfers.nextStep.cancelled.description',
  },
  [TRANSFER_STATUS.EXPIRED]: {
    titleKey: 'transfers.nextStep.expired.title',
    descriptionKey: 'transfers.nextStep.expired.description',
  },
}

/** @deprecated Prefer transferNextStepConfigKeys + t() */
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

export { getTransferDetailAccess } from './transferDetailRoleLogic'
