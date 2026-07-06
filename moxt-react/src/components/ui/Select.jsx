import { useId } from 'react'
import { FiChevronDown } from 'react-icons/fi'

/*
  API identique a l'ancienne version (label, error, id, children, className).
  Nouvelle apparence coherente avec Input v2.
*/
export function Select({ children, className = '', error, hint, label, id, wrapperClass = '', ...props }) {
  const generatedId = useId()
  const selectId = id || generatedId
  const messageId = `${selectId}-message`

  const borderClass = error
    ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]'
    : 'border-transparent focus:border-[var(--app-teal)] focus:shadow-[0_0_0_3px_rgba(18,191,163,0.14)]'

  return (
    <div className={`grid min-w-0 gap-1.5 ${wrapperClass}`}>
      {label ? (
        <label
          htmlFor={selectId}
          className="min-w-0 break-words text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={`
            min-h-12 min-w-0 w-full max-w-full appearance-none
            rounded-[var(--radius-input)] border
            bg-[var(--app-surface-muted)] pl-4 pr-10
            text-[var(--app-text)] outline-none
            transition duration-[var(--transition-fast)]
            focus:bg-[var(--app-surface)]
            disabled:cursor-not-allowed disabled:opacity-50
            ${borderClass}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>

        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--app-text-faint)]">
          <FiChevronDown className="text-base" aria-hidden="true" />
        </span>
      </div>

      {error ? (
        <span id={messageId} className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={messageId} className="text-xs text-[var(--app-text-faint)]">
          {hint}
        </span>
      ) : null}
    </div>
  )
}
