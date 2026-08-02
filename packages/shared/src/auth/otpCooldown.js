/**
 * Dev UX flags (OTP diagnostics). Cooldown is independent — always 60s in prod UX.
 */
export const MOXT_AUTH_DEV_MODE = false

/** Minimum delay between OTP sends to the same phone or e-mail. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60

export const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000

/**
 * Max SMS resends during phone registration (after the initial send).
 * 1 initial + 1 resend = 2 SMS; the next action switches to e-mail OTP.
 */
export const SMS_REGISTRATION_MAX_RESENDS = 1

/** Max OTP sends per phone inside the rolling window (cost control). */
export const OTP_MAX_SENDS_PER_WINDOW = 4

/** Rolling abuse window for phone SMS (3 hours). */
export const OTP_SEND_WINDOW_MS = 3 * 60 * 60 * 1000

/** When true, enforce the phone 4 / 3h cap (independent of the 60s cooldown). */
export const OTP_SEND_CAP_ENABLED = true

/**
 * Soft cap for e-mail — DISABLED: e-mail must stay available as SMS fallback.
 * Only the 60s resend cooldown still applies to e-mail.
 */
export const OTP_EMAIL_SEND_CAP_ENABLED = false

/** Kept for docs / future tuning; ignored while OTP_EMAIL_SEND_CAP_ENABLED is false. */
export const OTP_EMAIL_MAX_SENDS_PER_WINDOW = 8

export const OTP_EMAIL_SEND_WINDOW_MS = 20 * 60 * 1000

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

function windowMsFor(kind) {
  return kind === 'email' ? OTP_EMAIL_SEND_WINDOW_MS : OTP_SEND_WINDOW_MS
}

function maxSendsFor(kind) {
  return kind === 'email' ? OTP_EMAIL_MAX_SENDS_PER_WINDOW : OTP_MAX_SENDS_PER_WINDOW
}

function capEnabledFor(kind) {
  return kind === 'email' ? OTP_EMAIL_SEND_CAP_ENABLED : OTP_SEND_CAP_ENABLED
}

/**
 * Prune timestamps outside the rolling window for this identity kind.
 * @param {number[]} timestamps
 * @param {'phone' | 'email'} kind
 * @param {number} [now]
 */
export function pruneOtpTimestamps(timestamps, kindOrNow = Date.now(), maybeNow) {
  // Back-compat: pruneOtpTimestamps(ts, now) used phone window.
  let kind = 'phone'
  let now = Date.now()
  if (typeof kindOrNow === 'string') {
    kind = kindOrNow
    now = maybeNow ?? Date.now()
  } else if (typeof kindOrNow === 'number') {
    now = kindOrNow
  }
  const windowMs = windowMsFor(kind)
  return (timestamps || []).filter((ts) => now - ts < windowMs)
}

/**
 * @param {Map<string, number[]>} store
 * @param {'phone' | 'email'} kind
 * @param {string} value
 */
export function getOtpSendState(store, kind, value, now = Date.now()) {
  const key = otpIdentityKey(kind, value)
  const recent = pruneOtpTimestamps(store.get(key) || [], kind, now)
  const last = recent.length ? recent[recent.length - 1] : 0
  const cooldownRemainingMs = last ? Math.max(0, OTP_RESEND_COOLDOWN_MS - (now - last)) : 0
  const maxSends = maxSendsFor(kind)
  const windowMs = windowMsFor(kind)
  const sendsInWindow = recent.length
  const capped = capEnabledFor(kind) && sendsInWindow >= maxSends
  const windowResetMs = recent.length ? Math.max(0, windowMs - (now - recent[0])) : 0

  return {
    key,
    recent,
    last,
    sendsInWindow,
    remainingSends: capEnabledFor(kind) ? Math.max(0, maxSends - sendsInWindow) : maxSends,
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

export function formatOtpCapError(resetMinutes, kind = 'phone') {
  const max = maxSendsFor(kind)
  const windowLabel =
    kind === 'email'
      ? '20 minutes'
      : '3 heures'
  return `Limite atteinte : maximum ${max} codes par période de ${windowLabel}. Réessayez dans environ ${resetMinutes} minute${resetMinutes > 1 ? 's' : ''}.`
}

/**
 * Read durable OTP send log (localStorage when available). Client+memory only —
 * no DB table; document this for ops (pair with Supabase Auth rate limits).
 * When e-mail soft cap is disabled, legacy `email:*` entries are dropped so
 * devices previously capped are unblocked on next load.
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
    let droppedEmail = false
    for (const [key, value] of Object.entries(parsed)) {
      const kind = String(key).startsWith('email:') ? 'email' : 'phone'
      if (kind === 'email' && !OTP_EMAIL_SEND_CAP_ENABLED) {
        droppedEmail = true
        continue
      }
      const pruned = pruneOtpTimestamps(Array.isArray(value) ? value : [], kind, now)
      if (pruned.length) store.set(key, pruned)
    }
    if (droppedEmail) persistOtpSendLog(store, storage)
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
      const kind = String(key).startsWith('email:') ? 'email' : 'phone'
      const pruned = pruneOtpTimestamps(timestamps, kind, now)
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
 * Clear only one identity from the send log (e.g. after a successful verify).
 */
export function clearOtpSendLogForIdentity(store, kind, value, storage = getDefaultStorage()) {
  const key = otpIdentityKey(kind, value)
  store.delete(key)
  persistOtpSendLog(store, storage)
}

/**
 * Throws if the identity is under cooldown or has hit its send cap.
 * Call before the provider send so a blocked attempt never triggers SMS/email.
 *
 * @param {Map<string, number[]>} store
 * @param {'phone' | 'email'} kind
 * @param {string} value
 */
export function assertOtpSendAllowed(store, kind, value, now = Date.now()) {
  const state = getOtpSendState(store, kind, value, now)
  if (state.capped) {
    throw new Error(formatOtpCapError(Math.max(1, state.windowResetMinutes), kind))
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
