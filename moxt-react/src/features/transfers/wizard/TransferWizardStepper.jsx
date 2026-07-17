import { FiCheck } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { TRANSFER_WIZARD_STEPS } from './transferWizardConfig'

export function TransferWizardStepper({ step, onGoTo }) {
  const { t } = useLanguage()

  return (
    <div className="relative flex items-start justify-between gap-1 sm:gap-2">
      <div className="absolute left-3 right-3 top-5 h-px bg-[var(--app-border)] sm:left-5 sm:right-5" aria-hidden />
      <div
        className="absolute left-3 top-5 h-px bg-brand-600 transition-all duration-500 sm:left-5"
        style={{
          width:
            step <= 1
              ? '0%'
              : `calc(${((step - 1) / (TRANSFER_WIZARD_STEPS.length - 1)) * 100}% - 0.75rem)`,
        }}
        aria-hidden
      />
      {TRANSFER_WIZARD_STEPS.map((entry, index) => {
        const stepNumber = index + 1
        const done = step > stepNumber
        const active = step === stepNumber
        const Icon = entry.icon
        return (
          <button
            key={entry.key}
            type="button"
            disabled={stepNumber > step}
            onClick={() => stepNumber < step && onGoTo(stepNumber)}
            className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2"
          >
            <span
              className={`grid size-9 place-items-center rounded-full border-2 transition-all duration-300 sm:size-10 ${
                done
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : active
                    ? 'border-brand-600 bg-white text-brand-700 shadow-lg shadow-brand-200 dark:bg-slate-900 dark:shadow-none'
                    : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]'
              }`}
            >
              {done ? <FiCheck className="text-sm" /> : <Icon className="text-sm" />}
            </span>
            <span
              className={`max-w-full truncate px-0.5 text-center text-[10px] font-bold leading-tight sm:text-xs ${
                active ? 'text-brand-700 dark:text-brand-400' : 'text-[var(--app-text-muted)]'
              }`}
            >
              {t(entry.labelKey)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
