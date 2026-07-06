import { Badge } from '../../components/ui/Badge'
import { TRANSFER_STATUS } from './transferConfig'

const statusConfig = {
  [TRANSFER_STATUS.PENDING]: ['Paiement attendu', 'warning'],
  [TRANSFER_STATUS.DECLARED]: ['Paiement declare', 'info'],
  [TRANSFER_STATUS.RECEIVED]: ['Paiement reçu', 'success'],
  [TRANSFER_STATUS.PROCESSING]: ['En traitement', 'violet'],
  [TRANSFER_STATUS.PAID_OUT]: ['Virement effectué', 'info'],
  [TRANSFER_STATUS.COMPLETED]: ['Terminé', 'success'],
  [TRANSFER_STATUS.CANCELLED]: ['Annulé', 'danger'],
  [TRANSFER_STATUS.EXPIRED]: ['Expiré', 'warning'],
}

export function TransferStatusBadge({ status }) {
  const [label, tone] = statusConfig[status] || [status, 'brand']
  return <Badge tone={tone}>{label}</Badge>
}
