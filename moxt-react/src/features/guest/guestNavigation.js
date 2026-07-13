import { isProfileComplete } from '@moxt/shared/auth/profileCompletion.js'
import { matchUserId } from '../businesses/businessVisibility'
import { parseMoxtScanTarget } from '../share/parseMoxtScanTarget'

const INVITE_STORAGE_KEY = 'moxt.pendingInviteCode'
const RETURN_TO_STORAGE_KEY = 'moxt.returnTo'

export function storePendingInviteCode(code) {
  const normalized = String(code || '').trim()
  if (!normalized) return
  try {
    sessionStorage.setItem(INVITE_STORAGE_KEY, normalized)
  } catch {
    // ignore storage failures
  }
}

export function readPendingInviteCode() {
  try {
    return sessionStorage.getItem(INVITE_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function clearPendingInviteCode() {
  try {
    sessionStorage.removeItem(INVITE_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function storeReturnTo(path) {
  const normalized = String(path || '').trim()
  if (!normalized || !normalized.startsWith('/')) return
  try {
    sessionStorage.setItem(RETURN_TO_STORAGE_KEY, normalized)
  } catch {
    // ignore
  }
}

export function readReturnTo() {
  try {
    return sessionStorage.getItem(RETURN_TO_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function clearReturnTo() {
  try {
    sessionStorage.removeItem(RETURN_TO_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function resolveReturnTo(searchParams, locationState) {
  const fromQuery = searchParams.get('returnTo')
  if (fromQuery && fromQuery.startsWith('/')) {
    return decodeURIComponent(fromQuery)
  }
  if (locationState?.from && String(locationState.from).startsWith('/')) {
    return locationState.from
  }
  const stored = readReturnTo()
  if (stored) return stored
  return '/dashboard'
}

/** Session MOXT déjà active dans ce navigateur (un compte par navigateur). */
export function hasActiveBrowserAccount(user, status = 'authenticated') {
  return Boolean(user?.id) && status !== 'loading' && isProfileComplete(user)
}

/** Destination par défaut quand l'utilisateur est déjà connecté (QR, invitation, register). */
export function resolveAuthenticatedLanding(searchParams, locationState) {
  const returnTo = resolveReturnTo(searchParams, locationState)
  if (returnTo && returnTo !== '/dashboard') return returnTo
  return '/profile'
}

/**
 * Résout la route après scan QR quand une session est active.
 * Évite login/register et ouvre le profil pour son propre QR ou une invitation.
 */
export function resolveMoxtScanDestination(target, user) {
  if (!target?.path) return '/dashboard'
  if (!user?.id) return target.path

  if (target.type === 'invite') return '/profile'

  if (target.type === 'user' && target.userId && matchUserId(target.userId, user.id)) {
    return '/profile'
  }

  return target.path
}

/** Normalise un lien profond MOXT selon la session navigateur. */
export function resolveDeepLinkDestination(path, user) {
  const trimmed = String(path || '').trim()
  if (!trimmed) return null

  if (user?.id && /^\/invite\/[^/?#]+/i.test(trimmed)) {
    return '/profile'
  }

  const target = parseMoxtScanTarget(trimmed)
  if (target) return resolveMoxtScanDestination(target, user)

  const ownProfileMatch = trimmed.match(/^\/users\/([^/]+)\/(?:publications|annonces)/i)
  if (user?.id && ownProfileMatch?.[1] && matchUserId(ownProfileMatch[1], user.id)) {
    return '/profile'
  }

  return trimmed
}
