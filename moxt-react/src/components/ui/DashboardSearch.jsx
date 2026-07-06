import { useMemo, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { searchTypeMeta } from '../../config/searchTypes'
import { filterSearchIndex, selectSearchIndex } from '../../features/searchSelectors'
import { Badge } from './Badge'

export function DashboardSearch() {
  const [query, setQuery] = useState('')
  const index = useSelector(selectSearchIndex)
  const results = useMemo(
    () => (query.trim() ? filterSearchIndex(index, query) : []),
    [index, query],
  )

  return (
    <section className="relative rounded-[2rem] bg-[var(--app-surface)] p-4 shadow-[0_20px_60px_rgb(16_24_40/0.07)] sm:p-5">
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

      {query ? (
        <div
          data-navbar-ignore
          className="scrollbar-hidden absolute left-0 right-0 top-[calc(100%-0.75rem)] z-40 max-h-[25rem] overflow-y-auto rounded-b-[2rem] rounded-t-[1.25rem] bg-[var(--app-surface)] p-3 pt-5 shadow-[0_30px_80px_rgb(16_24_40/0.22)]"
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
        </div>
      ) : null}
    </section>
  )
}
