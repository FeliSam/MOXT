import { FiSearch } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { DISCOVERY_TYPES } from '../config/publicContent'
import { searchTypeMeta } from '../config/searchTypes'
import { useLanguage } from '../contexts/useLanguage'
import { filterSearchIndex, selectSearchIndex } from '../features/searchSelectors'
import { phase3Text } from '../i18n/phase3I18n'
import { clearSearchHistory, readSearchHistory, saveSearchTerm } from '../services/searchHistory'

export function DiscoverPage() {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
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
          {p3('discover.eyebrow')}
        </span>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{p3('discover.title')}</h1>
        <p className="mt-3 text-[var(--app-text-muted)]">
          {p3('discover.description')}
        </p>
      </div>

      <Card className="grid gap-3 border-brand-200 bg-brand-50/50 dark:border-brand-900 dark:bg-brand-950/20">
        <h2 className="font-black">{p3('discover.securityTitle')}</h2>
        <ul className="grid gap-2 text-sm text-[var(--app-text-muted)] sm:grid-cols-3">
          <li>{p3('discover.security.phone')}</li>
          <li>{p3('discover.security.identity')}</li>
          <li>{p3('discover.security.messaging')}</li>
        </ul>
      </Card>

      <Card className="grid gap-4 md:grid-cols-[1fr_15rem]">
        <label className="relative">
          <FiSearch className="pointer-events-none absolute left-4 top-4 text-[var(--app-text-muted)]" />
          <input
            aria-label={p3('discover.searchAria')}
            className="min-h-12 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] pl-11 pr-4"
            placeholder={p3('discover.placeholder')}
            value={query}
            onChange={(event) => update('q', event.target.value)}
          />
        </label>
        <select
          aria-label={p3('discover.typeAria')}
          className="min-h-12 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3"
          value={type}
          onChange={(event) => update('type', event.target.value)}
        >
          {DISCOVERY_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {p3(`discover.types.${option.value}`)}
            </option>
          ))}
        </select>
      </Card>
      {history.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[var(--app-text-muted)]">
            {p3('discover.recent')}
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
            {p3('discover.clear')}
          </button>
        </div>
      ) : null}

      <p className="text-sm font-bold text-[var(--app-text-muted)]">
        {results.length > 1
          ? p3('discover.resultsPlural', { count: results.length })
          : p3('discover.results', { count: results.length })}
      </p>
      {results.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => {
            const meta = searchTypeMeta(item.type, item.typeLabel)
            return (
              <Card key={item.id || `${item.type}-${item.title}`} className="h-full">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <h2 className="mt-4 text-lg font-black">{item.title}</h2>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">{item.subtitle}</p>
                <Link
                  to="/login"
                  className="mt-5 inline-flex text-sm font-bold text-brand-700 dark:text-brand-300"
                >
                  {p3('discover.loginCta')}
                </Link>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={FiSearch}
          title={p3('discover.empty.title')}
          description={p3('discover.empty.description')}
        />
      )}
    </div>
  )
}
