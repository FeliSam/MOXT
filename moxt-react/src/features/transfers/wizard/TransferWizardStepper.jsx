import { FiCheck } from 'react-icons/fi'
import { TRANSFER_WIZARD_STEPS } from './transferWizardConfig'

export function TransferWizardStepper({ step, onGoTo }) {
  return (
    <div className="relative flex items-start justify-between">
      <div className="absolute left-0 right-0 top-5 h-px bg-[var(--app-border)]" aria-hidden />
      <div
        className="absolute left-0 top-5 h-px bg-brand-600 transition-all duration-500"
        style={{ width: `${((step - 1) / (TRANSFER_WIZARD_STEPS.length - 1)) * 100}%` }}
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
            className="relative z-10 flex flex-col items-center gap-2"
          >
            <span
              className={`grid size-10 place-items-center rounded-full border-2 transition-all duration-300 ${
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
              className={`text-xs font-bold ${active ? 'text-brand-700 dark:text-brand-400' : 'text-[var(--app-text-muted)]'}`}
            >
              {entry.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
