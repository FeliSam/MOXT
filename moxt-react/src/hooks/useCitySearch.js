import { useEffect, useMemo, useState } from 'react'
import { MAIN_RUSSIAN_CITIES, findParentCity } from '../config/russianCities'
import { getRussianCities } from '../services/geographyService'

/** Normalise une chaîne pour la recherche : minuscule + sans accents + séparateurs unifiés */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-_.\s]+/g, ' ')
    .trim()
}

/** Recherche dans la liste complète (API + principales) */
function searchCities(query, allApiCities) {
  const q = normalize(query)
  if (q.length < 2) return []

  const mainEnSet = new Set(MAIN_RUSSIAN_CITIES.map((c) => normalize(c.en)))
  const results = []

  // 1. Villes principales — cherche fr, en, ru
  for (const city of MAIN_RUSSIAN_CITIES) {
    if (
      normalize(city.fr).includes(q) ||
      normalize(city.en).includes(q) ||
      normalize(city.ru).includes(q)
    ) {
      results.push({ display: city.fr, region: city.region, isMain: true, parentFr: null })
    }
  }

  // 2. Villes annexes connues — cherche dans les nearby
  for (const main of MAIN_RUSSIAN_CITIES) {
    for (const nearby of main.nearby) {
      if (normalize(nearby).includes(q)) {
        if (!results.find((r) => r.display === nearby)) {
          results.push({
            display: nearby,
            region: `près de ${main.fr}`,
            isMain: false,
            parentFr: main.fr,
          })
        }
      }
    }
  }

  // 3. Villes API non encore dans les résultats
  for (const apiCity of allApiCities) {
    if (results.length >= 25) break
    const n = normalize(apiCity)
    if (!mainEnSet.has(n) && n.includes(q)) {
      const parent = findParentCity(apiCity)
      if (!results.find((r) => normalize(r.display) === n)) {
        results.push({
          display: apiCity,
          region: parent ? `près de ${parent.fr}` : null,
          isMain: false,
          parentFr: parent?.fr || null,
        })
      }
    }
  }

  return results.slice(0, 25)
}

/**
 * Hook de recherche intelligente de villes russes.
 * - Affiche les 28 grandes villes directement (mainCities)
 * - Affiche les villes proches de la ville sélectionnée (nearbyOf)
 * - Recherche debounce dans toute la base API
 */
export function useCitySearch(query) {
  const [allApiCities, setAllApiCities] = useState([])
  const [loading, setLoading] = useState(true)

  // Charge toutes les villes API (depuis cache ou réseau) une seule fois
  useEffect(() => {
    let active = true
    getRussianCities().then((cities) => {
      if (active) {
        setAllApiCities(cities)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const normalizedQuery = useMemo(() => query.trim(), [query])
  const results = useMemo(() => searchCities(normalizedQuery, allApiCities), [normalizedQuery, allApiCities])

  return {
    mainCities: MAIN_RUSSIAN_CITIES,
    results,
    loading: loading && normalizedQuery.length >= 2,
  }
}
