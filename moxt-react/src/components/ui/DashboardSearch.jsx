import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiSearch, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { searchTypeMeta } from '../../config/searchTypes'
import { filterSearchIndex, selectSearchIndex } from '../../features/searchSelectors'
import { Badge } from './Badge'

export function DashboardSearch() {
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

  return (
    <section
      ref={anchorRef}
      className="relative rounded-[2rem] bg-[var(--app-surface)] p-4 shadow-[0_20px_60px_rgb(16_24_40/0.07)] sm:p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-black">Recherche rapide</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Trouvez un colis, une entreprise, une offre, un job, un événement, une page de
            paramètres ou de votre profil.
          </p>
        </div>
        {query ? <Badge>{results.length} résultat(s)</Badge> : null}
      </div>
      <label className="relative block">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-700" />
        <input
          aria-label="Recherche rapide"
          className="min-h-14 w-full rounded-2xl bg-[var(--app-surface-muted)] pl-11 pr-12 text-sm outline-none focus:shadow-[0_0_0_4px_rgb(22_169_143/0.09)]"
          placeholder="Rechercher : Cotonou, colis, job, paramètres, sécurité, profil..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl bg-[var(--app-bg)]"
            aria-label="Effacer la recherche"
            onClick={() => setQuery('')}
          >
            <FiX />
          </button>
        ) : null}
      </label>

      {showPanel && panelRect
        ? createPortal(
            <div
              data-navbar-ignore
              className="scrollbar-hidden fixed z-[var(--z-nav-menu)] overflow-y-auto rounded-[1.35rem] border border-[var(--app-border)]/60 bg-[var(--app-surface)] p-3 shadow-[0_30px_80px_rgb(16_24_40/0.22)]"
              style={{
                top: panelRect.top,
                left: panelRect.left,
                width: panelRect.width,
                maxHeight: `min(25rem, calc(100dvh - ${panelRect.top}px - 1rem))`,
              }}
            >
              {results.length ? (
                <div className="grid gap-2">
                  {results.map((result) => {
                    const type = searchTypeMeta(result.type, result.typeLabel)
                    return (
                      <Link
                        key={`${result.type}-${result.id}`}
                        to={result.path}
                        onClick={() => setQuery('')}
                        className="flex items-center gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <Badge tone={type.tone}>{type.label}</Badge>
                        <span className="min-w-0">
                          <strong className="block truncate">{result.title}</strong>
                          <span className="mt-1 block truncate text-xs text-[var(--app-text-muted)]">
                            {result.subtitle}
                          </span>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="p-5 text-center text-sm text-[var(--app-text-muted)]">
                  Aucun résultat pour « {query} ».
                </p>
              )}
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
