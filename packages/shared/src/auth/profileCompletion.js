import { normalizeRussianAuthPhone } from '../utils/phone.js'

function isValidRussianPhone(value = '') {
  const phone = normalizeRussianAuthPhone(value)
  return /^\+7\d{10}$/.test(phone)
}

/** Profil MOXT complet : identité, e-mail, pays d'origine, ville RU et numéro russe. */
export function isProfileComplete(user) {
  if (!user?.id) return false

  const firstName = String(user.firstName || '').trim()
  const lastName = String(user.lastName || '').trim()
  const email = String(user.email || '').trim()
  const city = String(user.city || '').trim()
  const originCountry = String(user.originCountry || '').trim()
  const phone = String(user.phone || '').trim()

  return (
    firstName.length >= 2 &&
    lastName.length >= 2 &&
    email.includes('@') &&
    city.length >= 2 &&
    originCountry.length >= 2 &&
    isValidRussianPhone(phone)
  )
}

/** Complétion « OAuth » : utilisateur connecté sans inscription téléphone classique. */
export function needsOAuthProfileCompletion(user) {
  if (!user?.id || isProfileComplete(user)) return false
  return !isValidRussianPhone(user.phone)
}
