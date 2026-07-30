import { TRANSFER_STATUS } from '../transferConfig'

export const STATUS_LABEL_KEYS = {
  [TRANSFER_STATUS.PENDING]: 'transfers.status.pending',
  [TRANSFER_STATUS.DECLARED]: 'transfers.status.declared',
  [TRANSFER_STATUS.RECEIVED]: 'transfers.status.received',
  [TRANSFER_STATUS.PROCESSING]: 'transfers.status.processing',
  [TRANSFER_STATUS.PAID_OUT]: 'transfers.status.paidOut',
  [TRANSFER_STATUS.COMPLETED]: 'transfers.status.completed',
  [TRANSFER_STATUS.CANCELLED]: 'transfers.status.cancelled',
  [TRANSFER_STATUS.EXPIRED]: 'transfers.status.expired',
}

export function statusLabelKey(status) {
  return STATUS_LABEL_KEYS[status] || status
}
