import { FiAlertCircle, FiCheck, FiCopy, FiCreditCard } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useLanguage } from '../../contexts/useLanguage'
import {
  countryLabel,
  receivingSlotForDirection,
  transferAccountSlotMeta,
} from './transferAccountUtils'
import { directionLabel } from './transferUtils'

export function TransferReceivingAccountCard({
  account,
  direction,
  originCountry = 'BJ',
  onCopy,
  className = '',
  compact = false,
}) {
  const { t } = useLanguage()
  const slotMeta = transferAccountSlotMeta(receivingSlotForDirection(direction), originCountry)

  if (!account) {
    return (
      <Card
        className={`border border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20 ${className}`}
      >
        <div className="flex items-start gap-3">
          <FiAlertCircle className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-black text-amber-900 dark:text-amber-200">
              {t('transfers.receivingAccount.unavailableTitle')}
            </p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {t('transfers.receivingAccount.unavailableDescription', {
                direction: direction
                  ? directionLabel(direction, t).toLowerCase()
                  : t('transfers.receivingAccount.thisDirection'),
              })}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const copyValue = account.phone || account.accountNumber
  const directionHint =
    slotMeta.activeForDirection === 'RU_TO_BJ'
      ? t('transfers.direction.ruToAfrica')
      : t('transfers.direction.africaToRu')

  return (
    <Card
      className={`ring-1 ring-brand-200/70 transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)] dark:ring-brand-800/70 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            <FiCreditCard />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
              {t('transfers.receivingAccount.activeTitle')}
            </p>
            <h3 className="mt-1 font-black">
              {account.label || account.method || t('transfers.receivingAccount.businessDetails')}
            </h3>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {direction ? directionLabel(direction, t) : directionHint} ·{' '}
              {countryLabel(account.country)}
            </p>
          </div>
        </div>
        <Badge tone="success">
          <FiCheck className="mr-1 inline text-xs" />
          {t('transfers.receivingAccount.active')}
        </Badge>
      </div>

      <div className={`mt-4 grid gap-2 ${compact ? 'text-sm' : ''}`}>
        <InfoRow label={t('transfers.receivingAccount.beneficiary')} value={account.recipientName} />
        <InfoRow
          label={t('transfers.receivingAccount.method')}
          value={account.method || account.bankName}
        />
        <InfoRow
          label={t('transfers.receivingAccount.numberOrAccount')}
          value={account.phone || account.accountNumber}
        />
        {account.bankName ? (
          <InfoRow label={t('transfers.receivingAccount.bank')} value={account.bankName} />
        ) : null}
        {account.instructions ? (
          <p className="rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">
            {account.instructions}
          </p>
        ) : null}
      </div>

      {copyValue && onCopy ? (
        <Button variant="secondary" icon={FiCopy} className="mt-4" onClick={() => onCopy(copyValue)}>
          {t('transfers.receivingAccount.copyDetails')}
        </Button>
      ) : null}
    </Card>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--app-border)] py-2 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
        {label}
      </span>
      <strong className="text-right text-sm">{value}</strong>
    </div>
  )
}
