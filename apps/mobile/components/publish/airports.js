// Aéroports principaux par pays — utilisés pour restreindre les villes
// proposées lors de la publication d'un voyage (un transport aérien doit
// partir/arriver d'un aéroport réel).
export const COUNTRY_AIRPORTS = {
  RU: [
    { code: 'SVO', name: 'Cheremetievo', city: 'Moscou' },
    { code: 'DME', name: 'Domodedovo', city: 'Moscou' },
    { code: 'VKO', name: 'Vnoukovo', city: 'Moscou' },
    { code: 'LED', name: 'Poulkovo', city: 'Saint-Pétersbourg' },
    { code: 'KZN', name: 'Aéroport de Kazan', city: 'Kazan' },
    { code: 'OVB', name: 'Tolmatchevo', city: 'Novossibirsk' },
    { code: 'SVX', name: 'Koltsovo', city: 'Iekaterinbourg' },
    { code: 'AER', name: 'Aéroport de Sotchi', city: 'Sotchi' },
    { code: 'KRR', name: 'Aéroport de Krasnodar', city: 'Krasnodar' },
    { code: 'ROV', name: 'Platov', city: 'Rostov-sur-le-Don' },
  ],
  BJ: [{ code: 'COO', name: 'Cardinal Bernardin Gantin', city: 'Cotonou' }],
  BF: [{ code: 'OUA', name: 'Aéroport international de Ouagadougou', city: 'Ouagadougou' }],
  BI: [{ code: 'BJM', name: 'Aéroport international de Bujumbura', city: 'Bujumbura' }],
  CM: [
    { code: 'DLA', name: 'Aéroport international de Douala', city: 'Douala' },
    { code: 'NSI', name: 'Yaoundé-Nsimalen', city: 'Yaoundé' },
  ],
  CF: [{ code: 'BGF', name: "Bangui M'Poko", city: 'Bangui' }],
  TD: [{ code: 'NDJ', name: "Aéroport de N'Djamena", city: "N'Djamena" }],
  KM: [{ code: 'HAH', name: 'Prince-Saïd-Ibrahim', city: 'Moroni' }],
  CD: [
    { code: 'FIH', name: "Aéroport de N'djili", city: 'Kinshasa' },
    { code: 'FBM', name: 'Aéroport de Lubumbashi', city: 'Lubumbashi' },
    { code: 'GOM', name: 'Aéroport de Goma', city: 'Goma' },
  ],
  CG: [{ code: 'BZV', name: 'Maya-Maya', city: 'Brazzaville' }],
  CI: [{ code: 'ABJ', name: 'Félix-Houphouët-Boigny', city: 'Abidjan' }],
  DJ: [{ code: 'JIB', name: 'Djibouti-Ambouli', city: 'Djibouti' }],
  GQ: [{ code: 'SSG', name: 'Aéroport de Malabo', city: 'Malabo' }],
  GA: [{ code: 'LBV', name: 'Léon-Mba', city: 'Libreville' }],
  GH: [{ code: 'ACC', name: 'Kotoka', city: 'Accra' }],
  GM: [{ code: 'BJL', name: 'Aéroport international de Banjul', city: 'Banjul' }],
  GN: [{ code: 'CKY', name: 'Ahmed-Sékou-Touré', city: 'Conakry' }],
  GW: [{ code: 'OXB', name: 'Osvaldo-Vieira', city: 'Bissau' }],
  KE: [{ code: 'NBO', name: 'Jomo-Kenyatta', city: 'Nairobi' }],
  LR: [{ code: 'ROB', name: 'Aéroport Roberts', city: 'Monrovia' }],
  MG: [{ code: 'TNR', name: "Aéroport d'Ivato", city: 'Antananarivo' }],
  MW: [{ code: 'LLW', name: 'Aéroport international de Lilongwe', city: 'Lilongwe' }],
  ML: [{ code: 'BKO', name: 'Modibo-Keïta', city: 'Bamako' }],
  MU: [{ code: 'MRU', name: 'Sir-Seewoosagur-Ramgoolam', city: 'Port-Louis' }],
  NE: [{ code: 'NIM', name: 'Diori-Hamani', city: 'Niamey' }],
  NG: [
    { code: 'LOS', name: 'Murtala Mohammed', city: 'Lagos' },
    { code: 'ABV', name: 'Nnamdi Azikiwe', city: 'Abuja' },
    { code: 'KAN', name: 'Mallam Aminu Kano', city: 'Kano' },
    { code: 'PHC', name: 'Aéroport de Port Harcourt', city: 'Port Harcourt' },
  ],
  RW: [{ code: 'KGL', name: 'Aéroport international de Kigali', city: 'Kigali' }],
  SC: [{ code: 'SEZ', name: 'Aéroport international des Seychelles', city: 'Mahé' }],
  SL: [{ code: 'FNA', name: 'Freetown-Lungi', city: 'Freetown' }],
  SN: [{ code: 'DSS', name: 'Blaise-Diagne', city: 'Dakar' }],
  SO: [{ code: 'MGQ', name: 'Aden-Adde', city: 'Mogadiscio' }],
  SS: [{ code: 'JUB', name: 'Aéroport international de Djouba', city: 'Djouba' }],
  SZ: [{ code: 'SHO', name: 'King-Mswati-III', city: 'Manzini' }],
  TG: [{ code: 'LFW', name: 'Gnassingbé-Eyadéma', city: 'Lomé' }],
  TZ: [
    { code: 'DAR', name: 'Julius-Nyerere', city: 'Dar es Salaam' },
    { code: 'JRO', name: 'Aéroport du Kilimandjaro', city: 'Arusha' },
  ],
  UG: [{ code: 'EBB', name: "Aéroport d'Entebbe", city: 'Entebbe' }],
  ZM: [{ code: 'LUN', name: 'Kenneth-Kaunda', city: 'Lusaka' }],
  ZW: [
    { code: 'HRE', name: 'Robert-Gabriel-Mugabe', city: 'Harare' },
    { code: 'VFA', name: 'Aéroport de Victoria Falls', city: 'Victoria Falls' },
  ],
}

export function airportsForCountry(countryCode) {
  return COUNTRY_AIRPORTS[countryCode] || []
}

export function findAirport(countryCode, airportCode) {
  return airportsForCountry(countryCode).find((a) => a.code === airportCode) || null
}
