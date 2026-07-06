import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiMapPin, FiSearch, FiX } from 'react-icons/fi'
import { useCitySearch } from '../../hooks/useCitySearch'
import { MAIN_RUSSIAN_CITIES } from '../../config/russianCities'

/**
 * Sélecteur intelligent de ville russe.
 *
 * Props :
 *   value       — string (nom de la ville sélectionnée)
 *   onChange    — (cityName: string) => void
 *   label       — label affiché au-dessus du champ
 *   id          — id html (pour le label)
 *   error       — message d'erreur
 *   hint        — texte d'aide sous le champ
 *   placeholder — placeholder du bouton déclencheur
 *   disabled    — désactive le composant
 */
export function CitySelector({
  value = '',
  onChange,
  label,
  id,
  error,
  hint,
  placeholder = 'Choisir une ville...',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const searchRef = useRef(null)

  const { mainCities, results, loading } = useCitySearch(query)

  // Ville principale sélectionnée → pour afficher les villes proches
  const selectedMain = MAIN_RUSSIAN_CITIES.find(
    (c) => c.fr === value || c.en === value || c.ru === value,
  )

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!open) return
    function handler(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  // Fermeture à Escape
  useEffect(() => {
    if (!open) return
    function handler(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  function openDropdown() {
    if (disabled) return
    setOpen(true)
    setTimeout(() => searchRef.current?.focus(), 40)
  }

  function select(cityName) {
    onChange(cityName)
    setOpen(false)
    setQuery('')
  }

  const showSearch = query.length >= 2
  const showEmpty = showSearch && !loading && results.length === 0

  return (
    <div ref={rootRef} className="relative">
      {/* Label */}
      {label ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-bold text-[var(--app-text)]"
        >
          {label}
        </label>
      ) : null}

      {/* Trigger */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={openDropdown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
          error
            ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20'
            : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[var(--app-accent)]'}`}
      >
        <FiMapPin className="shrink-0 text-[var(--app-text-muted)]" />
        <span className={`flex-1 truncate ${value ? 'text-[var(--app-text)]' : 'text-[var(--app-text-muted)]'}`}>
          {value || placeholder}
        </span>
        <FiChevronDown
          className={`shrink-0 text-[var(--app-text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl">
          {/* Search bar */}
          <div className="border-b border-[var(--app-border)] p-3">
            <div className="flex items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2.5">
              <FiSearch className="shrink-0 text-[var(--app-text-muted)]" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Moscou, Kazan, Khimki, Москва..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--app-text-muted)]"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
                  aria-label="Effacer"
                >
                  <FiX />
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-3">
            {/* État chargement */}
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-[var(--app-text-muted)]">
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-brand-600" />
                Recherche en cours…
              </div>
            ) : showEmpty ? (
              <p className="py-4 text-center text-sm text-[var(--app-text-muted)]">
                Aucune ville trouvée pour «&nbsp;{query}&nbsp;»
              </p>
            ) : showSearch ? (
              /* Résultats de recherche */
              <div role="listbox" aria-label="Résultats">
                {results.map((result) => (
                  <button
                    key={result.display}
                    type="button"
                    role="option"
                    aria-selected={value === result.display}
                    onClick={() => select(result.display)}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--app-surface-muted)] ${
                      value === result.display ? 'bg-[var(--app-accent-soft)]' : ''
                    }`}
                  >
                    <FiMapPin
                      className={`mt-0.5 shrink-0 ${result.isMain ? 'text-brand-600' : 'text-[var(--app-text-muted)]'}`}
                    />
                    <div>
                      <p className="text-sm font-bold">{result.display}</p>
                      {result.region ? (
                        <p className="text-xs text-[var(--app-text-muted)]">{result.region}</p>
                      ) : null}
                    </div>
                    {result.isMain ? (
                      <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        Principale
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              /* Vue par défaut : grandes villes + villes proches */
              <>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
                  Grandes villes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {mainCities.map((city) => {
                    const active = value === city.fr || value === city.en
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => select(city.fr)}
                        title={`${city.ru} · ${city.region}`}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          active
                            ? 'bg-brand-700 text-white shadow-sm'
                            : 'bg-[var(--app-surface-muted)] text-[var(--app-text)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]'
                        }`}
                      >
                        {city.fr}
                      </button>
                    )
                  })}
                </div>

                {/* Villes proches de la ville sélectionnée */}
                {selectedMain?.nearby?.length ? (
                  <>
                    <p className="mb-2 mt-5 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
                      Près de {selectedMain.fr}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMain.nearby.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => select(city)}
                          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                            value === city
                              ? 'bg-brand-600 text-white'
                              : 'bg-[var(--app-surface-muted)] text-[var(--app-text)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                <p className="mt-4 text-center text-xs text-[var(--app-text-muted)]">
                  Tapez au moins 2 caractères pour rechercher une autre ville
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Hint + error */}
      {hint && !error ? <p className="mt-1 text-xs text-[var(--app-text-muted)]">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
