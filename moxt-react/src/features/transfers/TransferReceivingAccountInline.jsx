import { FiCopy, FiCreditCard } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'

/** Coordonnées de versement vers l'échangeur — bloc compact pour le workflow. */
export function TransferReceivingAccountInline({ account, className = '', onCopy = null }) {
  const { t } = useLanguage()

  if (!account) return null

  const copyValue = account.phone || account.accountNumber
  const copyLabel = t('transfers.receivingAccount.copyDetails')

  const rows = [
    {
      label: t('transfers.receivingAccount.beneficiary'),
      value: account.recipientName,
    },
    {
      label: t('transfers.receivingAccount.method'),
      value: account.method || account.bankName,
    },
    {
      label: t('transfers.receivingAccount.numberOrAccount'),
      value: copyValue,
      copyable: Boolean(copyValue && onCopy),
    },
    {
      label: t('transfers.receivingAccount.bank'),
      value: account.bankName,
    },
  ].filter((row) => row.value)

  if (!rows.length) return null

  return (
    <div
      className={`rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 ${className}`}
    >
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
        <FiCreditCard className="shrink-0" />
        {t('transfers.receivingAccount.activeTitle')}
      </p>
      <p className="mt-1 break-words text-xs font-semibold text-[var(--app-text)] [overflow-wrap:anywhere]">
        {account.label || account.method || t('transfers.receivingAccount.businessDetails')}
      </p>
      <div className="mt-3 grid gap-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex min-w-0 flex-wrap items-baseline justify-between gap-2 text-sm"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
              {row.label}
            </span>
            <div className="flex min-w-0 max-w-full items-center justify-end gap-1">
              <strong
                className="min-w-0 max-w-full break-words text-right [overflow-wrap:anywhere]"
                title={String(row.value)}
              >
                {row.value}
              </strong>
              {row.copyable ? (
                <button
                  type="button"
                  onClick={() => onCopy(copyValue)}
                  aria-label={copyLabel}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
                >
                  <FiCopy className="text-sm" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
