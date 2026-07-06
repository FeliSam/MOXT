import { FiCheck, FiUser } from 'react-icons/fi'
import { TRANSFER_PROGRESS_STEPS } from './transferDetailConfig'

export function TransferProgressStepper({ status }) {
  const activeIndex = TRANSFER_PROGRESS_STEPS.findIndex((step) => step.key === status)

  return (
    <div className="mt-5 flex items-center">
      {TRANSFER_PROGRESS_STEPS.map((step, index) => {
        const isDone = activeIndex >= 0 && index < activeIndex
        const isCurrent = index === activeIndex
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-black transition ${
                  isDone
                    ? 'bg-brand-700 text-white dark:bg-brand-600'
                    : isCurrent
                      ? 'bg-brand-700 text-white ring-4 ring-brand-100 dark:bg-brand-600 dark:ring-brand-900/50'
                      : 'bg-[var(--app-surface-muted)] text-[var(--app-text-faint)]'
                }`}
              >
                {isDone ? <FiCheck /> : index + 1}
              </span>
              <span
                className={`whitespace-nowrap text-[11px] font-bold ${
                  isDone || isCurrent ? 'text-[var(--app-text)]' : 'text-[var(--app-text-faint)]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < TRANSFER_PROGRESS_STEPS.length - 1 ? (
              <span
                className={`mx-2 h-0.5 flex-1 rounded-full ${
                  isDone ? 'bg-brand-700 dark:bg-brand-600' : 'bg-[var(--app-surface-muted)]'
                }`}
              />
            ) : null}
          </div>
        )
      })}
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
