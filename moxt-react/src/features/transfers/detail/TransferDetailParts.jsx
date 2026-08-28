import { FiCheck, FiCopy, FiHeart, FiUser } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { getTransferProgressState } from '../transferProgressUtils'

export function TransferProgressStepper({ activeIndex, steps: stepsProp, transfer }) {
  const { t } = useLanguage()
  const resolved = stepsProp
    ? { steps: stepsProp, activeIndex: activeIndex ?? 0 }
    : getTransferProgressState(transfer)

  const { steps, activeIndex: active } = resolved

  return (
    <div className="scrollbar-hidden -mx-1 touch-pan-x overflow-x-auto overscroll-x-contain pb-1">
      <div className="flex w-full min-w-0 items-start gap-0 px-1">
        {steps.map((step, index) => {
          const isDone = step.done
          const isCurrent = step.active || (index === active && !isDone)

          return (
            <div
              key={step.key}
              className={`flex min-w-0 flex-1 items-start ${index < steps.length - 1 ? 'pr-0.5' : ''}`}
            >
              <div className="flex w-full min-w-[3rem] flex-col items-center gap-1 sm:min-w-[4.5rem]">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-black transition-all duration-300 ${
                    isDone
                      ? 'scale-100 bg-emerald-600 text-white'
                      : isCurrent
                        ? 'scale-110 bg-brand-700 text-white ring-4 ring-brand-100 dark:bg-brand-600 dark:ring-brand-900/50'
                        : 'bg-[var(--app-surface-muted)] text-[var(--app-text-faint)]'
                  }`}
                >
                  {isDone ? <FiCheck className="text-sm" /> : index + 1}
                </span>
                <span
                  className={`max-w-[3.25rem] text-center text-[9px] font-bold leading-tight sm:max-w-none sm:text-[11px] ${
                    isDone
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : isCurrent
                        ? 'text-[var(--app-text)]'
                        : 'text-[var(--app-text-faint)]'
                  }`}
                >
                  {step.labelKey ? t(step.labelKey) : step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <span
                  className={`mx-1 mt-4 h-0.5 min-w-[0.75rem] flex-1 rounded-full transition-colors duration-300 ${
                    steps[index + 1]?.done
                      ? 'bg-emerald-600'
                      : isDone
                        ? 'bg-brand-300 dark:bg-brand-700'
                        : 'bg-[var(--app-surface-muted)]'
                  }`}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TransferParticipantCard({
  isFavorite = false,
  onCopyPhone = null,
  onToggleFavorite,
  party,
  title,
}) {
  const { t } = useLanguage()
  const initials = `${party.firstName?.[0] || ''}${party.lastName?.[0] || ''}`.toUpperCase()
  const canFavorite = typeof onToggleFavorite === 'function'

  const fullName = `${party.firstName || ''} ${party.lastName || ''}`.trim()

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-[var(--app-surface-muted)] p-4">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-black text-white dark:bg-brand-600">
            {initials || <FiUser />}
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="block text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
              {title}
            </span>
            <strong className="block truncate" title={fullName}>
              {fullName}
            </strong>
          </div>
        </div>
        {canFavorite ? (
          <button
            type="button"
            className={`grid size-9 shrink-0 place-items-center rounded-xl transition ${
              isFavorite
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-rose-600'
            }`}
            aria-label={
              isFavorite
                ? t('transfers.detail.participants.removeFavorite')
                : t('transfers.detail.participants.addFavorite')
            }
            aria-pressed={isFavorite}
            onClick={onToggleFavorite}
          >
            <FiHeart className={isFavorite ? 'fill-current' : ''} />
          </button>
        ) : null}
      </div>
      {party.phone ? (
        <div className="mt-3 flex min-w-0 items-center gap-1">
          <span
            className="min-w-0 flex-1 truncate text-xs text-[var(--app-text-muted)]"
            title={party.phone}
          >
            {party.phone}
          </span>
          {onCopyPhone ? (
            <button
              type="button"
              onClick={() => onCopyPhone(party.phone)}
              aria-label={t('transfers.receivingAccount.copyDetails')}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
            >
              <FiCopy className="text-sm" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
      <span className="mt-1 block truncate text-xs text-[var(--app-text-muted)]" title={party.method}>
        {party.method}
      </span>
    </div>
  )
}
