import { useId } from 'react'
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

/*
  Props :
    label       — texte du label visible (toujours au-dessus)
    hint        — texte d'aide sous le champ
    error       — message d'erreur (remplace hint, colore le bord en rouge)
    success     — booleen ou string : bord vert + icone check
    iconLeft    — element React affiché a gauche dans le champ
    iconRight   — element React affiché a droite (remplacé par icone etat si error/success)
    id          — id explicite (sinon genere automatiquement)
    className   — classes additionnelles sur l'<input>
    wrapperClass— classes additionnelles sur le wrapper label

  Tous les autres props HTML sont passes a l'<input>.
  L'API existante (label, hint, error) est 100% conservee.
*/
export function Input({
  className = '',
  error,
  hint,
  label,
  id,
  iconLeft,
  iconRight,
  success = false,
  wrapperClass = '',
  ...props
}) {
  const generatedId = useId()
  const inputId = id || generatedId
  const messageId = `${inputId}-message`

  const hasState = error || success
  const borderClass = error
    ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]'
    : success
    ? 'border-emerald-400 focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]'
    : 'border-transparent focus:border-[var(--app-teal)] focus:shadow-[0_0_0_3px_rgba(18,191,163,0.14)]'

  return (
    <div className={`grid min-w-0 gap-1.5 ${wrapperClass}`}>
      {label ? (
        <label
          htmlFor={inputId}
          className="min-w-0 break-words text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        {iconLeft ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-text-faint)] [&>svg]:text-base">
            {iconLeft}
          </span>
        ) : null}

        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={`
            min-h-12 min-w-0 w-full rounded-[var(--radius-input)] border
            bg-[var(--app-surface-muted)] px-4
            text-[var(--app-text)] placeholder:text-[var(--app-text-faint)]
            outline-none transition duration-[var(--transition-fast)]
            focus:bg-[var(--app-surface)]
            disabled:cursor-not-allowed disabled:opacity-50
            ${borderClass}
            ${iconLeft ? 'pl-10' : ''}
            ${iconRight || hasState ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />

        {/* Icone droite : priorite a etat, puis iconRight */}
        {error ? (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500">
            <FiAlertCircle className="text-base" aria-hidden="true" />
          </span>
        ) : success ? (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
            <FiCheckCircle className="text-base" aria-hidden="true" />
          </span>
        ) : iconRight ? (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--app-text-faint)] [&>svg]:text-base">
            {iconRight}
          </span>
        ) : null}
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

/*
  Textarea — meme systeme de tokens que Input
*/
export function Textarea({
  className = '',
  error,
  hint,
  label,
  id,
  rows = 4,
  wrapperClass = '',
  ...props
}) {
  const generatedId = useId()
  const inputId = id || generatedId
  const messageId = `${inputId}-message`

  const borderClass = error
    ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]'
    : 'border-transparent focus:border-[var(--app-teal)] focus:shadow-[0_0_0_3px_rgba(18,191,163,0.14)]'

  return (
    <div className={`grid min-w-0 gap-1.5 ${wrapperClass}`}>
      {label ? (
        <label
          htmlFor={inputId}
          className="min-w-0 break-words text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]"
        >
          {label}
        </label>
      ) : null}

      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={`
          min-w-0 w-full rounded-[var(--radius-input)] border
          bg-[var(--app-surface-muted)] px-4 py-3
          text-[var(--app-text)] placeholder:text-[var(--app-text-faint)]
          outline-none transition duration-[var(--transition-fast)] resize-y
          focus:bg-[var(--app-surface)]
          disabled:cursor-not-allowed disabled:opacity-50
          ${borderClass}
          ${className}
        `}
        {...props}
      />

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
