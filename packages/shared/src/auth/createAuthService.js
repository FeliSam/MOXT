import { normalizePhone, normalizeRussianAuthPhone } from '../utils/phone.js'
import {
  assertOtpSendAllowed,
  loadOtpSendLog,
  otpIdentityKey,
  persistOtpSendLog,
  recordOtpSend,
} from './otpCooldown.js'
import { loadPendingRegistration } from './pendingRegistration.js'
import { isProfileComplete } from './profileCompletion.js'
import {
  isSmsNumberProviderDenied,
  SMS_NUMBER_PROVIDER_DENIED,
  translateAuthError,
} from './translateAuthError.js'

/** Thrown when Supabase Auth session exists but profiles row was wiped (ops / DB reset). */
export const ORPHAN_SESSION_ERROR = 'MOXT_ORPHAN_SESSION'

function isOrphanSessionError(error) {
  return error?.code === ORPHAN_SESSION_ERROR || error?.message === ORPHAN_SESSION_ERROR
}

/**
 * Les appels réseau Supabase (getSession/refreshSession/getUser) peuvent rester
 * indéfiniment "pending" (sans jamais résoudre ni rejeter) quand l'app mobile est
 * relancée depuis l'arrière-plan avec une connectivité instable — le socket est
 * mort mais aucun événement d'erreur n'est jamais émis. Sans garde-fou, l'écran de
 * démarrage reste bloqué en chargement jusqu'à ce que l'utilisateur force la
 * fermeture de l'app. On borne donc chaque appel dans le temps.
 */
const AUTH_NETWORK_TIMEOUT_MS = 10000
const AUTH_LOGIN_TIMEOUT_MS = 15000
/** signUp / signInWithOtp attendent le hook SMS — borné pour ne pas geler « Créer mon compte ». */
const AUTH_OTP_SEND_TIMEOUT_MS = 30000
/** Prefetch identité (tél./e-mail) : réutilisé au submit pour éviter un 2ᵉ round-trip. */
const IDENTITY_CACHE_TTL_MS = 30000
const identityAvailabilityCache = new Map()
const identityAvailabilityInflight = new Map()

