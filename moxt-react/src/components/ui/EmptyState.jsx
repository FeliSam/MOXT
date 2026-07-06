/*
  EmptyState — etat vide uniforme sur toutes les pages

  Props :
    icon        — composant icone React (FiBox, FiSearch, etc.)
    title       — titre court et humain ("Aucune annonce trouvee")
    description — phrase explicative et rassurante (optionnel)
    action      — element React : bouton ou lien d'action (optionnel)
    size        — 'sm' | 'md' (defaut) | 'lg'
    tone        — 'default' | 'search' | 'error' | 'success' | 'warm'
    className   — classes additionnelles sur le wrapper
*/

const sizes = {
  sm: { wrap: 'min-h-32 p-5',  iconBox: 'size-10', iconText: 'text-lg', title: 'text-sm mt-2', desc: 'mt-1 text-xs', action: 'mt-3' },
  md: { wrap: 'min-h-52 p-7',  iconBox: 'size-14', iconText: 'text-2xl', title: 'text-base mt-3', desc: 'mt-2 text-sm', action: 'mt-4' },
  lg: { wrap: 'min-h-72 p-10', iconBox: 'size-18', iconText: 'text-3xl', title: 'text-lg mt-4', desc: 'mt-2 text-sm', action: 'mt-5' },
}

const tones = {
  default: {
    wrap:    'border-dashed border-[var(--app-border)] bg-[var(--app-surface)]',
    iconBox: 'bg-[var(--app-surface-muted)] text-[var(--app-text-faint)]',
    title:   'text-[var(--app-text)]',
  },
  search: {
    wrap:    'border-dashed border-[var(--app-border)] bg-[var(--app-surface)]',
    iconBox: 'bg-[var(--app-cobalt-soft)] text-[var(--app-cobalt)]',
    title:   'text-[var(--app-text)]',
  },
  error: {
    wrap:    'border-dashed border-red-200 bg-red-50/40 dark:border-red-900/30 dark:bg-red-950/10',
    iconBox: 'bg-red-100 text-red-500 dark:bg-red-950/50 dark:text-red-400',
    title:   'text-[var(--app-text)]',
  },
  success: {
    wrap:    'border-dashed border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/10',
    iconBox: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    title:   'text-[var(--app-text)]',
  },
  warm: {
    wrap:    'border-dashed border-[color-mix(in_srgb,var(--app-warm)_35%,var(--app-border))] bg-[var(--app-surface)] community-warm-bg',
    iconBox: 'bg-[var(--app-warm-soft)] text-[var(--app-warm)]',
    title:   'text-[var(--app-text)]',
  },
}

export function EmptyState({
  action,
  description,
  icon: Icon,
  title,
  size = 'md',
  tone = 'default',
  className = '',
}) {
  const s = sizes[size] ?? sizes.md
  const t = tones[tone] ?? tones.default

  return (
    <div
      className={`grid place-items-center rounded-2xl border text-center ${s.wrap} ${t.wrap} ${className}`}
    >
      <div className="flex flex-col items-center">
        {Icon ? (
          <span
            className={`mx-auto grid place-items-center rounded-2xl ${s.iconBox} ${t.iconBox}`}
          >
            <Icon className={s.iconText} aria-hidden="true" />
          </span>
        ) : null}

        {title ? (
          <h3 className={`font-black ${s.title} ${t.title}`}>{title}</h3>
        ) : null}

        {description ? (
          <p className={`mx-auto max-w-xs text-[var(--app-text-muted)] ${s.desc}`}>
            {description}
          </p>
        ) : null}

        {action ? (
          <div className={s.action}>{action}</div>
        ) : null}
      </div>
    </div>
  )
}
