import { FiCopy } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'

export function TransferDetailRow({ label, value, onCopy }) {
  const { t } = useLanguage()
  const valueText = value == null ? '' : String(value)
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 py-3">
      <span className="min-w-0 shrink-0 text-[var(--app-text-muted)]">{label}</span>
      <span className="flex min-w-0 max-w-[65%] items-start justify-end gap-2 sm:max-w-[70%]">
        <strong
          className="min-w-0 break-words text-right [overflow-wrap:anywhere]"
          title={valueText || undefined}
        >
          {value}
        </strong>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="grid size-7 shrink-0 place-items-center rounded-full text-[var(--app-text-faint)] transition hover:bg-[var(--app-surface-muted)] hover:text-brand-700"
            aria-label={t('transfers.detail.copyAria', { label })}
          >
            <FiCopy className="text-xs" />
          </button>
        ) : null}
      </span>
    </div>
  )
}
