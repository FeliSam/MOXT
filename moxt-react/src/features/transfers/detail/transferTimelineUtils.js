import { TRANSFER_STATUS, TRANSFER_TIMELINE_EVENT } from '../transferConfig'
import { transferTimelineLabelKeys, transferTimelineLabels } from './transferDetailConfig'

export function isBusinessAcceptedTimelineEvent(event) {
  return (
    event?.status === TRANSFER_TIMELINE_EVENT.BUSINESS_ACCEPTED ||
    (event?.status === TRANSFER_STATUS.PENDING && event?.note === 'business_accepted')
  )
}

/** Masque les étapes de pré-acceptation si le transfert ne l'utilise pas. */
export function shouldShowTransferTimelineEvent(transfer, event) {
  const acceptanceFlow = transfer?.acceptanceRequired === true
  if (event.status === TRANSFER_STATUS.PENDING_ACCEPTANCE) {
    return acceptanceFlow
  }
  if (isBusinessAcceptedTimelineEvent(event)) {
    return acceptanceFlow
  }
  return true
}

export function resolveTransferTimelineLabel(event, t) {
  if (isBusinessAcceptedTimelineEvent(event)) {
    return t('transfers.timeline.businessAccepted')
  }
  const key = transferTimelineLabelKeys[event.status]
  if (key) return t(key)
  return transferTimelineLabels[event.status] || event.status
}

export function buildTransferTimelineItems(transfer, t, formatDate) {
  return (transfer?.timeline || [])
    .filter((event) => shouldShowTransferTimelineEvent(transfer, event))
    .map((event) => ({
      label: resolveTransferTimelineLabel(event, t),
      date: formatDate(event.at),
    }))
}
