import { isProfileComplete } from './profileCompletion.js'
import { normalizeRussianAuthPhone } from '../utils/phone.js'

const PENDING_STALE_MS = 24 * 60 * 60 * 1000

export function isValidRussianPhone(value = '') {
  const phone = normalizeRussianAuthPhone(value)
  return /^\+7\d{10}$/.test(phone)
}

/** Niveau 1 — numéro russe confirmé par OTP + e-mail confirmé (obligatoire pour publier). */
export function isPhoneVerified(user) {
  if (!user) return false
  if (user.phoneVerified === true) return true
  return Boolean(user.phoneVerifiedAt)
}

/** Niveau 2/3 — identité validée par MOXT (profiles.status = verified). */
export function isIdentityVerified(user) {
  return Boolean(user?.verified) || user?.status === 'verified'
}

export function isPersonallyRegistered(user) {
  return isProfileComplete(user)
}

/** Messagerie, favoris, contact : flux normal sans vérification renforcée. */
export function canInteractNormally(user) {
  return Boolean(user?.id)
}

export function canPublishContent(user) {
  if (!user?.id) return false
  return (
    isPhoneVerified(user) &&
    isValidRussianPhone(user.phone) &&
    isEmailVerified(user)
  )
}

/**
 * Compte identité vérifié → publication immédiate.
 * Sinon → pending_review (modération admin).
 */
export function initialCatalogStatus(user, { live = 'active', pending = 'pending_review' } = {}) {
  return isIdentityVerified(user) ? live : pending
}

/** E-mail confirmé (Supabase Auth). */
export function isEmailVerified(user) {
  if (!user) return false
  if (user.emailVerified === true) return true
  return Boolean(user.emailVerifiedAt)
}

export function hasAccountEmail(user) {
  return String(user?.email || '').trim().includes('@')
}

export function canCreateBusiness(user) {
  if (!user?.id) return false
  return isIdentityVerified(user) && isPersonallyRegistered(user) && isEmailVerified(user)
}

export function canSubmitIdentityVerification(user) {
  if (!user?.id) return false
  return isPhoneVerified(user) && isEmailVerified(user) && hasAccountEmail(user)
}

/** Transfert : profil complet + numéro russe vérifié. */
export function canUseTransferAccount(user) {
  if (!user?.id) return false
  return isPersonallyRegistered(user) && isPhoneVerified(user) && isValidRussianPhone(user.phone)
}

/** Offre P2P : identité vérifiée obligatoire (+ téléphone + e-mail confirmé). */
export function canPublishP2POffer(user) {
  if (!user?.id) return false
  return (
    isIdentityVerified(user) &&
    isPhoneVerified(user) &&
    isValidRussianPhone(user.phone) &&
    isEmailVerified(user)
  )
}

/** Voyage / colis : mêmes garde-fous que le P2P (téléphone + e-mail + KYC identité). */
export function canPublishVoyage(user) {
  return canPublishP2POffer(user)
}

export function verificationRequestIsStale(request, now = Date.now()) {
  if (!request || request.status !== 'pending_review') return false
  const created = Date.parse(request.createdAt || '')
  if (!Number.isFinite(created)) return false
  return now - created > PENDING_STALE_MS
}

export function securityGateMessage(kind, user) {
  switch (kind) {
    case 'publish':
      // Phone first: email-fallback signups already confirmed email but must confirm phone.
      if (!isValidRussianPhone(user?.phone)) {
        return 'Ajoutez un numéro russe (+7) valide dans Sécurité avant de publier.'
      }
      if (!isPhoneVerified(user)) {
        return 'Confirmez votre numéro russe par SMS dans Sécurité avant de publier une annonce, un colis, un job ou un événement.'
      }
      if (!isEmailVerified(user)) {
        return 'Confirmez votre e-mail dans Sécurité avant de publier une annonce, un colis, un job, un événement ou un post.'
      }
      return 'Confirmez votre e-mail et votre numéro russe avant de publier.'
    case 'voyage':
      if (!isPhoneVerified(user) || !isValidRussianPhone(user?.phone)) {
        return 'Confirmez votre numéro russe (+7) avant de publier un voyage.'
      }
      if (!isEmailVerified(user)) {
        return 'Confirmez votre e-mail dans Sécurité avant de publier un voyage.'
      }
      if (!isIdentityVerified(user)) {
        return 'Votre identité doit être vérifiée (KYC / documents validés) avant de publier un voyage.'
      }
      return 'Passez toutes les vérifications (téléphone, e-mail et identité) avant de publier un voyage.'
    case 'p2p':
      if (!isPhoneVerified(user) || !isValidRussianPhone(user?.phone)) {
        return 'Confirmez votre numéro russe (+7) avant de publier une offre P2P.'
      }
      if (!isEmailVerified(user)) {
        return 'Confirmez votre e-mail dans Sécurité avant de publier une offre P2P.'
      }
      if (!isIdentityVerified(user)) {
        return 'Votre identité doit être vérifiée (documents validés) avant de publier une offre P2P.'
      }
      return 'Vérifiez votre identité avant de publier une offre P2P.'
    case 'business':
      if (!isPersonallyRegistered(user)) {
        return 'Complétez vos informations personnelles avant de créer une entreprise.'
      }
      if (!isEmailVerified(user)) {
        return 'Confirmez votre adresse e-mail dans Sécurité avant de créer une entreprise.'
      }
      return 'Votre identité doit être vérifiée par MOXT avant de créer une entreprise.'
    case 'transfer':
      if (!isPersonallyRegistered(user)) {
        return 'Complétez vos informations personnelles avant d’utiliser les comptes de transfert.'
      }
      return 'Votre identité doit être vérifiée par MOXT avant d’effectuer un transfert.'
    default:
      return 'Action non autorisée avec votre niveau de vérification actuel.'
  }
}
