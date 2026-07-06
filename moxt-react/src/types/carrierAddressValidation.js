import { validateIdentityFields } from './contactsValidation'

export function validateCarrierAddressForm(data) {
  const errors = {}
  if (!data.label?.trim()) errors.label = 'Le libellé est obligatoire.'
  if (!data.country?.trim()) errors.country = 'Le pays est obligatoire.'
  if (!data.city?.trim()) errors.city = 'La ville est obligatoire.'
  if (!data.addressLine?.trim()) errors.addressLine = "L'adresse est obligatoire."
  if (!data.phone?.trim()) errors.phone = 'Le téléphone est obligatoire.'
  if (!data.email?.trim()) {
    errors.email = "L'e-mail est obligatoire."
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'E-mail invalide.'
  }
  Object.assign(errors, validateIdentityFields(data.identity, 'person'))
  return errors
}

export function validateRecipientAddressForm(data) {
  const errors = {}
  if (!data.label?.trim()) errors.label = 'Le libellé est obligatoire.'
  if (!data.country?.trim()) errors.country = 'Le pays est obligatoire.'
  if (!data.city?.trim()) errors.city = 'La ville est obligatoire.'
  if (!data.addressLine?.trim()) errors.addressLine = "L'adresse est obligatoire."
  if (!data.phone?.trim()) errors.phone = 'Le téléphone est obligatoire.'
  if (!data.email?.trim()) {
    errors.email = "L'e-mail est obligatoire."
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'E-mail invalide.'
  }
  const variant = data.ownerType === 'COMPANY' ? 'company' : 'person'
  Object.assign(errors, validateIdentityFields(data.identity, variant))
  return errors
}
