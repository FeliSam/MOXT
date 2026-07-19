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
/** VPN / réseaux filtrés : ne jamais bloquer l’UI sur ces APIs tierces. */
const GEO_FETCH_TIMEOUT_MS = 2500

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

async function fetchWithTimeout(url, options = {}, ms = GEO_FETCH_TIMEOUT_MS) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = setTimeout(() => controller?.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller?.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function refreshAfricanCountries() {
  const response = await fetchWithTimeout(COUNTRIES_URL, {
    headers: { Accept: 'application/json' },
  })
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
}

async function refreshRussianCities() {
  const response = await fetchWithTimeout(CITIES_URL, {
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
}

/** Toujours synchrone côté UX : cache / fallback immédiat, refresh réseau en fond. */
export async function getAfricanOriginCountries() {
  const local = readCache(COUNTRIES_CACHE) || FALLBACK_AFRICAN_COUNTRIES
  void refreshAfricanCountries().catch(() => {
    /* VPN / filtrage : garder le fallback local */
  })
  return local
}

export async function getRussianCities() {
  const local = readCache(CITIES_CACHE) || FALLBACK_RUSSIAN_CITIES
  void refreshRussianCities().catch(() => {
    /* VPN / filtrage : garder le fallback local */
  })
  return local
}
