import { useEffect } from 'react'
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll'

const VARIANTS = {
  /** Onglets catalogue (colis, jobs…) — soulignement classique */
  underline: {
    root: 'scrollbar-hidden flex min-w-0 touch-pan-x items-center gap-6 overflow-x-auto border-b border-[var(--app-border)]',
    button: (active) =>
      `relative flex shrink-0 items-center gap-2 whitespace-nowrap pb-3 text-sm font-bold transition-colors ${
        active
          ? 'text-[var(--app-text)]'
          : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
      }`,
    count: (active) =>
      `rounded-full px-1.5 py-0.5 text-[11px] font-black tabular-nums ${
        active
          ? 'bg-brand-600 text-white'
          : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
      }`,
    indicator: true,
  },
  /** Navigation principale (Publications | Avis) — segments larges */
  section: {
    root: 'scrollbar-hidden flex w-full min-w-0 touch-pan-x gap-1 overflow-x-auto overscroll-x-contain rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 p-1 sm:w-auto',
    button: (active) =>
      `flex min-h-11 min-w-[8.25rem] shrink-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[calc(var(--radius-card)-0.25rem)] px-4 py-2.5 text-sm font-black transition-all sm:min-w-[9.5rem] ${
        active
          ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--shadow-card)] ring-1 ring-[var(--app-border)]'
          : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface)]/50 hover:text-[var(--app-text)]'
      }`,
    count: (active) =>
      `rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums ${
        active
          ? 'bg-brand-700 text-white dark:bg-brand-600'
          : 'bg-[var(--app-surface)] text-[var(--app-text-faint)]'
      }`,
    indicator: false,
  },
  /** Filtre secondaire (Actives | Archives) — pastilles compactes */
  filter: {
    root: 'inline-flex flex-wrap items-center gap-2',
    button: (active) =>
      `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
        active
          ? 'border-brand-300 bg-brand-50 text-brand-800 shadow-sm dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200'
          : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:border-[var(--app-border)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'
      }`,
    count: (active) =>
      `rounded-full px-1.5 py-px text-[10px] font-black tabular-nums ${
        active
          ? 'bg-brand-700/15 text-brand-800 dark:text-brand-200'
          : 'bg-[var(--app-surface-muted)] text-[var(--app-text-faint)]'
      }`,
    indicator: false,
  },
  /** Catalogue type marketplace / favoris — pastilles icône + compteur */
  chips: {
    root: 'scrollbar-hidden -mx-1 flex snap-x snap-mandatory touch-pan-x gap-2 overflow-x-auto px-1 pb-1',
    kind: 'chips',
    indicator: false,
  },
}

function visibleTabs(tabs) {
  return tabs.filter(({ count, alwaysShow }) => alwaysShow || count === undefined || count > 0)
}

function ChipTab({ tab, isActive, onChange }) {
  const Icon = tab.icon
  const accessibleName = tab.count !== undefined ? `${tab.label} (${tab.count})` : tab.label
  return (
    <button
      type="button"
      role="tab"
      title={accessibleName}
      aria-label={accessibleName}
      aria-selected={isActive}
      onClick={() => onChange(tab.key)}
      className={`flex h-[5.35rem] w-[5.15rem] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-[1.1rem] px-1.5 transition duration-[var(--transition-fast)] ${
        isActive
          ? 'bg-brand-700 text-white shadow-sm dark:bg-brand-600'
          : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] shadow-sm ring-1 ring-[var(--app-border)] hover:text-[var(--app-text)]'
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-xl leading-none ${
          isActive
            ? 'bg-white/20 text-white'
            : `bg-gradient-to-br text-white ${tab.color || 'from-brand-500 to-teal-500'}`
        }`}
      >
        {Icon ? <Icon aria-hidden="true" className="block size-[1.125rem] shrink-0" /> : null}
      </span>
      <span className="flex h-[1.7rem] w-full flex-col items-center justify-center text-center text-[10px] font-black leading-tight tracking-wide">
        <span className="line-clamp-1">{tab.label}</span>
        {tab.count !== undefined ? (
          <span className={isActive ? 'text-white/80' : 'text-[var(--app-text-faint)]'}>
            ({tab.count})
          </span>
        ) : null}
      </span>
    </button>
  )
}

export function CatalogArchiveTabs({ active, onChange, tabs, variant = 'underline', className = '' }) {
  const styles = VARIANTS[variant] ?? VARIANTS.underline
  const scrollRef = useHorizontalScroll()
  const tabsToShow = visibleTabs(tabs)
  const visibleKeys = tabsToShow.map((tab) => tab.key).join(',')

  useEffect(() => {
    if (!visibleKeys) return
    const keys = visibleKeys.split(',')
    if (!keys.includes(active)) {
      onChange(keys[0])
    }
  }, [active, onChange, visibleKeys])

  if (tabsToShow.length === 0) return null

  return (
    <div ref={scrollRef} className={`${styles.root} ${className}`.trim()} role="tablist">
      {tabsToShow.map((tab) => {
        const isActive = active === tab.key
        if (styles.kind === 'chips') {
          return <ChipTab key={tab.key} tab={tab} isActive={isActive} onChange={onChange} />
        }

        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={styles.button(isActive)}
          >
            {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" /> : null}
            {tab.label}
            {tab.count !== undefined ? (
              <span className={styles.count(isActive)}>{tab.count}</span>
            ) : null}
            {styles.indicator && isActive ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
