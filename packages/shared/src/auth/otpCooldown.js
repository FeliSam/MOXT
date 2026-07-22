/**
 * Dev UX flags (OTP diagnostics). Cooldown is independent — always 90s in prod UX.
 */
export const MOXT_AUTH_DEV_MODE = false

/** Minimum delay between OTP sends to the same phone or e-mail. */
export const OTP_RESEND_COOLDOWN_SECONDS = 90

export const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000

/**
 * Max SMS resends during phone registration (after the initial send).
 * 1 initial + 1 resend = 2 SMS; the next action switches to e-mail OTP.
 */
export const SMS_REGISTRATION_MAX_RESENDS = 1

/** Max OTP sends per identity inside the rolling window (4 tentatives / 3 h). */
export const OTP_MAX_SENDS_PER_WINDOW = 4

/** Rolling abuse window (3 hours). */
export const OTP_SEND_WINDOW_MS = 3 * 60 * 60 * 1000

/** When true, enforce the 4 / 3h cap (independent of the 90s cooldown). */
export const OTP_SEND_CAP_ENABLED = true

export const OTP_SEND_LOG_STORAGE_KEY = 'moxt.otpSendLog.v1'

export function otpIdentityKey(kind, value) {
  const normalized =
    kind === 'email'
      ? String(value || '')
          .trim()
          .toLowerCase()
      : String(value || '').trim()
  return `${kind}:${normalized}`
}

/**
 * Prune timestamps outside the rolling window.
 * @param {number[]} timestamps
 * @param {number} [now]
 */
export function pruneOtpTimestamps(timestamps, now = Date.now()) {
  return (timestamps || []).filter((ts) => now - ts < OTP_SEND_WINDOW_MS)
}

/**
 * @param {Map<string, number[]>} store
 * @param {'phone' | 'email'} kind
 * @param {string} value
 */
export function getOtpSendState(store, kind, value, now = Date.now()) {
  const key = otpIdentityKey(kind, value)
  const recent = pruneOtpTimestamps(store.get(key) || [], now)
  const last = recent.length ? recent[recent.length - 1] : 0
  const cooldownRemainingMs = last ? Math.max(0, OTP_RESEND_COOLDOWN_MS - (now - last)) : 0
  const sendsInWindow = recent.length
  const capped = OTP_SEND_CAP_ENABLED && sendsInWindow >= OTP_MAX_SENDS_PER_WINDOW
  const windowResetMs = recent.length
    ? Math.max(0, OTP_SEND_WINDOW_MS - (now - recent[0]))
    : 0

  return {
    key,
    recent,
    last,
    sendsInWindow,
    remainingSends: OTP_SEND_CAP_ENABLED
      ? Math.max(0, OTP_MAX_SENDS_PER_WINDOW - sendsInWindow)
      : OTP_MAX_SENDS_PER_WINDOW,
    capped,
    cooldownRemainingMs,
    cooldownRemainingSeconds: Math.ceil(cooldownRemainingMs / 1000),
    windowResetMs,
    windowResetMinutes: Math.ceil(windowResetMs / 60_000),
  }
}

export function formatOtpCooldownError(waitSeconds) {
  return `Patientez ${waitSeconds} secondes avant de renvoyer un code.`
}

export function formatOtpCapError(resetMinutes) {
  return `Limite atteinte : maximum ${OTP_MAX_SENDS_PER_WINDOW} codes par période de 3 heures. Réessayez dans environ ${resetMinutes} minute${resetMinutes > 1 ? 's' : ''}.`
}

/**
 * Read durable OTP send log (localStorage when available). Client+memory only —
 * no DB table; document this for ops (pair with Supabase Auth rate limits).
 * @returns {Map<string, number[]>}
 */
export function loadOtpSendLog(storage = getDefaultStorage()) {
  const store = new Map()
  if (!storage) return store
  try {
    const raw = storage.getItem(OTP_SEND_LOG_STORAGE_KEY)
    if (!raw) return store
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return store
    const now = Date.now()
    for (const [key, value] of Object.entries(parsed)) {
      const pruned = pruneOtpTimestamps(Array.isArray(value) ? value : [], now)
      if (pruned.length) store.set(key, pruned)
    }
  } catch {
    // Ignore corrupt storage.
  }
  return store
}

/**
 * @param {Map<string, number[]>} store
 */
export function persistOtpSendLog(store, storage = getDefaultStorage()) {
  if (!storage) return
  try {
    const now = Date.now()
    const payload = {}
    for (const [key, timestamps] of store.entries()) {
      const pruned = pruneOtpTimestamps(timestamps, now)
      if (pruned.length) payload[key] = pruned
    }
    storage.setItem(OTP_SEND_LOG_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota / private mode — keep in-memory only.
  }
}

function getDefaultStorage() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage
    }
  } catch {
    // ignore
  }
  return null
}

/** Wipe durable OTP send log (logout, DB wipe recovery, cache version bump). */
export function clearOtpSendLog(storage = getDefaultStorage()) {
  if (!storage) return
  try {
    storage.removeItem(OTP_SEND_LOG_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Throws if the identity is under cooldown or has hit the 4 / 3h cap.
 * Call before the provider send so a blocked attempt never triggers SMS/email.
 *
 * @param {Map<string, number[]>} store
 * @param {'phone' | 'email'} kind
 * @param {string} value
 */
export function assertOtpSendAllowed(store, kind, value, now = Date.now()) {
  const state = getOtpSendState(store, kind, value, now)
  if (state.capped) {
    throw new Error(formatOtpCapError(Math.max(1, state.windowResetMinutes)))
  }
  if (state.cooldownRemainingMs > 0) {
    throw new Error(formatOtpCooldownError(Math.max(1, state.cooldownRemainingSeconds)))
  }
  return state
}

/**
 * @param {Map<string, number[]>} store
 * @param {'phone' | 'email'} kind
 * @param {string} value
 * @param {{ enforce?: boolean, persist?: boolean, now?: number }} [options]
 */
export function recordOtpSend(store, kind, value, { enforce = false, persist = true, now = Date.now() } = {}) {
  if (enforce) {
    assertOtpSendAllowed(store, kind, value, now)
  }

  const state = getOtpSendState(store, kind, value, now)
  const next = [...state.recent, now]
  store.set(state.key, next)
  if (persist) persistOtpSendLog(store)
  return getOtpSendState(store, kind, value, now)
}
