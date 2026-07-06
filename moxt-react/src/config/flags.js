// Emoji de drapeau genere a partir du code ISO-3166-1 alpha-2 (algorithme
// "regional indicator symbol" standard Unicode). Fonctionne pour tout pays
// sans maintenance manuelle.
export function flagEmoji(countryCode = '') {
  const code = countryCode.trim().toUpperCase()
  if (code.length !== 2) return '🏳️'
  const base = 0x1f1e6
  const chars = [...code].map((char) => base + (char.charCodeAt(0) - 65))
  if (chars.some((point) => point < base || point > base + 25)) return '🏳️'
  return String.fromCodePoint(...chars)
}

// Couleur dominante du drapeau officiel (utilisee pour les accents visuels :
// bordures, icones, fonds degrades). Couverture des pays MOXT (Afrique +
// Russie) ; repli neutre pour les codes non references.
const FLAG_COLORS = {
  RU: '#0039A6', // bleu drapeau russe
  BJ: '#FCD116', // jaune Benin
  BF: '#EF2B2D', // rouge Burkina Faso
  BI: '#1EB53A', // vert Burundi
  CM: '#007A5E', // vert Cameroun
  CF: '#003082', // bleu Centrafrique
  TD: '#002664', // bleu Tchad
  KM: '#3A75C4', // bleu Comores
  CD: '#007FFF', // bleu RDC
  CG: '#009543', // vert Congo
  CI: '#F77F00', // orange Cote d'Ivoire
  DJ: '#6AB2E7', // bleu Djibouti
  GQ: '#3E9A00', // vert Guinee equatoriale
  GA: '#009E60', // vert Gabon
  GH: '#CE1126', // rouge Ghana
  GM: '#3A7728', // vert Gambie
  GN: '#CE1126', // rouge Guinee
  GW: '#CE1126', // rouge Guinee-Bissau
  KE: '#006600', // vert Kenya
  LR: '#002868', // bleu Liberia
  MG: '#FC3D32', // rouge Madagascar
  MW: '#000000', // noir Malawi
  ML: '#14B53A', // vert Mali
  MU: '#EA2839', // rouge Maurice
  NE: '#E05206', // orange Niger
  NG: '#008751', // vert Nigeria
  RW: '#00A1DE', // bleu Rwanda
  SC: '#003F87', // bleu Seychelles
  SL: '#1EB53A', // vert Sierra Leone
  SN: '#00853F', // vert Senegal
  SO: '#4189DD', // bleu Somalie
  SS: '#078930', // vert Soudan du Sud
  SZ: '#3A7728', // vert Eswatini
  TG: '#006A4E', // vert Togo
  TZ: '#1EB53A', // vert Tanzanie
  UG: '#000000', // noir Ouganda
  ZM: '#198A00', // vert Zambie
  ZW: '#006400', // vert Zimbabwe
}

export function flagColor(countryCode = '') {
  return FLAG_COLORS[countryCode.trim().toUpperCase()] || '#08705f'
}
