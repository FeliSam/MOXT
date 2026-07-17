import {
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiFlag,
  FiUpload,
  FiXCircle,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import { formatDate } from '../transferUtils'

export function TransferDetailActionsPanel({
  canCancel,
  canDeclare,
  canReceive,
  onCancel,
  onDeclarePayment,
  onOpenClaim,
  onProofSelected,
  proof,
  transfer,
}) {
  const { t } = useLanguage()

  return (
    <Card className="ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 dark:hover:ring-brand-800">
      <h2 className="flex items-center gap-2 font-black">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiCheck className="text-sm" />
        </span>
        {t('transfers.detail.actions.title')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
        {t('transfers.detail.actions.description')}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {canDeclare ? (
          <label className="grid w-full cursor-pointer gap-3 rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 transition hover:border-brand-300">
            <span className="flex items-center gap-2 text-sm font-bold">
              <FiUpload className="text-brand-700 dark:text-brand-300" />{' '}
              {t('transfers.workflow.paymentProof')}
            </span>
            {proof ? (
              <div className="flex items-center gap-3 rounded-xl bg-[var(--app-surface)] p-3">
                {proof.file?.type?.startsWith('image/') ? (
                  <img
                    src={proof.url || URL.createObjectURL(proof.file)}
                    alt={proof.file?.name}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                    <FiFileText />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs">{proof.file?.name}</strong>
                  <span className="text-xs text-[var(--app-text-muted)]">
                    {proof.uploading
                      ? t('transfers.workflow.uploading')
                      : `${Math.ceil((proof.file?.size || 0) / 1024)} Ko`}
                  </span>
                </span>
                <FiCheck className="shrink-0 text-emerald-600" />
              </div>
            ) : (
              <span className="text-xs text-[var(--app-text-muted)]">
                {t('transfers.detail.actions.clickToAddProof')}
              </span>
            )}
            <input
              className="sr-only"
              type="file"
              accept="image/*,.pdf"
              onChange={onProofSelected}
            />
          </label>
        ) : null}

        {transfer.receivedAt ? (
          <Card className="w-full border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <p className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300">
              {t('transfers.detail.actions.receptionDeclared')}
            </p>
            <p className="mt-2 text-sm">
              {t('transfers.detail.actions.amount')}:{' '}
              <strong>
                {transfer.receivedAmount} ({transfer.receivedMethod})
              </strong>
            </p>
            <p className="text-xs text-[var(--app-text-muted)]">
              {t('transfers.detail.actions.onDate', { date: formatDate(transfer.receivedAt) })}
            </p>
          </Card>
        ) : null}

        {canReceive ? (
          <Link to={`/transfers/${transfer.id}/receive`}>
            <Button icon={FiCheckCircle}>{t('transfers.workflow.declareReception')}</Button>
          </Link>
        ) : null}

        {canDeclare ? (
          <Button
            disabled={!proof || proof.uploading}
            loading={proof?.uploading}
            icon={FiCheckCircle}
            onClick={onDeclarePayment}
          >
            {t('transfers.workflow.declarePayment')}
          </Button>
        ) : null}

        {canCancel ? (
          <Button variant="danger" icon={FiXCircle} onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        ) : null}

        {!canDeclare && !canCancel ? (
          <span className="text-sm text-[var(--app-text-muted)]">
            {t('transfers.detail.actions.noneAvailable')}
          </span>
        ) : null}

        <Button variant="secondary" icon={FiFlag} onClick={onOpenClaim}>
          {t('transfers.workflow.openClaim')}
        </Button>
      </div>
    </Card>
  )
}
