import { useEffect, useMemo, useRef, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { searchTypeMeta } from '../../config/searchTypes'
import { filterSearchIndex, selectSearchIndex } from '../../features/searchSelectors'
import { Badge } from '../ui/Badge'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const index = useSelector(selectSearchIndex)
  const results = useMemo(
    () => (query.trim().length < 2 ? [] : filterSearchIndex(index, query).slice(0, 10)),
    [index, query],
  )

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
    <div className="relative w-full max-w-[34rem]">
      <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        aria-label="Recherche globale"
        className="min-h-12 w-full rounded-[1.15rem] bg-[var(--app-surface-muted)] pl-11 pr-20 text-sm outline-none transition focus:bg-white focus:shadow-[0_0_0_4px_rgb(8_112_95/0.08)] dark:focus:bg-[var(--app-surface)]"
        placeholder="Recherche globale"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query ? (
        <button
          type="button"
          className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-white dark:hover:bg-slate-800"
          onClick={() => setQuery('')}
          aria-label="Effacer la recherche"
        >
          <FiX />
        </button>
      ) : (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-400 shadow-sm dark:bg-slate-800">
          Ctrl K
        </span>
      )}
      {query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-[1.35rem] bg-[var(--app-surface)] p-2 shadow-[0_24px_70px_rgb(15_23_42/0.18)]">
          {results.length ? (
            results.map(({ id, path, subtitle, title, type, typeLabel }) => {
              const meta = searchTypeMeta(type, typeLabel)
              return (
                <Link
                  key={`${path}-${id}`}
                  to={path}
                  onClick={() => setQuery('')}
                  className="flex items-center gap-3 rounded-xl p-3 hover:bg-[var(--app-surface-muted)]"
                >
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm">{title}</strong>
                    <span className="text-xs text-[var(--app-text-muted)]">{subtitle}</span>
                  </span>
                </Link>
              )
            })
          ) : (
            <p className="p-3 text-sm text-[var(--app-text-muted)]">Aucun résultat.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
