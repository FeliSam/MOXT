export const BUSINESS_DOCUMENT_TYPES = [
  {
    value: 'registration',
    label: 'Enregistrement / statuts (ОГРН, ИНН)',
  },
  {
    value: 'license',
    label: 'Licence ou autorisation d’activité',
  },
  {
    value: 'tax',
    label: 'Attestation fiscale',
  },
  {
    value: 'address',
    label: 'Justificatif d’adresse professionnelle',
  },
  {
    value: 'bank',
    label: 'Coordonnées bancaires (RIB)',
  },
  {
    value: 'identity',
    label: 'Pièce d’identité du dirigeant',
  },
  {
    value: 'other',
    label: 'Autre justificatif',
  },
]

export function businessDocumentTypeLabel(value) {
  return BUSINESS_DOCUMENT_TYPES.find((item) => item.value === value)?.label || value || 'Document'
}

export function isBusinessDocumentType(value) {
  return BUSINESS_DOCUMENT_TYPES.some((item) => item.value === value)
}
