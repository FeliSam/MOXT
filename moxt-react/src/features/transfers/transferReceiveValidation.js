export const RECEIVE_METHODS = [
  { value: 'cash', labelKey: 'transfers.receive.methods.cash' },
  { value: 'mobile_money', labelKey: 'transfers.receive.methods.mobileMoney' },
  { value: 'bank', labelKey: 'transfers.receive.methods.bank' },
  { value: 'other', labelKey: 'transfers.receive.methods.other' },
]

const AMOUNT_REGEX = /^\d+([.,]\d{1,2})?$/

function resolveMsg(t, key, fallback) {
  if (typeof t === 'function') {
    const translated = t(key)
    if (translated != null && translated !== key) return translated
  }
  return fallback
}

export function validateReceiveTransferForm(values, t) {
  const errors = {}
  const amount = String(values.receivedAmount || '').trim().replace(',', '.')
  if (!amount) {
    errors.receivedAmount = resolveMsg(
      t,
      'validation.transfer.receivedAmountRequired',
      'Le montant reçu est obligatoire.',
    )
  } else if (!AMOUNT_REGEX.test(amount)) {
    errors.receivedAmount = resolveMsg(
      t,
      'validation.transfer.amountInvalid',
      'Montant invalide.',
    )
  } else if (Number(amount) <= 0) {
    errors.receivedAmount = resolveMsg(
      t,
      'validation.transfer.amountPositive',
      'Le montant doit être positif.',
    )
  }
  if (!values.receivedMethod) {
    errors.receivedMethod = resolveMsg(
      t,
      'validation.transfer.receiveMethodChoose',
      'Choisissez une méthode de réception.',
    )
  } else if (!RECEIVE_METHODS.some((m) => m.value === values.receivedMethod)) {
    errors.receivedMethod = resolveMsg(
      t,
      'validation.transfer.receiveMethodInvalid',
      'Méthode invalide.',
    )
  }
  return errors
}

export function normalizeReceivedAmount(value) {
  return String(value || '')
    .trim()
    .replace(',', '.')
}
