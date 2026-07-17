export const BUSINESS_DOCUMENT_TYPES = [
  {
    value: 'registration',
    label: 'Enregistrement / statuts (ОГРН, ИНН)',
    labelKey: 'businesses.documents.registration',
  },
  {
    value: 'license',
    label: 'Licence ou autorisation d’activité',
    labelKey: 'businesses.documents.license',
  },
  {
    value: 'tax',
    label: 'Attestation fiscale',
    labelKey: 'businesses.documents.tax',
  },
  {
    value: 'address',
    label: 'Justificatif d’adresse professionnelle',
    labelKey: 'businesses.documents.address',
  },
  {
    value: 'bank',
    label: 'Coordonnées bancaires (RIB)',
    labelKey: 'businesses.documents.bank',
  },
  {
    value: 'identity',
    label: 'Pièce d’identité du dirigeant',
    labelKey: 'businesses.documents.identity',
  },
  {
    value: 'other',
    label: 'Autre justificatif',
    labelKey: 'businesses.documents.other',
  },
]

export function businessDocumentTypeLabel(value, t) {
  const item = BUSINESS_DOCUMENT_TYPES.find((entry) => entry.value === value)
  if (!item) return value || (typeof t === 'function' ? t('businesses.documents.fallback') : 'Document')
  if (typeof t === 'function' && item.labelKey) {
    const translated = t(item.labelKey)
    if (translated && translated !== item.labelKey) return translated
  }
  return item.label
}

export function isBusinessDocumentType(value) {
  return BUSINESS_DOCUMENT_TYPES.some((item) => item.value === value)
}
