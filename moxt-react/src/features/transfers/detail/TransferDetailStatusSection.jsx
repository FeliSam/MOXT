import { FiAlertTriangle, FiShield } from 'react-icons/fi'
import { Alert } from '../../../components/ui/Alert'
import { useLanguage } from '../../../contexts/useLanguage'
import { TRANSFER_STATUS } from '../transferConfig'
import { isClaimOnlyPhase } from '../transferActionUtils'
import { formatDate } from '../transferUtils'

export function TransferDetailStatusSection({
  actionView,
  canDeclare,
  countdown,
  transfer,
}) {
  const { t } = useLanguage()
  const claimOnly = isClaimOnlyPhase(transfer)

  return (
    <>
      <div className="flex flex-col gap-3 rounded-[var(--radius-card-lg)] border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start dark:border-amber-900/40 dark:bg-amber-950/20">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <FiShield />
        </span>
        <div className="grid gap-1 text-sm text-amber-900 dark:text-amber-200">
          <strong className="flex items-center gap-1.5 font-black">
            <FiAlertTriangle className="text-xs" /> {t('transfers.detail.status.paySafely')}
          </strong>
          <p className="text-xs leading-5 text-amber-800/90 dark:text-amber-300/80">
            {t('transfers.detail.status.paySafelyBody')}
          </p>
        </div>
      </div>

      {claimOnly ? (
        <Alert variant="info" title={t('transfers.detail.status.claimOnlyTitle')}>
          {t('transfers.detail.status.claimOnlyBody')}
        </Alert>
      ) : null}

      {actionView === 'client' && canDeclare ? (
        <Alert variant="info" title={t('transfers.detail.status.paymentExpectedTitle')}>
          {t('transfers.detail.status.paymentExpectedBody', {
            date: formatDate(transfer.paymentDeadlineAt),
            countdown: countdown.label,
          })}
        </Alert>
      ) : null}

      {actionView === 'business' && transfer.status === TRANSFER_STATUS.DECLARED ? (
        <Alert variant="info" title={t('transfers.detail.status.declarationReceivedTitle')}>
          {t('transfers.detail.status.declarationReceivedBody')}
        </Alert>
      ) : null}
    </>
  )
}
