import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiSearch, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { searchTypeMeta } from '../../config/searchTypes'
import { filterSearchIndex, selectSearchIndex } from '../../features/searchSelectors'
import { Badge } from '../ui/Badge'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const anchorRef = useRef(null)
  const [panelRect, setPanelRect] = useState(null)
  const index = useSelector(selectSearchIndex)
  const results = useMemo(
    () => (query.trim().length < 2 ? [] : filterSearchIndex(index, query).slice(0, 10)),
    [index, query],
  )
  const showPanel = query.trim().length >= 2

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
        left: rect.left,
        width: rect.width,
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

  useEffect(() => {
    function focusSearch(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (!inputRef.current || inputRef.current.offsetParent === null) return
        event.preventDefault()
        inputRef.current.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  return (
    <div ref={anchorRef} className="group relative w-full max-w-[34rem]">
      <FiSearch className="pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-brand-700" />
      <input
        ref={inputRef}
        aria-label="Recherche globale"
        className="min-h-12 w-full rounded-[1.15rem] bg-[var(--app-surface-muted)] pl-11 pr-20 text-sm outline-none transition-[background-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[color-mix(in_srgb,var(--app-surface-muted)_85%,white)] focus:bg-white focus:shadow-[0_0_0_4px_rgb(8_112_95/0.08)] dark:hover:bg-[var(--app-surface)] dark:focus:bg-[var(--app-surface)]"
        placeholder="Recherche globale"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query ? (
        <button
          type="button"
          className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:bg-white hover:text-[var(--app-text)] active:scale-95 dark:hover:bg-slate-800"
          onClick={() => setQuery('')}
          aria-label="Effacer la recherche"
        >
          <FiX />
        </button>
      ) : (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-400 shadow-sm transition-opacity duration-300 dark:bg-slate-800">
          Ctrl K
        </span>
      )}
      {showPanel && panelRect
        ? createPortal(
            <div
              className="global-search-panel fixed z-[var(--z-nav-menu)] overflow-y-auto overflow-x-hidden rounded-[1.35rem] border border-[var(--app-border)]/60 bg-[var(--app-surface)] p-2 shadow-[0_24px_70px_rgb(15_23_42/0.18)]"
              style={{
                top: panelRect.top,
                left: panelRect.left,
                width: panelRect.width,
                maxHeight: `min(24rem, calc(100dvh - ${panelRect.top}px - 1rem))`,
              }}
            >
              {results.length ? (
                results.map(({ id, path, subtitle, title, type, typeLabel }, index) => {
                  const meta = searchTypeMeta(type, typeLabel)
                  return (
                    <Link
                      key={`${path}-${id}`}
                      to={path}
                      onClick={() => setQuery('')}
                      style={{ '--search-stagger': `${Math.min(index * 28, 160)}ms` }}
                      className="global-search-item group/item flex items-center gap-3 rounded-xl p-3"
                    >
                      <span className="global-search-item-badge shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/item:scale-105">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm transition-colors duration-300 group-hover/item:text-brand-700 dark:group-hover/item:text-brand-300">
                          {title}
                        </strong>
                        <span className="block truncate text-xs text-[var(--app-text-muted)] transition-colors duration-300">
                          {subtitle}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="global-search-item-chevron ml-auto shrink-0 text-[var(--app-text-faint)] opacity-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/item:translate-x-0.5 group-hover/item:opacity-100"
                      >
                        →
                      </span>
                    </Link>
                  )
                })
              ) : (
                <p className="global-search-empty p-3 text-sm text-[var(--app-text-muted)]">Aucun résultat.</p>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
