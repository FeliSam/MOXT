export function PageHeader({ eyebrow, title, description, actions, stats }) {
  return (
    <header className="flex min-w-0 max-w-full flex-col gap-5 overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)]/80 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-7">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display break-words text-2xl font-extrabold tracking-[-0.02em] text-[var(--app-text)] sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex min-w-0 flex-wrap gap-2 sm:shrink-0">{actions}</div> : null}
      </div>

      {stats?.length ? (
        <div className="grid grid-cols-2 gap-2.5 border-t border-[var(--app-border)] pt-4 sm:flex sm:flex-wrap">
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
