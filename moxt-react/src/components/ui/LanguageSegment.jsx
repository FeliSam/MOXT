import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../config/uiTranslations'

/**
 * Compact language segmented control (chips) for auth / settings.
 * Accessible radiogroup with keyboard-activatable buttons.
 * Buttons share the full row equally so the control fills its container.
 */
export function LanguageSegment({
  value,
  onChange,
  ariaLabel,
  className = '',
  size = 'md',
}) {
  const compact = size === 'sm'
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`flex w-full min-w-0 gap-1.5 ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((code) => {
        const meta = LANGUAGE_LABELS[code] || { flag: '🏳️', label: code.toUpperCase() }
        const active = value === code
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={meta.label}
            title={meta.label}
            onClick={() => onChange(code)}
            className={`inline-flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 border font-extrabold uppercase tracking-[0.06em] transition duration-[var(--transition-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-teal)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-surface)] ${
              compact
                ? 'min-h-11 rounded-xl px-1 py-1.5 text-[10px]'
                : 'min-h-12 rounded-[var(--radius-input)] px-1.5 py-1.5 text-[11px]'
            } ${
              active
                ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-accent)] shadow-sm'
                : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:border-[var(--app-accent)]/40 hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            <span className="flex max-w-full items-center justify-center gap-1">
              <span className={compact ? 'text-sm leading-none' : 'text-base leading-none'} aria-hidden>
                {meta.flag}
              </span>
              <span>{code}</span>
            </span>
            <span className="max-w-full truncate text-[9px] font-bold normal-case tracking-normal leading-tight opacity-80">
              {meta.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
