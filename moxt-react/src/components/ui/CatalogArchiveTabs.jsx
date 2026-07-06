export function CatalogArchiveTabs({ active, onChange, tabs }) {
  return (
    <div className="flex items-center gap-6 border-b border-[var(--app-border)]">
      {tabs.map(({ key, label, count }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`relative flex items-center gap-2 pb-3 text-sm font-bold transition-colors ${
            active === key
              ? 'text-[var(--app-text)]'
              : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          {label}
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] font-black tabular-nums ${
              active === key
                ? 'bg-brand-600 text-white'
                : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
            }`}
          >
            {count}
          </span>
          {active === key ? (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
          ) : null}
        </button>
      ))}
    </div>
  )
}
