import {
  AFRICAN_ORIGIN_CODES,
  FALLBACK_AFRICAN_COUNTRIES,
  FALLBACK_RUSSIAN_CITIES,
} from '../config/geography'

const COUNTRIES_URL =
  'https://restcountries.com/v3.1/region/africa?fields=cca2,name,translations,idd,languages'
const CITIES_URL = 'https://countriesnow.space/api/v0.1/countries/cities'
const COUNTRIES_CACHE = 'moxt-african-countries-v1'
const CITIES_CACHE = 'moxt-russian-cities-v1'

function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function writeCache(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

function callingCode(country) {
  const root = country.idd?.root || ''
  const suffix = country.idd?.suffixes?.[0] || ''
  return `${root}${suffix}` || ''
}

export async function getAfricanOriginCountries() {
  try {
    const response = await fetch(COUNTRIES_URL, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('Countries unavailable')
    const data = await response.json()
    const countries = data
      .filter((country) => AFRICAN_ORIGIN_CODES.includes(country.cca2))
      .map((country) => ({
        code: country.cca2,
        name: country.translations?.fra?.common || country.name.common,
        englishName: country.name.common,
        callingCode: callingCode(country),
        languages: Object.values(country.languages || {}),
      }))
      .sort((left, right) => left.name.localeCompare(right.name, 'fr'))
    return writeCache(COUNTRIES_CACHE, countries)
  } catch {
    return readCache(COUNTRIES_CACHE) || FALLBACK_AFRICAN_COUNTRIES
  }
}

export async function getRussianCities() {
  try {
    const response = await fetch(CITIES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ country: 'Russia' }),
    })
    if (!response.ok) throw new Error('Cities unavailable')
    const payload = await response.json()
    const cities = [...new Set(payload.data || [])].sort((left, right) =>
      left.localeCompare(right, 'ru'),
    )
    if (!cities.length) throw new Error('Empty cities')
    return writeCache(CITIES_CACHE, cities)
  } catch {
    return readCache(CITIES_CACHE) || FALLBACK_RUSSIAN_CITIES
  }
}
