/** @typedef {'PERSON' | 'COMPANY'} OwnerType */
/** @typedef {'PASSEPORT' | 'CNI' | 'PERMIS' | 'AUTRE'} IdentityType */

/** @type {readonly OwnerType[]} */
export const OWNER_TYPES = ['PERSON', 'COMPANY']

/** @type {readonly IdentityType[]} */
export const IDENTITY_TYPES = ['PASSEPORT', 'CNI', 'PERMIS', 'AUTRE']

/** @type {Record<IdentityType, string>} */
export const IDENTITY_TYPE_LABELS = {
  PASSEPORT: 'Passeport',
  CNI: "Carte nationale d'identité",
  PERMIS: 'Permis de conduire',
  AUTRE: 'Autre pièce',
}

/** @type {Record<OwnerType, string>} */
export const OWNER_TYPE_LABELS = {
  PERSON: 'Personne physique',
  COMPANY: 'Personne morale',
}
