import { useEffect, useState } from 'react'
import { FALLBACK_AFRICAN_COUNTRIES, FALLBACK_RUSSIAN_CITIES } from '../config/geography'
import { getAfricanOriginCountries, getRussianCities } from '../services/geographyService'

export function useGeographyOptions() {
  const [countries, setCountries] = useState(FALLBACK_AFRICAN_COUNTRIES)
  const [cities, setCities] = useState(FALLBACK_RUSSIAN_CITIES)

  useEffect(() => {
    let active = true
    getAfricanOriginCountries().then((items) => {
      if (active) setCountries(items)
    })
    getRussianCities().then((items) => {
      if (active) setCities(items)
    })
    return () => {
      active = false
    }
  }, [])

  return { countries, cities }
}
