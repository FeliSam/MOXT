export const RECEIVE_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'bank', label: 'Virement bancaire' },
  { value: 'other', label: 'Autre' },
]

const AMOUNT_REGEX = /^\d+([.,]\d{1,2})?$/

export function validateReceiveTransferForm(values) {
  const errors = {}
  const amount = String(values.receivedAmount || '').trim().replace(',', '.')
  if (!amount) {
    errors.receivedAmount = 'Le montant reçu est obligatoire.'
  } else if (!AMOUNT_REGEX.test(amount)) {
    errors.receivedAmount = 'Montant invalide.'
  } else if (Number(amount) <= 0) {
    errors.receivedAmount = 'Le montant doit être positif.'
  }
  if (!values.receivedMethod) {
    errors.receivedMethod = 'Choisissez une méthode de réception.'
  } else if (!RECEIVE_METHODS.some((m) => m.value === values.receivedMethod)) {
    errors.receivedMethod = 'Méthode invalide.'
  }
  return errors
}

export function normalizeReceivedAmount(value) {
  return String(value || '')
    .trim()
    .replace(',', '.')
}
