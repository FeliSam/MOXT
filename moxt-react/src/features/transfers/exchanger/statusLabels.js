import { TRANSFER_STATUS } from '../transferConfig'

export const STATUS_LABEL_KEYS = {
  [TRANSFER_STATUS.PENDING_ACCEPTANCE]: 'transfers.status.pendingAcceptance',
  [TRANSFER_STATUS.PENDING]: 'transfers.status.pending',
  [TRANSFER_STATUS.DECLINED]: 'transfers.status.businessDeclined',
  [TRANSFER_STATUS.DECLARED]: 'transfers.status.declared',
  [TRANSFER_STATUS.RECEIVED]: 'transfers.status.received',
  [TRANSFER_STATUS.PROCESSING]: 'transfers.status.processing',
  [TRANSFER_STATUS.PAID_OUT]: 'transfers.status.paidOut',
  [TRANSFER_STATUS.COMPLETED]: 'transfers.status.completed',
  [TRANSFER_STATUS.CANCELLED]: 'transfers.status.cancelled',
  [TRANSFER_STATUS.EXPIRED]: 'transfers.status.expired',
}

const STATUS_ALIASES = {
  received: TRANSFER_STATUS.RECEIVED,
  declared: TRANSFER_STATUS.DECLARED,
  pending: TRANSFER_STATUS.PENDING,
  paid: TRANSFER_STATUS.PAID_OUT,
  completed: TRANSFER_STATUS.COMPLETED,
  cancelled: TRANSFER_STATUS.CANCELLED,
  expired: TRANSFER_STATUS.EXPIRED,
  processing: TRANSFER_STATUS.PROCESSING,
}

export function statusLabelKey(status) {
  const normalized = STATUS_ALIASES[status] || status
  return STATUS_LABEL_KEYS[normalized] || status
}
