const PENDING_REGISTRATION_KEY = 'moxt.pendingRegistration.v1'

/** Fallback when sessionStorage is unavailable (Node tests, private mode). */
const memoryStore = new Map()

/**
 * Persist signup OTP progress across failed codes / resends.
 * Never stores the password — only fields needed to finish verify + profile.
 *
 * @typedef {{
 *   method: 'phone' | 'email',
 *   phone?: string,
 *   email?: string,
 *   pendingUserId?: string,
 *   firstName?: string,
 *   lastName?: string,
 *   originPhone?: string,
 *   originCountry?: string,
 *   residenceCity?: string,
 *   avatarUrl?: string,
 *   step?: number,
 *   savedAt?: number,
 * }} PendingRegistration
 */

function getSessionStorage() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.sessionStorage) {
      return globalThis.sessionStorage
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * @param {PendingRegistration | null | undefined} payload
 */
export function savePendingRegistration(payload) {
  if (!payload?.method) return
  const safe = {
    method: payload.method === 'email' ? 'email' : 'phone',
    phone: payload.phone || '',
    email: String(payload.email || '')
      .trim()
      .toLowerCase(),
    pendingUserId: payload.pendingUserId || '',
    firstName: payload.firstName || '',
    lastName: payload.lastName || '',
    originPhone: payload.originPhone || '',
    originCountry: payload.originCountry || '',
    residenceCity: payload.residenceCity || '',
    avatarUrl: payload.avatarUrl || '',
    step: payload.step || 4,
    savedAt: Date.now(),
  }
  const serialized = JSON.stringify(safe)
  const storage = getSessionStorage()
  if (storage) {
    try {
      storage.setItem(PENDING_REGISTRATION_KEY, serialized)
      return
    } catch {
      // fall through to memory
    }
  }
  memoryStore.set(PENDING_REGISTRATION_KEY, serialized)
}

/** @returns {PendingRegistration | null} */
export function loadPendingRegistration() {
  let raw = null
  const storage = getSessionStorage()
  if (storage) {
    try {
      raw = storage.getItem(PENDING_REGISTRATION_KEY)
    } catch {
      raw = null
    }
  }
  if (!raw) {
    raw = memoryStore.get(PENDING_REGISTRATION_KEY) || null
  }
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.method) return null
    // Expire after 3 hours (align with OTP send window).
    if (parsed.savedAt && Date.now() - parsed.savedAt > 3 * 60 * 60 * 1000) {
      clearPendingRegistration()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearPendingRegistration() {
  const storage = getSessionStorage()
  if (storage) {
    try {
      storage.removeItem(PENDING_REGISTRATION_KEY)
    } catch {
      // ignore
    }
  }
  memoryStore.delete(PENDING_REGISTRATION_KEY)
}

export { PENDING_REGISTRATION_KEY }
