import { clearAuthClientCache } from '@moxt/shared/auth/clearAuthClientCache.js'
import { clearAppBadge } from '../platform/appBadge'
import { clearWelcomePending } from '../features/onboarding/welcomeStorage'
import { clearSearchHistory } from './searchHistory'
import { TRANSFER_DRAFT_KEY } from '../features/transfers/wizard/transferWizardConfig'

/** Bump to force a one-time wipe of stale user caches after deploy / DB wipe. */
export const MOXT_CACHE_VERSION = '2026-07-16-db-wipe'
const MOXT_CACHE_VERSION_KEY = 'MOXT_CACHE_VERSION'

const PRESERVED_LOCAL_KEYS = new Set([
  MOXT_CACHE_VERSION_KEY,
  'moxt-theme',
  'moxt-language',
  'moxt-african-countries-v1',
  'moxt-russian-cities-v1',
  'moxt-rub-xof-rate-v1',
  'moxt-legacy-migration-v1',
  'moxt-storage-manifest-v2',
  'moxt-business-sync-v1',
  'moxt-pwa-install-dismiss',
  'moxt-push-permission-dismiss',
])

function getLocalStorage() {
  try {
    return typeof globalThis !== 'undefined' ? globalThis.localStorage : null
  } catch {
    return null
  }
}

function getSessionStorage() {
  try {
    return typeof globalThis !== 'undefined' ? globalThis.sessionStorage : null
  } catch {
    return null
  }
}

function isMoxtScopedKey(key) {
  return key.startsWith('moxt-') || key.startsWith('moxt.') || key === 'currentUser'
}

function collectRemovableLocalKeys(storage) {
  const keys = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key || PRESERVED_LOCAL_KEYS.has(key)) continue
    if (isMoxtScopedKey(key)) keys.push(key)
  }
  return keys
}

function collectSupabaseAuthKeys(storage) {
  const keys = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith('sb-') && key.includes('-auth-token')) keys.push(key)
  }
  return keys
}

function clearSessionScopedKeys(sessionStorage) {
  const removed = []
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index)
    if (!key || !isMoxtScopedKey(key)) continue
    sessionStorage.removeItem(key)
    removed.push(key)
  }
  return removed
}

async function notifyServiceWorkerSkipWaiting() {
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  } catch {
    // optional
  }
}

/**
 * @param {{ scope?: 'full' | 'auth', reason?: string, preserveAuth?: boolean }} [options]
 * @returns {string[]} keys removed from localStorage (for diagnostics)
 */
export function clearClientCache({ scope = 'full', preserveAuth = false } = {}) {
  const removed = []
  clearAuthClientCache()
  clearWelcomePending()

  const local = getLocalStorage()
  const session = getSessionStorage()

  if (scope === 'auth') {
    if (local) {
      local.removeItem(TRANSFER_DRAFT_KEY)
      removed.push(TRANSFER_DRAFT_KEY)
    }
    clearSearchHistory()
    removed.push('moxt-search-history-v1')
    return removed
  }

  if (local) {
    for (const key of collectRemovableLocalKeys(local)) {
      local.removeItem(key)
      removed.push(key)
    }
    // Ne pas effacer sb-*-auth-token sauf logout explicite (preserveAuth=false).
    if (!preserveAuth) {
      for (const key of collectSupabaseAuthKeys(local)) {
        local.removeItem(key)
        removed.push(key)
      }
    }
    clearSearchHistory()
  }

  if (session) {
    removed.push(...clearSessionScopedKeys(session))
  }

  clearAppBadge()
  void notifyServiceWorkerSkipWaiting()
  return removed
}

/** True si une session Supabase est encore en localStorage. */
export function hasSupabaseAuthInStorage() {
  const local = getLocalStorage()
  if (!local) return false
  return collectSupabaseAuthKeys(local).length > 0
}

/**
 * One-time client cache migration after version bump (boot).
 * Préserve toujours les tokens auth — un deploy ne doit pas déconnecter.
 */
export function ensureClientCacheVersion() {
  const local = getLocalStorage()
  if (!local) return false
  if (local.getItem(MOXT_CACHE_VERSION_KEY) === MOXT_CACHE_VERSION) return false
  clearClientCache({ scope: 'full', reason: 'version-bump', preserveAuth: true })
  local.setItem(MOXT_CACHE_VERSION_KEY, MOXT_CACHE_VERSION)
  return true
}
