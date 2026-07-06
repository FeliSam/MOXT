import { FiNavigation } from 'react-icons/fi'
import { airportsForCountry } from '../../config/airports'
import { Select } from './Select'

/**
 * Sélecteur de ville/aéroport pour un pays donné.
 * Restreint le choix aux villes disposant d'un aéroport (transport aérien).
 *
 * Props :
 *   countryCode — code ISO du pays (ex: 'BJ', 'RU')
 *   value       — code IATA sélectionné
 *   onChange    — (airport: {code, name, city}) => void
 */
export function AirportSelector({ countryCode, value, onChange, label, id, error }) {
  const airports = airportsForCountry(countryCode)

  if (airports.length === 0) {
    return (
      <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
        Aucun aéroport référencé pour ce pays pour le moment.
      </p>
    )
  }

  if (airports.length === 1) {
    const airport = airports[0]
    if (value !== airport.code) onChange(airport)
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm">
        <FiNavigation className="shrink-0 text-[var(--app-text-muted)]" />
        <span className="font-bold">{airport.city}</span>
        <span className="text-[var(--app-text-muted)]">
          · {airport.name} ({airport.code})
        </span>
      </div>
    )
  }

  return (
    <Select
      id={id}
      label={label}
      value={value || ''}
      error={error}
      onChange={(event) => {
        const airport = airports.find((a) => a.code === event.target.value)
        if (airport) onChange(airport)
      }}
    >
      <option value="" disabled>
        Choisir une ville (aéroport)
      </option>
      {airports.map((airport) => (
        <option key={airport.code} value={airport.code}>
          {airport.city} · {airport.name} ({airport.code})
        </option>
      ))}
    </Select>
  )
}
