import { useEffect } from 'react'
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll'

/**
 * Onglets style mock public : texte teal actif, gris inactif, soulignement.
 */
export function PublicProfileTabs({ active, onChange, tabs = [], className = '' }) {
  const scrollRef = useHorizontalScroll()
  const visible = tabs.filter(({ alwaysShow, count }) => alwaysShow || count === undefined || count > 0)
  const keys = visible.map((tab) => tab.key).join(',')

  useEffect(() => {
    if (!keys) return
    const list = keys.split(',')
    if (!list.includes(active)) onChange(list[0])
  }, [active, keys, onChange])

  if (visible.length === 0) return null

  return (
    <div
      ref={scrollRef}
      role="tablist"
      className={`scrollbar-hidden -mx-1 flex touch-pan-x gap-5 overflow-x-auto border-b border-[var(--app-border)] px-1 ${className}`}
    >
      {visible.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`relative shrink-0 whitespace-nowrap pb-3 text-sm font-bold transition-colors ${
              isActive
                ? 'text-brand-700 dark:text-brand-300'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 ? (
              <span
                className={`ml-1.5 text-xs font-black tabular-nums ${
                  isActive ? 'text-brand-600/80' : 'text-[var(--app-text-faint)]'
                }`}
              >
                {tab.count}
              </span>
            ) : null}
            {isActive ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-700 dark:bg-brand-400" />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
