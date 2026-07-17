import { FiCopy } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'

export function TransferDetailRow({ label, value, onCopy }) {
  const { t } = useLanguage()
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[var(--app-text-muted)]">{label}</span>
      <span className="flex items-center gap-2">
        <strong className="text-right">{value}</strong>
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
