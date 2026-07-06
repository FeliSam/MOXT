import { FiSearch } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { DISCOVERY_TYPES } from '../config/publicContent'
import { searchTypeMeta } from '../config/searchTypes'
import { filterSearchIndex, selectSearchIndex } from '../features/searchSelectors'
import { clearSearchHistory, readSearchHistory, saveSearchTerm } from '../services/searchHistory'

export function DiscoverPage() {
  const index = useSelector(selectSearchIndex)
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all'
  const results = filterSearchIndex(index, query, type)
  const [history, setHistory] = useState(readSearchHistory)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (query.trim().length >= 2) setHistory(saveSearchTerm(query))
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [query])

  function update(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value && value !== 'all') next.set(name, value)
    else next.delete(name)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-7 px-4 py-10 sm:px-6">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
          Découverte publique
        </span>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Rechercher sur MOXT</h1>
        <p className="mt-3 text-[var(--app-text-muted)]">
          Entreprises, annonces, colis, jobs et événements publiés.
        </p>
      </div>

      <Card className="grid gap-4 md:grid-cols-[1fr_15rem]">
        <label className="relative">
          <FiSearch className="pointer-events-none absolute left-4 top-4 text-[var(--app-text-muted)]" />
          <input
            aria-label="Rechercher"
            className="min-h-12 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] pl-11 pr-4"
            placeholder="Nom, service, ville..."
            value={query}
            onChange={(event) => update('q', event.target.value)}
          />
        </label>
        <select
          aria-label="Type de résultat"
          className="min-h-12 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3"
          value={type}
          onChange={(event) => update('type', event.target.value)}
        >
          {DISCOVERY_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Card>
      {history.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[var(--app-text-muted)]">
            Recherches récentes
          </span>
          {history.map((term) => (
            <button
              key={term}
              type="button"
              className="rounded-full bg-[var(--app-surface)] px-3 py-1.5 text-xs font-semibold shadow-sm"
              onClick={() => update('q', term)}
            >
              {term}
            </button>
          ))}
          <button
            type="button"
            className="text-xs font-bold text-red-600"
            onClick={() => {
              clearSearchHistory()
              setHistory([])
            }}
          >
            Effacer
          </button>
        </div>
      ) : null}

      <p className="text-sm font-bold text-[var(--app-text-muted)]">
        {results.length} résultat{results.length > 1 ? 's' : ''}
      </p>
      {results.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => {
            const meta = searchTypeMeta(item.type, item.typeLabel)
            return (
              <Card className="h-full">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <h2 className="mt-4 text-lg font-black">{item.title}</h2>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">{item.subtitle}</p>
                <Link
                  to="/login"
                  className="mt-5 inline-flex text-sm font-bold text-brand-700 dark:text-brand-300"
                >
                  Se connecter pour interagir
                </Link>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={FiSearch}
          title="Aucun résultat"
          description="Essayez un terme ou un domaine différent."
        />
      )}
    </div>
  )
}
