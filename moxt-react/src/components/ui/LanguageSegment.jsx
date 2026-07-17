import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../config/uiTranslations'

/**
 * Compact language segmented control (chips) for auth / settings.
 * Accessible radiogroup with keyboard-activatable buttons.
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
      className={`flex flex-wrap gap-1.5 ${className}`}
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
            className={`inline-flex shrink-0 items-center gap-1 border font-extrabold uppercase tracking-[0.06em] transition duration-[var(--transition-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-teal)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-surface)] ${
              compact
                ? 'h-7 rounded-lg px-2 text-[10px]'
                : 'h-8 rounded-xl px-2.5 text-[11px]'
            } ${
              active
                ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-accent)] shadow-sm'
                : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:border-[var(--app-accent)]/40 hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            <span className={compact ? 'text-sm leading-none' : 'text-base leading-none'} aria-hidden>
              {meta.flag}
            </span>
            <span>{code}</span>
          </button>
        )
      })}
    </div>
  )
}
