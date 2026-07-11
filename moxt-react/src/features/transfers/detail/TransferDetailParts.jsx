import { FiCheck, FiUser } from 'react-icons/fi'
import { getTransferProgressState } from '../transferProgressUtils'

export function TransferProgressStepper({ activeIndex, steps: stepsProp, transfer }) {
  const resolved = stepsProp
    ? { steps: stepsProp, activeIndex: activeIndex ?? 0 }
    : getTransferProgressState(transfer)

  const { steps, activeIndex: active } = resolved

  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-[min(100%,36rem)] items-start gap-0 px-1 sm:min-w-full">
        {steps.map((step, index) => {
          const isDone = step.done
          const isCurrent = step.active || (index === active && !isDone)
          const isUpcoming = !isDone && !isCurrent

          return (
            <div
              key={step.key}
              className={`flex min-w-0 flex-1 items-start ${index < steps.length - 1 ? 'pr-1' : ''}`}
            >
              <div className="flex w-full min-w-[4.5rem] flex-col items-center gap-1.5">
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
                  className={`max-w-[4.5rem] text-center text-[10px] font-bold leading-tight sm:max-w-none sm:text-[11px] ${
                    isDone
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : isCurrent
                        ? 'text-[var(--app-text)]'
                        : 'text-[var(--app-text-faint)]'
                  }`}
                >
                  {step.label}
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

export function TransferParticipantCard({ party, title }) {
  const initials = `${party.firstName?.[0] || ''}${party.lastName?.[0] || ''}`.toUpperCase()

  return (
    <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-black text-white dark:bg-brand-600">
          {initials || <FiUser />}
        </span>
        <div className="min-w-0">
          <span className="block text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
            {title}
          </span>
          <strong className="block truncate">
            {party.firstName} {party.lastName}
          </strong>
        </div>
      </div>
      <span className="mt-3 block text-xs text-[var(--app-text-muted)]">{party.phone}</span>
      <span className="mt-1 block text-xs text-[var(--app-text-muted)]">{party.method}</span>
    </div>
  )
}
