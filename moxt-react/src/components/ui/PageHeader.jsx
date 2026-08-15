import { Link } from 'react-router-dom'

export const headerIslandClass =
  'grid size-11 place-items-center rounded-2xl border border-[var(--app-border)] bg-transparent text-brand-700 shadow-[var(--shadow-card)] backdrop-blur-sm transition hover:bg-[var(--app-surface)]/35 dark:text-brand-300'

export function HeaderIslandWrap({ label, children, className = '' }) {
  return (
    <span className={`group relative inline-flex shrink-0 ${className}`.trim()}>
      {label ? <span className="header-island-label">{label}</span> : null}
      {children}
    </span>
  )
}

export function HeaderIslandButton({
  icon: Icon,
  label,
  onClick,
  to,
  active = false,
  className = '',
  ...props
}) {
  const control = (
    <span className={`${headerIslandClass} ${active ? 'bg-[var(--app-accent-soft)]' : ''}`}>
      {Icon ? <Icon className="text-base" aria-hidden="true" /> : null}
    </span>
  )
  const classes = `btn-press inline-flex shrink-0 ${className}`

  return (
    <HeaderIslandWrap label={label}>
      {to ? (
        <Link to={to} aria-label={label} className={classes} onClick={onClick} {...props}>
          {control}
        </Link>
      ) : (
        <button type="button" onClick={onClick} aria-label={label} className={classes} {...props}>
          {control}
        </button>
      )}
    </HeaderIslandWrap>
  )
}

export function PageHeader({ eyebrow, title, description, actions, stats }) {
  return (
    <header className="flex min-w-0 max-w-full flex-col gap-4 overflow-visible rounded-[var(--radius-card-lg)] border-0 bg-[var(--app-surface)]/80 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:gap-5 sm:p-7">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          {eyebrow ? (
            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display min-w-0 truncate text-xl font-extrabold tracking-[-0.02em] text-[var(--app-text)] sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 hidden max-w-2xl break-words text-sm leading-6 text-[var(--app-text-muted)] sm:block">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="relative z-20 flex shrink-0 flex-wrap items-center justify-end gap-2">
            {actions}
          </div>
        ) : null}
      </div>

      {stats?.length ? (
        <div className="hidden gap-2.5 sm:flex sm:flex-wrap">
          {stats.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl bg-[var(--app-surface-muted)] px-4 py-2.5 sm:min-w-[8rem]"
            >
              <strong className="block text-lg font-black tabular-nums">{value}</strong>
              <span className="text-[11px] font-semibold text-[var(--app-text-faint)]">{label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </header>
  )
}
