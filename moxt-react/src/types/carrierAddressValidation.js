import { validateIdentityFields } from './contactsValidation'

/**
 * Builds a message resolver. When a translation function `t` is provided, it
 * resolves `t(key)` (using the French source as the i18n default value). When
 * no `t` is provided, or when the key resolves to nothing / echoes back the
 * key, it falls back to the exact original French message.
 */
const createMessageResolver = (t) => (key, fallback) => {
  if (typeof t !== 'function') return fallback
  const translated = t(key, { defaultValue: fallback })
  if (translated == null || translated === key) return fallback
  return translated
}

function buildAddressErrors(data, m) {
  const errors = {}
  if (!data.label?.trim()) {
    errors.label = m('validation.address.labelRequired', 'Le libellé est obligatoire.')
  }
  if (!data.country?.trim()) {
    errors.country = m('validation.address.countryRequired', 'Le pays est obligatoire.')
  }
  if (!data.city?.trim()) {
    errors.city = m('validation.address.cityRequired', 'La ville est obligatoire.')
  }
  if (!data.addressLine?.trim()) {
    errors.addressLine = m('validation.address.addressRequired', "L'adresse est obligatoire.")
  }
  if (!data.phone?.trim()) {
    errors.phone = m('validation.address.phoneRequired', 'Le téléphone est obligatoire.')
  }
  if (!data.email?.trim()) {
    errors.email = m('validation.address.emailRequired', "L'e-mail est obligatoire.")
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = m('validation.address.emailInvalid', 'E-mail invalide.')
  }
  return errors
}

export function createCarrierAddressValidators(t) {
  const m = createMessageResolver(t)

  function validateCarrierAddressForm(data) {
    const errors = buildAddressErrors(data, m)
    Object.assign(errors, validateIdentityFields(data.identity, 'person', t))
    return errors
  }

  function validateRecipientAddressForm(data) {
    const errors = buildAddressErrors(data, m)
    const variant = data.ownerType === 'COMPANY' ? 'company' : 'person'
    Object.assign(errors, validateIdentityFields(data.identity, variant, t))
    return errors
  }

  return { validateCarrierAddressForm, validateRecipientAddressForm }
}

const defaultValidators = createCarrierAddressValidators()

export const validateCarrierAddressForm = defaultValidators.validateCarrierAddressForm
export const validateRecipientAddressForm = defaultValidators.validateRecipientAddressForm
