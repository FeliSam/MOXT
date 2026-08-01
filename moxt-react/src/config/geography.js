import { MAIN_RUSSIAN_CITIES } from './russianCities'
import RUSSIAN_CITIES_ALL from './russianCitiesAll.json'

export const RUSSIA = {
  code: 'RU',
  name: 'Russie',
  englishName: 'Russia',
  callingCode: '+7',
}

export const AFRICAN_ORIGIN_CODES = [
  'BJ',
  'BF',
  'BI',
  'CM',
  'CF',
  'TD',
  'KM',
  'CD',
  'CG',
  'CI',
  'DJ',
  'GQ',
  'GA',
  'GH',
  'GM',
  'GN',
  'GW',
  'KE',
  'LR',
  'MG',
  'MW',
  'ML',
  'MU',
  'NE',
  'NG',
  'RW',
  'SC',
  'SL',
  'SN',
  'SO',
  'SS',
  'SZ',
  'TG',
  'TZ',
  'UG',
  'ZM',
  'ZW',
]

export const FALLBACK_AFRICAN_COUNTRIES = [
  ['BJ', 'Bénin', 'Benin', '+229'],
  ['BF', 'Burkina Faso', 'Burkina Faso', '+226'],
  ['BI', 'Burundi', 'Burundi', '+257'],
  ['CM', 'Cameroun', 'Cameroon', '+237'],
  ['CF', 'République centrafricaine', 'Central African Republic', '+236'],
  ['TD', 'Tchad', 'Chad', '+235'],
  ['KM', 'Comores', 'Comoros', '+269'],
  ['CD', 'R.D. Congo', 'DR Congo', '+243'],
  ['CG', 'Congo', 'Congo', '+242'],
  ['CI', "Côte d'Ivoire", 'Ivory Coast', '+225'],
  ['DJ', 'Djibouti', 'Djibouti', '+253'],
  ['GQ', 'Guinée équatoriale', 'Equatorial Guinea', '+240'],
  ['GA', 'Gabon', 'Gabon', '+241'],
  ['GH', 'Ghana', 'Ghana', '+233'],
  ['GM', 'Gambie', 'Gambia', '+220'],
  ['GN', 'Guinée', 'Guinea', '+224'],
  ['GW', 'Guinée-Bissau', 'Guinea-Bissau', '+245'],
  ['KE', 'Kenya', 'Kenya', '+254'],
  ['LR', 'Liberia', 'Liberia', '+231'],
  ['MG', 'Madagascar', 'Madagascar', '+261'],
  ['MW', 'Malawi', 'Malawi', '+265'],
  ['ML', 'Mali', 'Mali', '+223'],
  ['MU', 'Maurice', 'Mauritius', '+230'],
  ['NE', 'Niger', 'Niger', '+227'],
  ['NG', 'Nigeria', 'Nigeria', '+234'],
  ['RW', 'Rwanda', 'Rwanda', '+250'],
  ['SC', 'Seychelles', 'Seychelles', '+248'],
  ['SL', 'Sierra Leone', 'Sierra Leone', '+232'],
  ['SN', 'Sénégal', 'Senegal', '+221'],
  ['SO', 'Somalie', 'Somalia', '+252'],
  ['SS', 'Soudan du Sud', 'South Sudan', '+211'],
  ['SZ', 'Eswatini', 'Eswatini', '+268'],
  ['TG', 'Togo', 'Togo', '+228'],
  ['TZ', 'Tanzanie', 'Tanzania', '+255'],
  ['UG', 'Ouganda', 'Uganda', '+256'],
  ['ZM', 'Zambie', 'Zambia', '+260'],
  ['ZW', 'Zimbabwe', 'Zimbabwe', '+263'],
].map(([code, name, englishName, callingCode]) => ({
  code,
  name,
  englishName,
  callingCode,
}))

/**
 * Liste complète des villes russes embarquée (hors ligne).
 * Snapshot countriesnow.space (~5k) + libellés FR/EN/RU des villes principales.
 */
function buildOfflineRussianCities() {
  const set = new Set(Array.isArray(RUSSIAN_CITIES_ALL) ? RUSSIAN_CITIES_ALL : [])
  for (const city of MAIN_RUSSIAN_CITIES) {
    if (city.en) set.add(city.en)
    if (city.fr) set.add(city.fr)
    if (city.ru) set.add(city.ru)
    for (const nearby of city.nearby || []) {
      if (nearby) set.add(nearby)
    }
  }
  return [...set].sort((left, right) => left.localeCompare(right, 'en'))
}

export const FALLBACK_RUSSIAN_CITIES = buildOfflineRussianCities()
