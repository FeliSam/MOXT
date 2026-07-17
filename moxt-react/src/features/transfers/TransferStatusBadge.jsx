import { Badge } from '../../components/ui/Badge'
import { useLanguage } from '../../contexts/useLanguage'
import { TRANSFER_STATUS } from './transferConfig'

const statusConfig = {
  [TRANSFER_STATUS.PENDING]: { labelKey: 'transfers.status.pending', tone: 'warning' },
  [TRANSFER_STATUS.DECLARED]: { labelKey: 'transfers.status.declared', tone: 'info' },
  [TRANSFER_STATUS.RECEIVED]: { labelKey: 'transfers.status.received', tone: 'success' },
  [TRANSFER_STATUS.PROCESSING]: { labelKey: 'transfers.status.processing', tone: 'violet' },
  [TRANSFER_STATUS.PAID_OUT]: { labelKey: 'transfers.status.paidOut', tone: 'info' },
  [TRANSFER_STATUS.COMPLETED]: { labelKey: 'transfers.status.completed', tone: 'success' },
  [TRANSFER_STATUS.CANCELLED]: { labelKey: 'transfers.status.cancelled', tone: 'danger' },
  [TRANSFER_STATUS.EXPIRED]: { labelKey: 'transfers.status.expired', tone: 'warning' },
}

export function TransferStatusBadge({ status }) {
  const { t } = useLanguage()
  const config = statusConfig[status]
  return <Badge tone={config?.tone || 'brand'}>{config ? t(config.labelKey) : status}</Badge>
}
