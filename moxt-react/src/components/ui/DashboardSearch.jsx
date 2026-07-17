import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiSearch, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { searchTypeMeta } from '../../config/searchTypes'
import { useLanguage } from '../../contexts/useLanguage'
import { filterSearchIndex, selectSearchIndex } from '../../features/searchSelectors'
import { Badge } from './Badge'

export function DashboardSearch() {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const anchorRef = useRef(null)
  const [panelRect, setPanelRect] = useState(null)
  const index = useSelector(selectSearchIndex)
  const results = useMemo(
    () => (query.trim() ? filterSearchIndex(index, query) : []),
    [index, query],
  )
  const showPanel = Boolean(query.trim())

  useLayoutEffect(() => {
    if (!showPanel || !anchorRef.current) {
      setPanelRect(null)
      return
    }
    function updateRect() {
      if (!anchorRef.current) return
      const rect = anchorRef.current.getBoundingClientRect()
      setPanelRect({
        top: rect.bottom + 8,
        left: Math.max(12, rect.left),
        width: Math.min(rect.width, window.innerWidth - 24),
      })
    }
    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [showPanel, query])

  return (
    <section
      ref={anchorRef}
      className="relative min-w-0 rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
            {t('dashboard.search.title')}
          </p>
          <p className="mt-1 text-xs text-[var(--app-text-faint)]">
            {t('dashboard.search.hint')}
          </p>
        </div>
        {query ? (
          <strong className="shrink-0 rounded-full bg-[var(--app-surface-muted)] px-2.5 py-1 text-xs text-[var(--app-text)]">
            {t(results.length > 1 ? 'catalog.search.resultsPlural' : 'catalog.search.results', {
              count: results.length,
            })}
          </strong>
        ) : null}
      </div>
      <label className="relative block min-w-0">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-text-faint)]" />
        <input
          aria-label={t('dashboard.search.title')}
          className="min-h-13 w-full min-w-0 rounded-[var(--radius-input)] bg-[var(--app-surface-muted)] pl-11 pr-12 text-sm outline-none transition duration-[var(--transition-fast)] focus:bg-[var(--app-surface)] focus:shadow-[0_0_0_3px_rgba(18,191,163,0.14)]"
          placeholder={t('dashboard.search.placeholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface)]"
            aria-label={t('catalog.search.clearSearch')}
            onClick={() => setQuery('')}
          >
            <FiX />
          </button>
        ) : null}
      </label>

      <p className="mt-3 text-xs text-[var(--app-text-faint)]">
        {t('catalog.search.liveHint')}
      </p>

      {showPanel && panelRect
        ? createPortal(
            <div
              data-navbar-ignore
              className="scrollbar-hidden fixed z-[var(--z-nav-menu)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[var(--shadow-card-lg)]"
              style={{
                top: panelRect.top,
                left: panelRect.left,
                width: panelRect.width,
                maxHeight: `min(25rem, calc(100dvh - ${panelRect.top}px - 1rem))`,
              }}
            >
              {results.length ? (
                <ul className="m-0 grid list-none gap-0 p-0 divide-y divide-[var(--app-border)]">
                  {results.map((result, index) => {
                    const type = searchTypeMeta(result.type, result.typeLabel)
                    return (
                      <li
                        key={`${result.type}-${result.id}`}
                        className="animate-[global-search-item-in_220ms_ease-out_both] min-w-0"
                        style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
                      >
                        <Link
                          to={result.path}
                          onClick={() => setQuery('')}
                          className="flex min-w-0 items-center gap-3 rounded-xl p-3 transition hover:bg-[var(--app-surface-muted)]"
                        >
                          <Badge className="shrink-0" tone={type.tone}>
                            {type.label}
                          </Badge>
                          <span className="min-w-0 flex-1 overflow-hidden">
                            <strong className="block truncate text-sm leading-snug">{result.title}</strong>
                            <span className="mt-0.5 block truncate text-xs text-[var(--app-text-muted)]">
                              {result.subtitle}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="p-4 text-center text-sm text-[var(--app-text-muted)]">
                  {t('dashboard.search.noResults', { query })}
                </p>
              )}
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
