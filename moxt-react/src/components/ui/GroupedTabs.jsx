/**
 * Navigation par groupes — évite une barre d’onglets trop longue.
 * @param {{ id: string, label: string, tabs: { value: string, label: string, count?: number }[] }[]} groups
 */
export function GroupedTabs({ active, groups, onChange, label = 'Sections' }) {
  const flatTabs = groups.flatMap((group) => group.tabs)

  return (
    <nav
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
      aria-label={label}
    >
      {groups.map((group) => (
        <section
          key={group.id}
          className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)]/80 p-3 shadow-[var(--shadow-card)]"
        >
          <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
            {group.label}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5" role="tablist" aria-label={group.label}>
            {group.tabs.map((tab) => {
              const isActive = active === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(tab.value)}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all sm:text-sm ${
                    isActive
                      ? 'bg-brand-700 text-white shadow-[0_8px_20px_rgb(8_112_95/0.22)] dark:bg-brand-600'
                      : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:bg-[var(--app-accent-soft)] hover:text-brand-800 dark:hover:text-brand-200'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined ? (
                    <span
                      className={`rounded-full px-1.5 py-px text-[10px] font-black tabular-nums ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--app-surface)] text-[var(--app-text-faint)]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </section>
      ))}
      <span className="sr-only" role="tablist">
        {flatTabs.map((tab) => (
          <span key={tab.value} aria-selected={active === tab.value}>
            {tab.label}
          </span>
        ))}
      </span>
    </nav>
  )
}

export function flattenGroupedTabs(groups) {
  return groups.flatMap((group) => group.tabs)
}