export function __resetIdentityAvailabilityCacheForTests() {
  identityAvailabilityCache.clear()
  identityAvailabilityInflight.clear()
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timeout après ${ms}ms`))
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function isTimeoutError(error) {
  return typeof error?.message === 'string' && error.message.includes('timeout après')
}

function isAuthUserConfirmed(authUser) {
  return Boolean(authUser?.phone_confirmed_at || authUser?.email_confirmed_at)
}

/** In-memory + localStorage OTP send log (90s + 4/3h). No durable DB table. */
const otpSendLog = loadOtpSendLog()

/**
 * In-flight OTP sends keyed by identity — collapses double-click / double-dispatch
 * into a single provider call (one SMS / e-mail).
 * @type {Map<string, Promise<unknown>>}
 */
const otpInFlight = new Map()

/** @internal Test helper — clears in-memory OTP resend cooldown / cap. */
export function __resetOtpSendCooldownForTests() {
  otpSendLog.clear()
  otpInFlight.clear()
  persistOtpSendLog(otpSendLog)
}

/**
 * Run `fn` once per identity while a send is already in flight; concurrent callers
 * await the same promise (no second SMS).
 * @template T
 * @param {'phone' | 'email'} kind
 * @param {string} value
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
function withOtpInFlight(kind, value, fn) {
  const key = otpIdentityKey(kind, value)
  const existing = otpInFlight.get(key)
  if (existing) return /** @type {Promise<T>} */ (existing)

  const promise = Promise.resolve()
    .then(fn)
    .finally(() => {
      if (otpInFlight.get(key) === promise) otpInFlight.delete(key)
    })
  otpInFlight.set(key, promise)
  return promise
}

function profileToUser(profile) {
  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: normalizeRussianAuthPhone(profile.phone || ''),
    secondaryPhone: profile.origin_phone || '',
    country: profile.country || 'RU',
    originCountry: profile.origin_country || 'BJ',
    city: profile.city || '',
    avatarUrl: profile.avatar_url || '',
    role: profile.role || 'user',
    verified: profile.status === 'verified',
    status: profile.status || 'active',
    phoneVerified: profile.phone_verified === true,
    phoneVerifiedAt: profile.phone_verified_at || null,
    createdAt: profile.created_at || profile.updated_at || null,
  }
}

function trimOrEmpty(value) {
  return String(value ?? '').trim()
}

function requireFirstName(value, fallback = 'Utilisateur') {
  const trimmed = trimOrEmpty(value)
  return trimmed || fallback
}

/** Never send null/empty first_name to profiles (NOT NULL constraint). */
function sanitizeProfileWriteFields(fields = {}) {
  const safe = { ...fields }
  if ('first_name' in safe) {
    safe.first_name = requireFirstName(safe.first_name)
  }
  if ('last_name' in safe) {
    safe.last_name = trimOrEmpty(safe.last_name)
  }
  return safe
}

function pendingRegistrationToProfileFields(pending) {
  if (!pending) return null
  return sanitizeProfileWriteFields({
    first_name: requireFirstName(pending.firstName),
    last_name: trimOrEmpty(pending.lastName),
    email: trimOrEmpty(pending.email).toLowerCase(),
    phone: normalizeRussianAuthPhone(pending.phone || ''),
    origin_phone: trimOrEmpty(pending.originPhone),
    origin_country: pending.originCountry || 'BJ',
    city: trimOrEmpty(pending.residenceCity),
    avatar_url: trimOrEmpty(pending.avatarUrl),
    country: 'RU',
    role: 'user',
    status: 'active',
  })
}

function resolvePendingRegistrationForUser(authUser, pending = loadPendingRegistration()) {
  if (!pending || !authUser?.id) return null
  if (pending.pendingUserId && pending.pendingUserId !== authUser.id) return null

  const authPhone = normalizeRussianAuthPhone(authUser.phone || authUser.user_metadata?.phone || '')
  const pendingPhone = normalizeRussianAuthPhone(pending.phone || '')
  if (pendingPhone && authPhone && pendingPhone !== authPhone) return null

  return pending
}

function isPhoneLoginDisabledError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  const code = error?.code
  return (
    code === 'phone_provider_disabled' ||
    message.includes('phone logins are disabled') ||
    message.includes('phone provider') ||
    message.includes('unsupported phone provider')
  )
}

function isAuthAlreadyExistsError(error) {
  const code = String(error?.code || '').toLowerCase()
  const message = String(error?.message || '').toLowerCase()
  return (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    code === 'phone_exists' ||
    code === 'identity_already_exists' ||
    message.includes('already registered') ||
    message.includes('already exists')
  )
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} supabase
 * @param {{
 *   getEmailRedirectUrl?: () => string,
 *   getPasswordResetRedirectUrl?: () => string,
 * }} redirects
 */
export function createAuthService(supabase, redirects = {}) {
  const getEmailRedirectUrl = redirects.getEmailRedirectUrl ?? (() => '')
  const getPasswordResetRedirectUrl = redirects.getPasswordResetRedirectUrl ?? (() => '')

  async function signInWithPhoneFallback(phone, password) {
    // 1) Tentative native Supabase (si Phone est activé dans le dashboard)
    const phoneResult = await supabase.auth.signInWithPassword({ phone, password })
    if (!phoneResult.error && phoneResult.data?.session) {
      return phoneResult
    }

    if (phoneResult.error && !isPhoneLoginDisabledError(phoneResult.error)) {
      if (
        String(phoneResult.error.message || '')
          .toLowerCase()
          .includes('invalid login credentials')
      ) {
        return phoneResult
      }
    }

    // 2) Fallback Edge Function : login e-mail du profil lié au numéro
    const { data, error } = await supabase.functions.invoke('phone-login', {
      body: { phone, password },
    })
    if (error || data?.error) {
      let detail = data?.error
      if (!detail && error?.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.json()
          detail = body?.error
        } catch {
          // ignore
        }
      }
      return {
        data: { user: null, session: null },
        error: {
          message:
            detail ||
            phoneResult.error?.message ||
            error?.message ||
            'Connexion par numéro impossible.',
        },
      }
    }

    if (!data?.access_token || !data?.refresh_token) {
      return {
        data: { user: null, session: null },
        error: { message: 'Session invalide après connexion téléphone.' },
      }
    }

    const sessionResult = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
    if (sessionResult.error) {
      return { data: { user: null, session: null }, error: sessionResult.error }
    }

    return {
      data: {
        user: sessionResult.data.user || data.user,
        session: sessionResult.data.session,
      },
      error: null,
    }
  }

  async function fetchProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? profileToUser(data) : null
  }

  async function upsertProfile(userId, fields) {
    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        ...sanitizeProfileWriteFields(fields),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    if (error) throw new Error(error.message)
  }

  function profileSeedFromSources(authUser, currentUser) {
    const metadata = authUser?.user_metadata || {}
    return sanitizeProfileWriteFields({
      first_name: requireFirstName(currentUser?.firstName || metadata.first_name),
      last_name: trimOrEmpty(currentUser?.lastName || metadata.last_name),
      email: trimOrEmpty(currentUser?.email || authUser?.email || metadata.email).toLowerCase(),
      phone: normalizeRussianAuthPhone(
        currentUser?.phone || authUser?.phone || metadata.phone || '',
      ),
      origin_phone: trimOrEmpty(currentUser?.secondaryPhone || metadata.origin_phone),
      origin_country: currentUser?.originCountry || metadata.origin_country || 'BJ',
      city: trimOrEmpty(currentUser?.city || metadata.city),
      avatar_url: trimOrEmpty(currentUser?.avatarUrl || metadata.avatar_url || metadata.picture),
      country: currentUser?.country || 'RU',
      role: 'user',
      status: 'active',
    })
  }

  /** Partial profile write: UPDATE when row exists; INSERT with required fields otherwise. */
  async function patchProfileFields(userId, fields, { authUser, currentUser } = {}) {
    const sanitized = sanitizeProfileWriteFields(fields)
    const { data: row, error: readError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (readError) throw new Error(readError.message)

    const updatedAt = new Date().toISOString()
    if (row) {
      const { error } = await supabase
        .from('profiles')
        .update({ ...sanitized, updated_at: updatedAt })
        .eq('id', userId)
      if (error) throw new Error(error.message)
      return
    }

    const base = profileSeedFromSources(authUser, currentUser)
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      ...sanitizeProfileWriteFields({ ...base, ...sanitized }),
      updated_at: updatedAt,
    })
    if (error) throw new Error(error.message)
  }

  async function upsertProfileSafely(userId, fields) {
    try {
      await upsertProfile(userId, fields)
    } catch (err) {
      const existing = await fetchProfile(userId)
      if (existing) return
      throw err
    }
  }

  function translateProfilePersistenceError(error) {
    const message = String(error?.message || error || '')
    if (
      message.includes('Failed to fetch') ||
      message.toLowerCase().includes('network') ||
      message.toLowerCase().includes('connection') ||
      message.toLowerCase().includes('pgrst')
    ) {
      return 'Connexion au serveur impossible. Réessayez « Confirmer » sans redemander de code.'
    }
    return translateAuthError(
      { message },
      { channel: 'phone', intent: 'otp_verify' },
    )
  }

  async function persistVerifiedRegistrationProfile(userId, profileFields) {
    const authUser = await getAuthenticatedAuthUser()
    if (authUser.id !== userId) {
      throw new Error(
        translateAuthError(
          { message: 'MOXT_SESSION_REQUIRED' },
          { channel: 'phone', intent: 'otp_verify' },
        ),
      )
    }
    if (!authUser.phone_confirmed_at) {
      throw new Error(
        translateAuthError(
          { message: 'MOXT_PHONE_NOT_CONFIRMED' },
          { channel: 'phone', intent: 'otp_verify' },
        ),
      )
    }

    const finalizePayload = {
      p_first_name: profileFields.first_name || null,
      p_last_name: profileFields.last_name || null,
      p_email: profileFields.email || null,
      p_origin_phone: profileFields.origin_phone || null,
      p_origin_country: profileFields.origin_country || null,
      p_city: profileFields.city || null,
      p_avatar_url: profileFields.avatar_url || null,
    }

    // Single path: server finalize only (no client upsert / fake phoneVerified).
    const { data: finalized, error: finalizeError } = await supabase.rpc(
      'moxt_finalize_phone_registration',
      finalizePayload,
    )
    if (finalizeError || !finalized?.id) {
      throw new Error(
        translateAuthError(
          { message: finalizeError?.message || 'MOXT_FINALIZE_FAILED' },
          { channel: 'phone', intent: 'otp_verify' },
        ),
      )
    }
    if (finalized.phone_verified !== true) {
      throw new Error(
        translateAuthError(
          { message: 'MOXT_FINALIZE_FAILED' },
          { channel: 'phone', intent: 'otp_verify' },
        ),
      )
    }
    return profileToUser(finalized)
  }

  function guardOtpSend(kind, value) {
    assertOtpSendAllowed(otpSendLog, kind, value)
  }

  function trackOtpSend(kind, value, { enforceCooldown = false } = {}) {
    recordOtpSend(otpSendLog, kind, value, { enforce: enforceCooldown })
  }

  async function resumePhoneSignup(phone, email = '', pendingUserId = null) {
    // Only unfinished SMS signups are resumable. A live/masked confirmed number
    // must never receive a "register" OTP (that logs into the existing auth user
    // and would let finalize overwrite their profile).
    // Bypass prefetch cache — this is a security gate, not a UX warm-up.
    const availability = await checkIdentityAvailability('phone', phone, null, {
      useCache: false,
    })
    if (!availability.available) {
      if (availability.reason === 'limit') {
        throw new Error('IDENTITY_LIMIT_REACHED')
      }
      throw new Error('ALREADY_REGISTERED')
    }

    guardOtpSend('phone', phone)

    // Prefer signInWithOtp — more reliably triggers the Send SMS hook than auth.resend.
    // Do not mark prefer_p1sms: resend stays on SMSC (P1SMS dual-route paused).
    let otpResult
    try {
      otpResult = await withTimeout(
        supabase.auth.signInWithOtp({
          phone,
          options: { channel: 'sms', shouldCreateUser: false },
        }),
        AUTH_OTP_SEND_TIMEOUT_MS,
        'signInWithOtp',
      )
    } catch (error) {
      if (isTimeoutError(error)) {
        throw new Error(
          'L’envoi du SMS prend trop de temps. Vérifiez votre réseau (VPN inclus) puis réessayez.',
        )
      }
      throw error
    }
    if (otpResult.error) {
      let resendResult
      try {
        resendResult = await withTimeout(
          supabase.auth.resend({
            type: 'sms',
            phone,
          }),
          AUTH_OTP_SEND_TIMEOUT_MS,
          'resendSms',
        )
      } catch (error) {
        if (isTimeoutError(error)) {
          throw new Error(
            'L’envoi du SMS prend trop de temps. Vérifiez votre réseau (VPN inclus) puis réessayez.',
          )
        }
        throw error
      }
      if (resendResult.error) {
        const smsError = otpResult.error || resendResult.error
        if (isSmsNumberProviderDenied(smsError)) {
          throw new Error(SMS_NUMBER_PROVIDER_DENIED)
        }
        // Surface the real SMS / Auth error — never collapse to ALREADY_REGISTERED here.
        throw new Error(translateAuthError(smsError, { channel: 'phone' }))
      }
    }

    trackOtpSend('phone', phone)
    return {
      user: profileToUser({
        id: pendingUserId || 'pending-phone-signup',
        email,
        phone,
      }),
      token: '',
      requiresEmailConfirmation: false,
      requiresPhoneConfirmation: true,
      identityChecked: true,
      pendingUserId,
      verificationMethod: 'phone',
      email,
      phone,
      resumedSignup: true,
    }
  }

  function isResumeBlockerMessage(message = '') {
    // Only treat confirmed-account signals as terminal. Do NOT map "user not found"
    // / "aucun compte" to ALREADY_REGISTERED — that traps unfinished SMS signups.
    return (
      message === 'ALREADY_REGISTERED' ||
      /déjà enregistr|already registered|already exists|phone_exists|email_exists/i.test(
        message,
      )
    )
  }

  function emailRedirectTo() {
    return getEmailRedirectUrl() || undefined
  }

  function isTransientRpcFailure(error) {
    const message = String(error?.message || error || '').toLowerCase()
    const cause = String(error?.cause?.message || error?.cause?.code || '').toLowerCase()
    const combined = `${message} ${cause}`
    return (
      combined.includes('fetch failed') ||
      combined.includes('failed to fetch') ||
      combined.includes('network') ||
      combined.includes('timeout') ||
      combined.includes('econnreset') ||
      combined.includes('connecttimeout') ||
      combined.includes('und_err_connect_timeout') ||
      combined.includes('socket hang up')
    )
  }

  function identityCacheKey(kind, value, userId = null) {
    return `${kind}:${value}:${userId || ''}`
  }

  function readIdentityCache(kind, value, userId = null) {
    const key = identityCacheKey(kind, value, userId)
    const hit = identityAvailabilityCache.get(key)
    if (!hit) return null
    if (hit.expiresAt <= Date.now()) {
      identityAvailabilityCache.delete(key)
      return null
    }
    return hit.result
  }

  function writeIdentityCache(kind, value, userId, result) {
    identityAvailabilityCache.set(identityCacheKey(kind, value, userId), {
      result,
      expiresAt: Date.now() + IDENTITY_CACHE_TTL_MS,
    })
  }

  async function checkIdentityAvailability(kind, value, userId = null, { useCache = true } = {}) {
    if (!supabase || !value) return { available: true, reason: null }

    const key = identityCacheKey(kind, value, userId)
    if (useCache) {
      const cached = readIdentityCache(kind, value, userId)
      if (cached) return cached
    }
    // Always coalesce in-flight checks (even when bypassing cache) to avoid stampedes.
    const inflight = identityAvailabilityInflight.get(key)
    if (inflight) return inflight

    const run = (async () => {
      let data = null
      let error = null
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          ;({ data, error } = await withTimeout(
            supabase.rpc('moxt_check_identity_available', {
              p_kind: kind,
              p_value: value,
              p_user_id: userId,
            }),
            AUTH_NETWORK_TIMEOUT_MS,
            'checkIdentity',
          ))
        } catch (timeoutError) {
          error = timeoutError
        }
        if (!error) break
        if (attempt === 0 && (isTransientRpcFailure(error) || isTimeoutError(error))) {
          await new Promise((resolve) => setTimeout(resolve, 400))
          continue
        }
        break
      }

      if (error) {
        const wrapped = new Error('IDENTITY_CHECK_UNAVAILABLE')
        wrapped.cause = error
        wrapped.code = error.code
        wrapped.status = error.status
        throw wrapped
      }

      // Fail closed: only an explicit available:true opens the OTP gate.
      if (!data || typeof data !== 'object' || typeof data.available !== 'boolean') {
        const wrapped = new Error('IDENTITY_CHECK_UNAVAILABLE')
        wrapped.cause = new Error('identity RPC payload invalide')
        throw wrapped
      }
      const result = {
        available: data.available === true,
        reason: data.reason || null,
      }
      writeIdentityCache(kind, value, userId, result)
      return result
    })()

    identityAvailabilityInflight.set(key, run)
    try {
      return await run
    } finally {
      identityAvailabilityInflight.delete(key)
    }
  }

  /** Warm identity cache from the register form (blur) so submit stays snappy. */
  async function prefetchRegistrationIdentities({ phone, email } = {}) {
    const tasks = []
    const normalizedPhone = phone ? normalizeRussianAuthPhone(phone) : ''
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (/^\+7\d{10}$/.test(normalizedPhone)) {
      tasks.push(
        checkIdentityAvailability('phone', normalizedPhone, null, { useCache: false }).catch(
          () => null,
        ),
      )
    }
    if (normalizedEmail.includes('@') && normalizedEmail.length >= 5) {
      tasks.push(
        checkIdentityAvailability('email', normalizedEmail, null, { useCache: false }).catch(
          () => null,
        ),
      )
    }
    if (!tasks.length) return { phone: null, email: null }
    await Promise.all(tasks)
    return {
      phone: normalizedPhone ? readIdentityCache('phone', normalizedPhone) : null,
      email: normalizedEmail ? readIdentityCache('email', normalizedEmail) : null,
    }
  }

  /**
   * Fresh phone + e-mail availability before OTP UI / SMS.
   * E-mail check = already linked to a live account or not (not e-mail confirmation).
   */
  async function assertRegistrationIdentitiesEligible(
    { phone, email } = {},
    { useCache = true } = {},
  ) {
    const normalizedPhone = phone ? normalizeRussianAuthPhone(phone) : ''
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (normalizedPhone && !/^\+7\d{10}$/.test(normalizedPhone)) {
      throw new Error('Numéro de téléphone invalide. Vérifiez le format (+7XXXXXXXXXX).')
    }
    if (normalizedEmail && (!normalizedEmail.includes('@') || normalizedEmail.length < 5)) {
      throw new Error("L'e-mail est obligatoire.")
    }

    const tasks = []
    if (normalizedPhone) {
      tasks.push(
        checkIdentityAvailability('phone', normalizedPhone, null, { useCache }).then((result) => ({
          kind: 'phone',
          result,
        })),
      )
    }
    if (normalizedEmail) {
      tasks.push(
        checkIdentityAvailability('email', normalizedEmail, null, { useCache }).then((result) => ({
          kind: 'email',
          result,
        })),
      )
    }
    if (!tasks.length) {
      throw new Error('Identifiants manquants.')
    }

    let results
    try {
      results = await Promise.all(tasks)
    } catch (error) {
      if (error?.message === 'IDENTITY_CHECK_UNAVAILABLE') {
        throw new Error(
          translateAuthError(
            { message: 'IDENTITY_CHECK_UNAVAILABLE' },
            { channel: 'phone', intent: 'register' },
          ),
        )
      }
      throw new Error(
        translateAuthError(error, { channel: 'phone', intent: 'register' }),
      )
    }
    for (const { kind, result } of results) {
      if (result.available) continue
      if (result.reason === 'limit') {
        throw new Error('IDENTITY_LIMIT_REACHED')
      }
      if (kind === 'phone') {
        throw new Error('ALREADY_REGISTERED')
      }
      throw new Error(
        translateAuthError({ message: 'MOXT_IDENTITY_ACTIVE' }, { channel: 'email' }),
      )
    }
    return true
  }

  /** @deprecated prefer assertRegistrationIdentitiesEligible */
  async function assertPhoneEligibleForRegistrationOtp(phone) {
    return assertRegistrationIdentitiesEligible({ phone })
  }

  async function assertIdentityAvailable(kind, value, userId = null, context = {}) {
    let availability
    try {
      availability = await checkIdentityAvailability(kind, value, userId)
    } catch (error) {
      if (error?.message === 'IDENTITY_CHECK_UNAVAILABLE') {
        throw new Error(
          translateAuthError(
            {
              message: 'IDENTITY_CHECK_UNAVAILABLE',
              code: error.code,
              status: error.status,
            },
            context,
          ),
        )
      }
      throw error
    }

    if (availability.available) return

    if (availability.reason === 'limit') {
      throw new Error('IDENTITY_LIMIT_REACHED')
    }
    // reason 'active' | 'unavailable' (anti-énumération anon) → compte déjà pris
    throw new Error(
      translateAuthError(
        { message: 'MOXT_IDENTITY_ACTIVE' },
        { ...context, channel: kind === 'phone' ? 'phone' : 'email' },
      ),
    )
  }

  async function getAuthenticatedAuthUser(context = { channel: 'phone' }) {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      throw new Error(
        translateAuthError(error, {
          ...context,
          intent: context.intent || 'otp_verify',
        }),
      )
    }
    if (!data?.user) {
      throw new Error(
        translateAuthError(
          { message: 'MOXT_SESSION_REQUIRED' },
          { ...context, intent: context.intent || 'otp_verify' },
        ),
      )
    }
    return data.user
  }

  async function establishAuthSession(session, context = { channel: 'phone' }) {
    if (!session?.access_token || !session?.refresh_token) {
      throw new Error(
        translateAuthError(
          { message: 'MOXT_SESSION_REQUIRED' },
          { ...context, intent: context.intent || 'otp_verify' },
        ),
      )
    }
    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
    if (error) {
      throw new Error(
        translateAuthError(error, {
          ...context,
          intent: context.intent || 'otp_verify',
        }),
      )
    }
    if (!data?.session?.user) {
      throw new Error(
        translateAuthError(
          { message: 'MOXT_SESSION_REQUIRED' },
          { ...context, intent: context.intent || 'otp_verify' },
        ),
      )
    }
    return data.session
  }

  function mergeRegistrationProfileFields(authUser, profileFields, overrides = {}) {
    const pending = pendingRegistrationToProfileFields(
      resolvePendingRegistrationForUser(authUser, loadPendingRegistration()),
    )
    const merged = { ...profileFields }
    const firstName = trimOrEmpty(overrides.firstName || pending?.first_name)
    const lastName = trimOrEmpty(overrides.lastName || pending?.last_name)
    const email = trimOrEmpty(overrides.email || pending?.email).toLowerCase()
    const originPhone = trimOrEmpty(overrides.originPhone || pending?.origin_phone)
    const originCountry = trimOrEmpty(overrides.originCountry || pending?.origin_country)
    const city = trimOrEmpty(overrides.residenceCity || overrides.city || pending?.city)
    const avatarUrl = trimOrEmpty(overrides.avatarUrl || pending?.avatar_url)

    if (firstName) merged.first_name = firstName
    if (lastName) merged.last_name = lastName
    if (email) merged.email = email
    if (originPhone) merged.origin_phone = originPhone
    if (originCountry) merged.origin_country = originCountry
    if (city) merged.city = city
    if (avatarUrl) merged.avatar_url = avatarUrl

    const metadata = authUser?.user_metadata || {}
    if (!merged.first_name) {
      merged.first_name =
        metadata.first_name || metadata.firstName || merged.first_name || 'Utilisateur'
    }
    if (!merged.last_name) {
      merged.last_name = metadata.last_name || metadata.lastName || merged.last_name || ''
    }
    if (!merged.email) {
      merged.email = trimOrEmpty(authUser?.email || metadata.email || merged.email).toLowerCase()
    }
    if (!merged.origin_phone) {
      merged.origin_phone = metadata.origin_phone || merged.origin_phone || ''
    }
    if (!merged.origin_country) {
      merged.origin_country = metadata.origin_country || merged.origin_country || 'BJ'
    }
    if (!merged.city) merged.city = metadata.city || merged.city || ''
    if (!merged.avatar_url) {
      merged.avatar_url = metadata.avatar_url || metadata.picture || merged.avatar_url || ''
    }

    return sanitizeProfileWriteFields(merged)
  }

  function isValidAuthPhone(value = '') {
    return /^\+7\d{10}$/.test(normalizeRussianAuthPhone(value))
  }

  function authUserHasPhoneSignup(authUser) {
    return Boolean(
      authUser?.identities?.some(
        (identity) => identity.provider === 'phone' || identity.provider === 'sms',
      ),
    )
  }

  function resolvePhoneVerificationOtpType(authUser, normalizedPhone) {
    const authPhone = isValidAuthPhone(authUser?.phone)
      ? normalizeRussianAuthPhone(authUser.phone)
      : ''

    if (authUser?.phone_confirmed_at && authPhone === normalizedPhone) {
      return null
    }

    if (!authPhone || authPhone !== normalizedPhone) {
      return 'phone_change'
    }

    if (authUserHasPhoneSignup(authUser)) {
      return 'sms'
    }

    return 'phone_change'
  }

  async function syncAuthProfileMetadata(authUser, currentUser, normalizedPhone) {
    const metadata = authUser?.user_metadata || {}
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: currentUser.firstName || metadata.first_name || '',
        last_name: currentUser.lastName || metadata.last_name || '',
        phone: normalizedPhone,
        origin_phone: currentUser.secondaryPhone || metadata.origin_phone || '',
        origin_country: currentUser.originCountry || metadata.origin_country || 'BJ',
        city: currentUser.city || metadata.city || '',
        avatar_url: currentUser.avatarUrl || metadata.avatar_url || '',
      },
    })
    if (error) {
      console.warn(
        '[MOXT] Métadonnées Auth non synchronisées après vérif. téléphone:',
        error.message,
      )
    }
  }

  async function syncEmailVerifiedFromAuth(authUser, userId) {
    if (!authUser?.email_confirmed_at) return null
    const email = String(authUser.email || '').trim().toLowerCase()
    if (!email.includes('@')) return null

    const existing = await fetchProfile(userId)
    if (existing && String(existing.email || '').toLowerCase() === email) {
      return enrichUserFromAuth(existing, authUser)
    }

    await patchProfileFields(
      userId,
      { email },
      { authUser },
    )
    const refreshed = await fetchProfile(userId)
    return refreshed ? enrichUserFromAuth(refreshed, authUser) : null
  }

  async function enrichUserFromAuth(user, authUser) {
    if (!user || !authUser) return user
    const email = String(authUser.email || user.email || '').trim()
    return {
      ...user,
      email,
      emailVerified: Boolean(authUser.email_confirmed_at) || user.emailVerified === true,
      emailVerifiedAt: authUser.email_confirmed_at || user.emailVerifiedAt || null,
    }
  }

  async function syncPhoneVerifiedFromAuth(authUser, userId) {
    if (!authUser?.phone_confirmed_at) return null
    const authPhone = normalizeRussianAuthPhone(authUser.phone || '')
    if (!/^\+7\d{10}$/.test(authPhone)) return null

    const existing = await fetchProfile(userId)
    if (
      existing?.phoneVerified &&
      normalizeRussianAuthPhone(existing.phone || '') === authPhone
    ) {
      return existing
    }

    // Incomplete signup profiles must go through moxt_finalize_phone_registration.
    // Marking phone_verified here races SIGNED_IN sync vs OTP confirm and causes
    // finishPhoneRegistration to skip finalize → bounce /dashboard → /register.
    if (existing && !isProfileComplete(existing)) {
      return existing
    }

    const now = new Date().toISOString()
    await patchProfileFields(
      userId,
      {
        phone: authPhone,
        phone_verified: true,
        phone_verified_at: existing?.phoneVerifiedAt || now,
      },
      { authUser },
    )
    return fetchProfile(userId)
  }

  function profileFieldsFromAuthUser(authUser, extras = {}) {
    const metadata = authUser?.user_metadata || {}
    const fullName = metadata.full_name || metadata.name || ''
    const nameParts = String(fullName).trim().split(/\s+/).filter(Boolean)
    const pending = pendingRegistrationToProfileFields(
      resolvePendingRegistrationForUser(authUser, extras.pendingRegistration),
    )
    const overrides = extras.profileOverrides || {}

    return sanitizeProfileWriteFields({
      first_name:
        overrides.first_name ||
        overrides.firstName ||
        pending?.first_name ||
        metadata.first_name ||
        metadata.firstName ||
        nameParts[0] ||
        'Utilisateur',
      last_name:
        overrides.last_name ??
        overrides.lastName ??
        pending?.last_name ??
        metadata.last_name ??
        metadata.lastName ??
        nameParts.slice(1).join(' ') ??
        '',
      email:
        trimOrEmpty(
          overrides.email || pending?.email || authUser?.email || metadata.email || '',
        ).toLowerCase() || '',
      phone: normalizeRussianAuthPhone(
        overrides.phone ||
          pending?.phone ||
          authUser?.phone ||
          metadata.phone ||
          '',
      ),
      origin_phone: trimOrEmpty(
        overrides.origin_phone ?? overrides.originPhone ?? pending?.origin_phone ?? metadata.origin_phone,
      ),
      country: 'RU',
      origin_country:
        overrides.origin_country ||
        overrides.originCountry ||
        pending?.origin_country ||
        metadata.origin_country ||
        'BJ',
      city: trimOrEmpty(overrides.city ?? overrides.residenceCity ?? pending?.city ?? metadata.city),
      avatar_url: trimOrEmpty(
        overrides.avatar_url ?? overrides.avatarUrl ?? pending?.avatar_url ?? metadata.avatar_url ?? metadata.picture,
      ),
      role: 'user',
      status: 'active',
    })
  }

  async function fetchOrCreateProfile(authUser, extras = {}) {
    const profileFields = profileFieldsFromAuthUser(authUser, extras)
    const existingProfile = await fetchProfile(authUser.id)

    if (existingProfile) {
      if (!isProfileComplete(existingProfile)) {
        await upsertProfile(authUser.id, {
          first_name: requireFirstName(profileFields.first_name || existingProfile.firstName),
          last_name: trimOrEmpty(profileFields.last_name || existingProfile.lastName),
          email: trimOrEmpty(profileFields.email || existingProfile.email),
          phone: profileFields.phone || existingProfile.phone,
          origin_phone: trimOrEmpty(profileFields.origin_phone || existingProfile.secondaryPhone),
          origin_country: profileFields.origin_country || existingProfile.originCountry,
          city: trimOrEmpty(profileFields.city || existingProfile.city),
          avatar_url: trimOrEmpty(profileFields.avatar_url || existingProfile.avatarUrl),
          country: profileFields.country || existingProfile.country,
          role: profileFields.role || existingProfile.role,
          status: existingProfile.status || profileFields.status,
        })
        const refreshed = await fetchProfile(authUser.id)
        if (refreshed) {
          const synced =
            (await syncPhoneVerifiedFromAuth(authUser, authUser.id)) ||
            (await syncEmailVerifiedFromAuth(authUser, authUser.id)) ||
            refreshed
          return enrichUserFromAuth(synced, authUser)
        }
      }
      const profile =
        (await syncPhoneVerifiedFromAuth(authUser, authUser.id)) ||
        (await syncEmailVerifiedFromAuth(authUser, authUser.id)) ||
        existingProfile
      return enrichUserFromAuth(profile, authUser)
    }

    await upsertProfile(authUser.id, profileFields)
    const created = profileToUser({ id: authUser.id, ...profileFields })
    const profile =
      (await syncPhoneVerifiedFromAuth(authUser, authUser.id)) ||
      (await syncEmailVerifiedFromAuth(authUser, authUser.id)) ||
      created
    return enrichUserFromAuth(profile, authUser)
  }

  /** Session restore: never auto-create profile for confirmed users (DB wipe orphan detection). */
  async function resolveEstablishedSessionUser(authUser, extras = {}) {
    const existingProfile = await fetchProfile(authUser.id)
    if (existingProfile) {
      const profile =
        (await syncPhoneVerifiedFromAuth(authUser, authUser.id)) ||
        (await syncEmailVerifiedFromAuth(authUser, authUser.id)) ||
        existingProfile
      return enrichUserFromAuth(profile, authUser)
    }

    if (isAuthUserConfirmed(authUser)) {
      const error = new Error(ORPHAN_SESSION_ERROR)
      error.code = ORPHAN_SESSION_ERROR
      throw error
    }

    return fetchOrCreateProfile(authUser, extras)
  }

  async function invalidateOrphanSession() {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
  }

  return {
    prefetchRegistrationIdentities,
    assertRegistrationIdentitiesEligible,
    assertPhoneEligibleForRegistrationOtp,

    async login({ identifier, email, password }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const loginIdentifier = (identifier || email || '').trim()
      const isEmail = loginIdentifier.includes('@')
      const channel = isEmail ? 'email' : 'phone'
      let data
      try {
        const result = await withTimeout(
          isEmail
            ? supabase.auth.signInWithPassword({
                email: loginIdentifier.toLowerCase(),
                password,
              })
            : signInWithPhoneFallback(normalizeRussianAuthPhone(loginIdentifier), password),
          AUTH_LOGIN_TIMEOUT_MS,
          'signIn',
        )
        data = result.data
        if (result.error) {
          throw new Error(translateAuthError(result.error, { channel }))
        }
      } catch (error) {
        if (isTimeoutError(error)) {
          throw new Error(
            'La connexion met trop de temps. Vérifiez votre réseau puis réessayez.',
          )
        }
        throw error
      }
      if (!data?.session || !data?.user) {
        throw new Error('Connexion impossible. Vérifiez vos identifiants.')
      }
      try {
        const user = await withTimeout(
          fetchOrCreateProfile(data.user, {
            pendingRegistration: loadPendingRegistration(),
          }),
          AUTH_NETWORK_TIMEOUT_MS,
          'fetchOrCreateProfile',
        )
        return { user, token: data.session.access_token }
      } catch (error) {
        if (isTimeoutError(error)) {
          throw new Error(
            'Profil indisponible pour le moment. Réessayez dans quelques instants.',
          )
        }
        throw error
      }
    },

    async completeOAuthProfile(details) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData.session?.user
      if (!authUser) throw new Error('Session expirée. Reconnectez-vous pour compléter votre profil.')

      const profileFields = {
        first_name: details.firstName.trim(),
        last_name: details.lastName.trim(),
        phone: normalizeRussianAuthPhone(details.russianPhone),
        origin_phone: details.originPhone?.trim() || '',
        country: 'RU',
        origin_country: details.originCountry,
        city: details.residenceCity?.trim() || '',
        avatar_url: details.avatarUrl?.trim() || authUser.user_metadata?.picture || authUser.user_metadata?.avatar_url || '',
        role: 'user',
        status: 'active',
        updated_at: new Date().toISOString(),
      }

      const normalizedPhone = normalizeRussianAuthPhone(details.russianPhone)
      const resolvedEmail = String(
        details.email || authUser.email || authUser.user_metadata?.email || '',
      )
        .trim()
        .toLowerCase()

      await upsertProfile(authUser.id, {
        ...profileFields,
        email: resolvedEmail,
        phone: normalizedPhone,
        phone_verified: false,
        phone_verified_at: null,
      })

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          first_name: profileFields.first_name,
          last_name: profileFields.last_name,
          origin_country: profileFields.origin_country,
          city: profileFields.city,
          phone: profileFields.phone,
          origin_phone: profileFields.origin_phone,
          avatar_url: profileFields.avatar_url,
        },
      })
      if (metadataError) {
        console.warn('[MOXT] Métadonnées profil non mises à jour:', metadataError.message)
      }

      const user = await fetchProfile(authUser.id)
      if (!user) throw new Error('Impossible de charger le profil après complétion.')
      return { user, token: sessionData.session.access_token }
    },

    async register(details) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const email = String(details.email || '').trim().toLowerCase()

      if (!email) {
        throw new Error("L'e-mail est obligatoire.")
      }

      const normalizedPhone = normalizeRussianAuthPhone(details.russianPhone)

      // Collapse double-click / double-dispatch into one SMS send.
      return withOtpInFlight('phone', normalizedPhone, async () => {
        const profileFields = {
          first_name: details.firstName.trim(),
          last_name: details.lastName.trim(),
          email,
          phone: normalizedPhone,
          origin_phone: details.originPhone?.trim() || '',
          country: 'RU',
          origin_country: details.originCountry,
          city: details.residenceCity?.trim() || '',
          avatar_url: details.avatarUrl?.trim() || '',
          role: 'user',
          status: 'active',
        }

        const credentials = {
          phone: normalizedPhone,
          password: details.password,
          options: { channel: 'sms', data: profileFields },
        }

        // OTP page only if phone valid+free, email free, and identity RPC reachable.
        // Fresh check on submit (no stale prefetch) — network/RPC failure blocks OTP.
        await assertRegistrationIdentitiesEligible(
          {
            phone: normalizedPhone,
            email,
          },
          { useCache: false },
        )

        // Guard before provider send — one code at a time, max 4 / 3h.
        guardOtpSend('phone', normalizedPhone)

        let data
        let error
        // Auth (Cloudflare) can briefly connect-timeout on VPN — one retry helps.
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            ;({ data, error } = await withTimeout(
              supabase.auth.signUp(credentials),
              AUTH_OTP_SEND_TIMEOUT_MS,
              'signUp',
            ))
          } catch (timeoutError) {
            if (isTimeoutError(timeoutError)) {
              throw new Error(
                'La création du compte prend trop de temps. Réessayez (VPN ou réseau lent).',
              )
            }
            const transient = isTransientRpcFailure(timeoutError)
            if (attempt === 0 && transient) {
              console.warn('[MOXT] signUp réseau, nouvelle tentative…', timeoutError?.message)
              await new Promise((resolve) => setTimeout(resolve, 800))
              continue
            }
            throw new Error(
              translateAuthError(timeoutError, { channel: 'phone', intent: 'register' }),
            )
          }
          if (error && attempt === 0 && isTransientRpcFailure(error)) {
            console.warn('[MOXT] signUp erreur réseau, nouvelle tentative…', error?.message)
            await new Promise((resolve) => setTimeout(resolve, 800))
            continue
          }
          break
        }
        if (error) {
          if (isSmsNumberProviderDenied(error)) {
            throw new Error(SMS_NUMBER_PROVIDER_DENIED)
          }
          if (isAuthAlreadyExistsError(error)) {
            try {
              return await resumePhoneSignup(normalizedPhone, email, null)
            } catch (resumeError) {
              const resumeMessage = String(resumeError?.message || resumeError || '')
              if (isResumeBlockerMessage(resumeMessage)) {
                throw new Error('ALREADY_REGISTERED')
              }
              if (isSmsNumberProviderDenied(resumeError) || resumeMessage === SMS_NUMBER_PROVIDER_DENIED) {
                throw new Error(SMS_NUMBER_PROVIDER_DENIED)
              }
              throw resumeError instanceof Error ? resumeError : new Error(resumeMessage)
            }
          }
          const translated = translateAuthError(error, { channel: 'phone', intent: 'register' })
          if (isSmsNumberProviderDenied(translated) || isSmsNumberProviderDenied(error)) {
            throw new Error(SMS_NUMBER_PROVIDER_DENIED)
          }
          throw new Error(translated)
        }

        // Supabase anti-enumeration: duplicate email/phone returns identities: [].
        // Do not treat a missing/undefined identities field as a duplicate — phone
        // signup responses often omit identities when confirmation is pending.
        // Anti-enumeration responses do not send SMS; resumePhoneSignup sends the one OTP.
        if (
          data.user &&
          !data.session &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          try {
            return await resumePhoneSignup(normalizedPhone, email, data.user.id || null)
          } catch (resumeError) {
            const resumeMessage = String(resumeError?.message || resumeError || '')
            if (isResumeBlockerMessage(resumeMessage)) {
              throw new Error('ALREADY_REGISTERED')
            }
            throw resumeError instanceof Error ? resumeError : new Error(resumeMessage)
          }
        }
        if (!data.user) throw new Error('Échec de création du compte.')

        trackOtpSend('phone', normalizedPhone)

        if (data.session) {
          try {
            await withTimeout(supabase.auth.signOut(), AUTH_NETWORK_TIMEOUT_MS, 'signOut')
          } catch {
            // Session locale — ne bloque pas l’écran OTP.
          }
        }

        const user = profileToUser({ id: data.user.id, ...profileFields })
        return {
          user,
          token: '',
          requiresEmailConfirmation: false,
          requiresPhoneConfirmation: true,
          identityChecked: true,
          pendingUserId: data.user.id,
          verificationMethod: 'phone',
          email,
          phone: normalizedPhone,
        }
      })
    },

    async registerWithEmailAfterSmsDenied(details) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const email = String(details.email || '').trim().toLowerCase()
      if (!email) throw new Error("L'e-mail est obligatoire.")
      const normalizedPhone = normalizeRussianAuthPhone(details.russianPhone)

      return withOtpInFlight('email', email, async () => {
        const profileFields = {
          first_name: details.firstName.trim(),
          last_name: details.lastName.trim(),
          email,
          phone: normalizedPhone,
          origin_phone: details.originPhone?.trim() || '',
          country: 'RU',
          origin_country: details.originCountry,
          city: details.residenceCity?.trim() || '',
          avatar_url: details.avatarUrl?.trim() || '',
          role: 'user',
          status: 'active',
          registration_via: details.registrationVia || 'email_after_sms_denied',
        }

        await assertRegistrationIdentitiesEligible(
          details.skipPhoneEligibilityCheck
            ? { email }
            : { phone: normalizedPhone, email },
          { useCache: false },
        )
        guardOtpSend('email', email)

        const redirectTo = emailRedirectTo()
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email,
            password: details.password,
            options: {
              data: profileFields,
              ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
            },
          }),
          AUTH_OTP_SEND_TIMEOUT_MS,
          'signUpEmail',
        )

        if (error) {
          if (isAuthAlreadyExistsError(error)) {
            throw new Error('ALREADY_REGISTERED')
          }
          throw new Error(translateAuthError(error, { channel: 'email', intent: 'register' }))
        }
        if (
          data.user &&
          !data.session &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          throw new Error('ALREADY_REGISTERED')
        }
        if (!data.user) throw new Error('Échec de création du compte.')

        trackOtpSend('email', email)

        if (data.session) {
          try {
            await withTimeout(supabase.auth.signOut(), AUTH_NETWORK_TIMEOUT_MS, 'signOut')
          } catch {
            // ignore
          }
        }

        return {
          user: profileToUser({ id: data.user.id, ...profileFields }),
          token: '',
          requiresEmailConfirmation: true,
          requiresPhoneConfirmation: false,
          identityChecked: true,
          pendingUserId: data.user.id,
          verificationMethod: 'email',
          email,
          phone: normalizedPhone,
        }
      })
    },

    async verifyEmailRegistration({ email, token, profileDetails }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const normalizedEmail = email.trim().toLowerCase()
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: token.trim(),
        type: 'signup',
      })
      if (error) throw new Error(translateAuthError(error, { channel: 'email', intent: 'otp_verify' }))
      if (!data.session || !data.user) {
        throw new Error("Le code est invalide ou a expiré. Recommencez l'inscription.")
      }
      const session = await establishAuthSession(data.session, { channel: 'email' })
      const pending = loadPendingRegistration() || {}
      const meta = session.user.user_metadata || {}
      const phone = normalizeRussianAuthPhone(
        profileDetails?.russianPhone ||
          pending.phone ||
          meta.phone ||
          '',
      )

      const finalizePayload = {
        p_first_name:
          profileDetails?.firstName || pending.firstName || meta.first_name || null,
        p_last_name: profileDetails?.lastName || pending.lastName || meta.last_name || null,
        p_email: normalizedEmail,
        p_phone: phone || null,
        p_origin_phone:
          profileDetails?.originPhone || pending.originPhone || meta.origin_phone || null,
        p_origin_country:
          profileDetails?.originCountry ||
          pending.originCountry ||
          meta.origin_country ||
          null,
        p_city: profileDetails?.residenceCity || pending.residenceCity || meta.city || null,
        p_avatar_url: profileDetails?.avatarUrl || pending.avatarUrl || meta.avatar_url || null,
      }

      const { data: finalized, error: finalizeError } = await supabase.rpc(
        'moxt_finalize_email_registration',
        finalizePayload,
      )
      if (finalizeError || !finalized?.id) {
        throw new Error(
          translateAuthError(
            { message: finalizeError?.message || 'MOXT_FINALIZE_FAILED' },
            { channel: 'email', intent: 'otp_verify' },
          ),
        )
      }

      const user = await enrichUserFromAuth(profileToUser(finalized), session.user)
      return {
        user,
        token: session.access_token,
        emailVerified: true,
        phoneVerified: Boolean(user.phoneVerified),
        nextVerification: user.phoneVerified ? null : 'phone',
        phoneLinkDeferred: !user.phoneVerified,
      }
    },

    async verifyPhoneRegistration({ phone, token, email, profileDetails }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const normalizedPhone = normalizeRussianAuthPhone(phone)
      const otpToken = token.trim()
      const verifyContext = { channel: 'phone', intent: 'otp_verify' }

      async function finishPhoneRegistration(authUser, accessToken) {
        const linkedEmail = String(email || profileDetails?.email || '').trim().toLowerCase()
        // Already-verified AND complete: never rewrite PII from a registration form
        // (blocks overwrite if an OTP somehow reached an existing account).
        // Incomplete + phoneVerified (SIGNED_IN race) must still finalize blanks.
        const existingProfile = await fetchProfile(authUser.id)
        if (existingProfile?.phoneVerified && isProfileComplete(existingProfile)) {
          return {
            user: await enrichUserFromAuth(existingProfile, authUser),
            token: accessToken,
            emailLinkDeferred: Boolean(linkedEmail && !authUser.email_confirmed_at),
            phoneVerified: true,
            nextVerification: 'email',
          }
        }

        const profileFields = mergeRegistrationProfileFields(
          authUser,
          profileFieldsFromAuthUser(authUser, { pendingRegistration: loadPendingRegistration() }),
          { ...profileDetails, email: linkedEmail || profileDetails?.email },
        )
        const confirmedPhone = normalizeRussianAuthPhone(
          authUser.phone || profileFields.phone || phone || '',
        )
        profileFields.phone = confirmedPhone

        const user = await persistVerifiedRegistrationProfile(authUser.id, profileFields)
        return {
          user,
          token: accessToken,
          emailLinkDeferred: Boolean(linkedEmail && !authUser.email_confirmed_at),
          phoneVerified: true,
          nextVerification: 'email',
        }
      }

      // Retry after a prior OTP success + profile failure: phone already confirmed, OTP spent.
      const { data: existingUserData } = await supabase.auth.getUser()
      const existingUser = existingUserData?.user
      if (
        existingUser?.phone_confirmed_at &&
        normalizeRussianAuthPhone(existingUser.phone || '') === normalizedPhone
      ) {
        const { data: existingSessionData } = await supabase.auth.getSession()
        const accessToken = existingSessionData?.session?.access_token || ''
        if (accessToken) {
          return finishPhoneRegistration(existingUser, accessToken)
        }
      }

      let data = null
      let error = null
      ;({ data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: otpToken,
        type: 'sms',
      }))
      // Some Auth paths issue phone signup OTPs under type "phone_change".
      if (error) {
        const retry = await supabase.auth.verifyOtp({
          phone: normalizedPhone,
          token: otpToken,
          type: 'phone_change',
        })
        if (!retry.error && retry.data?.session) {
          data = retry.data
          error = null
        }
      }
      if (error) throw new Error(translateAuthError(error, verifyContext))
      if (!data.session || !data.user) {
        throw new Error('Le code est invalide ou a expiré. Vérifiez les 6 chiffres ou renvoyez un code.')
      }

      const session = await establishAuthSession(data.session, {
        channel: 'phone',
        intent: 'otp_verify',
      })
      // Re-read Auth user after setSession so finalize sees a consistent JWT + phone_confirmed.
      const authUser = await getAuthenticatedAuthUser()
      if (
        normalizeRussianAuthPhone(authUser.phone || '') !== normalizedPhone ||
        !authUser.phone_confirmed_at
      ) {
        throw new Error(
          translateAuthError(
            { message: 'MOXT_PHONE_NOT_CONFIRMED' },
            verifyContext,
          ),
        )
      }

      // Do NOT call updateUser({ email }) here — that triggers a magic-link
      // confirmation email whose default redirect often lands on /register.
      // Profile stores the e-mail; in-app Security verifies it with OTP + redirectTo.
      return finishPhoneRegistration(authUser, session.access_token)
    },

    async resendPhoneRegistrationOtp(phone) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const normalizedPhone = normalizeRussianAuthPhone(phone)
      return withOtpInFlight('phone', normalizedPhone, async () => {
        guardOtpSend('phone', normalizedPhone)
        // Do not mark prefer_p1sms: renvoi reste sur SMSC (P1SMS dual-route en pause).
        const otpResult = await supabase.auth.signInWithOtp({
          phone: normalizedPhone,
          options: { channel: 'sms', shouldCreateUser: false },
        })
        if (otpResult.error) {
          const { error } = await supabase.auth.resend({
            type: 'sms',
            phone: normalizedPhone,
          })
          if (error) {
            throw new Error(translateAuthError(otpResult.error || error, { channel: 'phone' }))
          }
        }
        trackOtpSend('phone', normalizedPhone)
        return true
      })
    },

    async resendEmailRegistrationOtp(email) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const normalizedEmail = String(email || '').trim().toLowerCase()
      if (!normalizedEmail) {
        throw new Error("L'e-mail est obligatoire pour renvoyer le code.")
      }
      guardOtpSend('email', normalizedEmail)
      const redirectTo = emailRedirectTo()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      })
      if (error) throw new Error(translateAuthError(error, { channel: 'email' }))
      trackOtpSend('email', normalizedEmail)
      return true
    },

    async requestPhoneVerificationOtp(currentUser, phone) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const normalizedPhone = normalizeRussianAuthPhone(phone)
      if (!/^\+7\d{10}$/.test(normalizedPhone)) {
        throw new Error('Numéro de téléphone invalide. Vérifiez le format (+7XXXXXXXXXX).')
      }

      const authUser = await getAuthenticatedAuthUser()
      const phoneContext = { channel: 'phone', intent: 'phone_verification' }
      const syncedUser = await syncPhoneVerifiedFromAuth(authUser, currentUser.id)
      if (syncedUser && normalizeRussianAuthPhone(syncedUser.phone || '') === normalizedPhone) {
        return { phone: normalizedPhone, user: syncedUser }
      }

      const authPhone = isValidAuthPhone(authUser.phone)
        ? normalizeRussianAuthPhone(authUser.phone)
        : ''
      const otpType = resolvePhoneVerificationOtpType(authUser, normalizedPhone)
      if (!otpType) {
        return { phone: normalizedPhone, user: syncedUser }
      }

      if (authPhone === normalizedPhone) {
        guardOtpSend('phone', normalizedPhone)
        const { error } = await supabase.auth.resend({
          type: otpType,
          phone: normalizedPhone,
        })
        if (error) {
          throw new Error(translateAuthError(error, phoneContext))
        }
        trackOtpSend('phone', normalizedPhone)
        return { phone: normalizedPhone, otpType }
      }

      await assertIdentityAvailable('phone', normalizedPhone, currentUser.id, phoneContext)

      guardOtpSend('phone', normalizedPhone)
      const { error } = await supabase.auth.updateUser({ phone: normalizedPhone })
      if (error) throw new Error(translateAuthError(error, phoneContext))
      trackOtpSend('phone', normalizedPhone)
      return { phone: normalizedPhone, otpType: 'phone_change' }
    },

    async confirmPhoneVerification(currentUser, { phone, token, otpType }) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const normalizedPhone = normalizeRussianAuthPhone(phone)
      const phoneContext = { channel: 'phone', intent: 'phone_verification' }

      const authUser = await getAuthenticatedAuthUser()
      const syncedUser = await syncPhoneVerifiedFromAuth(authUser, currentUser.id)
      if (syncedUser && normalizeRussianAuthPhone(syncedUser.phone || '') === normalizedPhone) {
        return syncedUser
      }

      const verifyType =
        otpType === 'sms' || otpType === 'phone_change'
          ? otpType
          : resolvePhoneVerificationOtpType(authUser, normalizedPhone) || 'phone_change'
      const trimmedToken = String(token || '').trim()

      const verifyResult = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: trimmedToken,
        type: verifyType,
      })
      if (verifyResult.error) {
        throw new Error(translateAuthError(verifyResult.error, phoneContext))
      }

      const verifiedAuthUser = verifyResult.data?.user || authUser
      await syncAuthProfileMetadata(verifiedAuthUser, currentUser, normalizedPhone)

      const now = new Date().toISOString()
      await patchProfileFields(
        currentUser.id,
        {
          phone: normalizedPhone,
          phone_verified: true,
          phone_verified_at: now,
        },
        { authUser: verifiedAuthUser, currentUser },
      )
      const user = await fetchProfile(currentUser.id)
      if (!user) throw new Error('Impossible de charger le profil après vérification.')
      return user
    },

    async requestEmailVerificationOtp(currentUser, email) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const normalizedEmail = String(email || '').trim().toLowerCase()
      if (!normalizedEmail.includes('@')) {
        throw new Error('Adresse e-mail invalide.')
      }

      const authUser = await getAuthenticatedAuthUser()
      const syncedUser = await syncEmailVerifiedFromAuth(authUser, currentUser.id)
      if (
        syncedUser?.emailVerified &&
        String(syncedUser.email || '').toLowerCase() === normalizedEmail
      ) {
        return { email: normalizedEmail, user: syncedUser }
      }

      const authEmail = String(authUser.email || '').trim().toLowerCase()
      const profileEmail = String(currentUser.email || '').trim().toLowerCase()
      // Confirmation de l’e-mail déjà sur ce compte — ne pas le traiter comme « déjà pris ».
      const isOwnEmail =
        normalizedEmail === authEmail || normalizedEmail === profileEmail

      if (!isOwnEmail) {
        await assertIdentityAvailable('email', normalizedEmail, currentUser.id, {
          channel: 'email',
          intent: 'email_verification',
        })
      }

      const redirectTo = emailRedirectTo()
      const redirectOptions = redirectTo ? { emailRedirectTo: redirectTo } : undefined
      const sendContext = { channel: 'email', intent: 'email_verification' }

      function isEmailTakenError(error) {
        const code = String(error?.code || '')
        const msg = String(error?.message || '').toLowerCase()
        return (
          code === 'email_exists' ||
          msg.includes('already') ||
          msg.includes('exists') ||
          msg.includes('registered')
        )
      }

      async function sendOwnEmailOtp() {
        guardOtpSend('email', normalizedEmail)
        const signupAttempt = await supabase.auth.resend({
          type: 'signup',
          email: normalizedEmail,
          options: redirectOptions,
        })
        if (!signupAttempt.error) {
          trackOtpSend('email', normalizedEmail)
          return { email: normalizedEmail, otpType: 'signup' }
        }
        const changeAttempt = await supabase.auth.resend({
          type: 'email_change',
          email: normalizedEmail,
          options: redirectOptions,
        })
        if (!changeAttempt.error) {
          trackOtpSend('email', normalizedEmail)
          return { email: normalizedEmail, otpType: 'email_change' }
        }
        const otpAttempt = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            shouldCreateUser: false,
            ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
          },
        })
        if (otpAttempt.error) {
          throw new Error(
            translateAuthError(
              otpAttempt.error || changeAttempt.error || signupAttempt.error,
              sendContext,
            ),
          )
        }
        trackOtpSend('email', normalizedEmail)
        return { email: normalizedEmail, otpType: 'email' }
      }

      // Auth a déjà cet e-mail non confirmé → renvoyer le code (sans contrôle « déjà lié »).
      if (authEmail === normalizedEmail && !authUser.email_confirmed_at) {
        return sendOwnEmailOtp()
      }

      // Rattacher / changer l’e-mail (profil seul, ou nouvelle adresse).
      guardOtpSend('email', normalizedEmail)
      const { error } = await supabase.auth.updateUser(
        { email: normalizedEmail },
        redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      )
      if (error) {
        if (isOwnEmail && isEmailTakenError(error)) {
          return sendOwnEmailOtp()
        }
        throw new Error(translateAuthError(error, sendContext))
      }
      trackOtpSend('email', normalizedEmail)
      return { email: normalizedEmail, otpType: 'email_change' }
    },

    async confirmEmailVerification(currentUser, { email, token, otpType }) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const normalizedEmail = String(email || '').trim().toLowerCase()
      const emailContext = { channel: 'email', intent: 'otp_verify' }

      const authUser = await getAuthenticatedAuthUser()
      const syncedUser = await syncEmailVerifiedFromAuth(authUser, currentUser.id)
      if (
        syncedUser?.emailVerified &&
        String(syncedUser.email || '').toLowerCase() === normalizedEmail
      ) {
        return syncedUser
      }

      const type =
        otpType === 'signup' || otpType === 'email_change' || otpType === 'email'
          ? otpType
          : 'email_change'
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: String(token || '').trim(),
        type,
      })
      if (error) {
        throw new Error(translateAuthError(error, emailContext))
      }

      const verifiedAuthUser = data?.user || authUser
      const confirmedEmail = String(verifiedAuthUser?.email || normalizedEmail)
        .trim()
        .toLowerCase()

      await patchProfileFields(
        currentUser.id,
        { email: confirmedEmail },
        { authUser: verifiedAuthUser, currentUser },
      )
      const user = await fetchProfile(currentUser.id)
      if (!user) throw new Error('Impossible de charger le profil après vérification e-mail.')
      return enrichUserFromAuth(user, verifiedAuthUser)
    },

    async restoreSession() {
      if (!supabase) return null

      let session = null
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_NETWORK_TIMEOUT_MS,
          'getSession',
        )
        session = data.session
        if (!session) {
          const { data: refreshed } = await withTimeout(
            supabase.auth.refreshSession(),
            AUTH_NETWORK_TIMEOUT_MS,
            'refreshSession',
          )
          session = refreshed.session
        }
      } catch (error) {
        console.warn('[MOXT] Session Supabase indisponible au démarrage:', error?.message)
        return null
      }

      if (!session) return null

      // getUser() (réseau) — pas session.user local — pour email_confirmed_at à jour (Safari / autres onglets)
      let authUser = session.user
      try {
        authUser = await withTimeout(
          getAuthenticatedAuthUser(),
          AUTH_NETWORK_TIMEOUT_MS,
          'getUser',
        )
      } catch (error) {
        console.warn('[MOXT] getUser indisponible, fallback session.user:', error?.message)
      }

      try {
        const user = await withTimeout(
          resolveEstablishedSessionUser(authUser, {
            pendingRegistration: loadPendingRegistration(),
          }),
          AUTH_NETWORK_TIMEOUT_MS,
          'resolveEstablishedSessionUser',
        )
        return { user, token: session.access_token }
      } catch (profileError) {
        if (isOrphanSessionError(profileError)) {
          await invalidateOrphanSession()
          return null
        }
        console.warn('[MOXT] Profil indisponible, session conservée:', profileError?.message)
        const metadata = authUser.user_metadata || {}
        return {
          user: enrichUserFromAuth(
            profileToUser({
              id: authUser.id,
              first_name: metadata.first_name || 'Utilisateur',
              last_name: metadata.last_name || '',
              email: authUser.email || metadata.email || '',
              phone: authUser.phone || metadata.phone || '',
              origin_phone: metadata.origin_phone || '',
              country: 'RU',
              origin_country: metadata.origin_country || 'BJ',
              city: metadata.city || '',
              avatar_url: metadata.avatar_url || '',
              role: 'user',
              status: 'active',
            }),
            authUser,
          ),
          token: session.access_token,
        }
      }
    },

    async sessionFromSupabaseUser(session, { recreateMissingProfile = false } = {}) {
      if (!session?.user) return null
      let authUser = session.user
      try {
        authUser = await withTimeout(
          getAuthenticatedAuthUser(),
          AUTH_NETWORK_TIMEOUT_MS,
          'getUser',
        )
      } catch {
        // Conservé session.user si getUser échoue / timeout (hors-ligne, socket mort)
      }
      try {
        const extras = { pendingRegistration: loadPendingRegistration() }
        // Foreground refresh: recreate if needed — never hard-logout a live tab for a missing row.
        // Boot restore keeps orphan detection via resolveEstablishedSessionUser.
        const user = await withTimeout(
          recreateMissingProfile
            ? fetchOrCreateProfile(authUser, extras)
            : resolveEstablishedSessionUser(authUser, extras),
          AUTH_NETWORK_TIMEOUT_MS,
          'resolveProfile',
        )
        return { user, token: session.access_token }
      } catch (error) {
        if (isOrphanSessionError(error)) {
          await invalidateOrphanSession()
          return null
        }
        const metadata = authUser.user_metadata || {}
        return {
          user: enrichUserFromAuth(
            profileToUser({
              id: authUser.id,
              first_name: metadata.first_name || 'Utilisateur',
              last_name: metadata.last_name || '',
              email: authUser.email || metadata.email || '',
              phone: authUser.phone || metadata.phone || '',
              origin_phone: metadata.origin_phone || '',
              country: 'RU',
              origin_country: metadata.origin_country || 'BJ',
              city: metadata.city || '',
              avatar_url: metadata.avatar_url || '',
              role: 'user',
              status: 'active',
            }),
            authUser,
          ),
          token: session.access_token,
        }
      }
    },

    /** Recharge Auth (getUser) + profil — corrige emailVerified stale (Safari, magic link autre onglet). */
    async refreshAuthSession() {
      if (!supabase) return null
      let session = null
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_NETWORK_TIMEOUT_MS,
          'getSession',
        )
        session = data.session
        const expiresAt = Number(session?.expires_at)
        const accessExpiring =
          !session ||
          (Number.isFinite(expiresAt) &&
            expiresAt > 0 &&
            expiresAt * 1000 <= Date.now() + 60_000)
        // Safari idle: JWT often still in storage but expired — must refresh, not reuse.
        if (accessExpiring) {
          const { data: refreshed } = await withTimeout(
            supabase.auth.refreshSession(),
            AUTH_NETWORK_TIMEOUT_MS,
            'refreshSession',
          )
          if (refreshed?.session) {
            session = refreshed.session
          } else if (
            session &&
            Number.isFinite(expiresAt) &&
            expiresAt * 1000 > Date.now()
          ) {
            // Still within hard expiry — keep stored session after a failed refresh.
          } else {
            session = null
          }
        }
      } catch {
        return null
      }
      if (!session) return null
      return this.sessionFromSupabaseUser(session, { recreateMissingProfile: true })
    },

    async logout() {
      if (!supabase) return
      await supabase.auth.signOut()
    },

    async signOutOtherSessions() {
      if (!supabase) return
      const { error } = await supabase.auth.signOut({ scope: 'others' })
      if (error) throw new Error(error.message)
    },

    async requestPasswordChangeOtp(currentUser) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const authUser = await getAuthenticatedAuthUser()
      const email = String(authUser.email || currentUser?.email || '')
        .trim()
        .toLowerCase()
      if (!authUser.email_confirmed_at || !email.includes('@')) {
        throw new Error(
          'Confirmez votre adresse e-mail avant de modifier le mot de passe. Un code OTP sera envoyé à cette adresse.',
        )
      }
      guardOtpSend('email', email)
      const { error } = await supabase.auth.reauthenticate()
      if (error) throw new Error(translateAuthError(error, { channel: 'email', intent: 'password_change' }))
      trackOtpSend('email', email)
      return { email }
    },

    async updatePassword(newPassword, { nonce } = {}) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const password = String(newPassword || '').trim()
      if (password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
      }
      const otp = String(nonce || '').trim()
      if (!/^\d{6}$/.test(otp)) {
        throw new Error('Saisissez le code à 6 chiffres reçu par e-mail.')
      }
      const { error } = await supabase.auth.updateUser({ password, nonce: otp })
      if (error) throw new Error(translateAuthError(error, { channel: 'email', intent: 'password_change' }))
      return true
    },

    async requestPasswordReset(email) {
      if (!supabase) return true
      const normalizedEmail = String(email || '').trim().toLowerCase()
      if (normalizedEmail.includes('@')) {
        guardOtpSend('email', normalizedEmail)
      }
      const redirectTo = getPasswordResetRedirectUrl()
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: redirectTo || undefined,
      })
      if (error) throw new Error(translateAuthError(error, { channel: 'email' }))
      if (normalizedEmail.includes('@')) {
        trackOtpSend('email', normalizedEmail)
      }
      return true
    },

    async listMfaFactors() {
      if (!supabase) return { totp: [] }
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw new Error(error.message)
      return data || { totp: [] }
    },

    async enrollMfa() {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'MOXT Authenticator',
      })
      if (error) throw new Error(error.message)
      return data
    },

    async verifyMfaEnrollment({ factorId, challengeId, code }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: String(code || '').trim(),
      })
      if (error) throw new Error(error.message)
      return data
    },

    async challengeMfa(factorId) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data, error } = await supabase.auth.mfa.challenge({ factorId })
      if (error) throw new Error(error.message)
      return data
    },

    async unenrollMfa(factorId) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw new Error(error.message)
      return true
    },

    async requestAccountDeletion(userId, requestId) {
      if (!supabase || !userId) throw new Error('Session expirée.')
      const now = new Date().toISOString()
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'pending_deletion', updated_at: now })
        .eq('id', userId)
      if (profileError) throw new Error(profileError.message)

      const id = requestId || `DEL-${Date.now().toString(36).toUpperCase()}`
      const { error } = await supabase.from('account_deletion_requests').insert({
        id,
        user_id: userId,
        status: 'requested',
        created_at: now,
      })
      if (error) throw new Error(error.message)
      return { id, userId, status: 'requested', createdAt: now }
    },

    async cancelAccountDeletion(userId) {
      if (!supabase || !userId) throw new Error('Session expirée.')
      const now = new Date().toISOString()
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'active', updated_at: now })
        .eq('id', userId)
      if (profileError) throw new Error(profileError.message)

      const { data: rows } = await supabase
        .from('account_deletion_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'requested')
        .limit(1)

      if (rows?.[0]?.id) {
        const { error } = await supabase
          .from('account_deletion_requests')
          .update({ status: 'cancelled', cancelled_at: now })
          .eq('id', rows[0].id)
        if (error) throw new Error(error.message)
      }
      return true
    },

    async updateProfile(currentUser, details) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const nextPhone = details.phone?.trim() || ''
      const phoneChanged =
        normalizeRussianAuthPhone(nextPhone) !== normalizeRussianAuthPhone(currentUser.phone || '')
      const profileFields = {
        first_name: details.firstName.trim(),
        last_name: details.lastName.trim(),
        phone: nextPhone,
        origin_phone: details.secondaryPhone?.trim() || '',
        city: details.city?.trim() || '',
        origin_country: details.originCountry,
        avatar_url: details.avatarUrl?.trim() || '',
        updated_at: new Date().toISOString(),
      }
      if (phoneChanged) {
        profileFields.phone_verified = false
        profileFields.phone_verified_at = null
      }
      const { error } = await supabase.from('profiles').update(profileFields).eq('id', currentUser.id)
      if (error) throw new Error(error.message)
      const refreshed = await fetchProfile(currentUser.id)
      return refreshed || {
        ...currentUser,
        ...profileToUser({
          id: currentUser.id,
          ...profileFields,
          email: currentUser.email,
          role: currentUser.role,
          status: currentUser.status,
        }),
      }
    },
  }
}

export {
  normalizePhone,
  normalizeRussianAuthPhone,
  translateAuthError,
  isSmsNumberProviderDenied,
  SMS_NUMBER_PROVIDER_DENIED,
}
