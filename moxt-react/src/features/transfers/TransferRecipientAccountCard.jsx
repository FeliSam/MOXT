import { FiUser } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'

/** Coordonnées du destinataire pour le versement (côté entreprise). */
export function TransferRecipientAccountCard({ transfer, className = '', compact = false }) {
  const { t } = useLanguage()
  const recipient = transfer?.recipient
  if (!recipient) return null

  const rows = [
    {
      label: t('transfers.workflow.payoutAccount.beneficiary'),
      value: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim(),
    },
    {
      label: t('transfers.workflow.payoutAccount.method'),
      value: recipient.method,
    },
    {
      label: t('transfers.workflow.payoutAccount.numberOrAccount'),
      value: recipient.phone,
    },
  ].filter((row) => row.value)

  if (!rows.length) return null

  return (
    <div
      className={`rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 ${className}`}
    >
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
        <FiUser className="shrink-0" />
        {t('transfers.workflow.payoutAccount.title')}
      </p>
      {compact ? null : (
        <p className="mt-1 text-xs text-[var(--app-text-muted)]">
          {t('transfers.workflow.payoutAccount.help')}
        </p>
      )}
      <div className={`grid gap-1.5 ${compact ? 'mt-2' : 'mt-3'}`}>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex min-w-0 flex-wrap items-baseline justify-between gap-2 text-sm"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
              {row.label}
            </span>
            <strong className="min-w-0 max-w-full truncate text-right" title={row.value}>
              {row.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}
