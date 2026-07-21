import { isProfileComplete } from '@moxt/shared/auth/profileCompletion.js'
import { applySession, clearSession } from '../features/auth/authSlice'
import { authService } from '../features/auth/authService'
import { supabase } from './supabaseClient'
import { clearClientCache, hasSupabaseAuthInStorage } from './clearClientCache'
import {
  isRealtimeConnected,
  startRealtimeSubscription,
  stopRealtimeSubscription,
  syncRealtimeAuthToken,
} from './realtimeService'

let authSubscription = null
let visibilityHandler = null
let pageShowHandler = null
let keepaliveTimer = null
let retryTimer = null
let lastConversationRefresh = 0
let lastDataRefresh = 0
let lastAuthUserRefresh = 0
let lastProactiveRefresh = 0
let intentionalSignOutUntil = 0

const CONVERSATION_REFRESH_MS = 60000
/** Quand le realtime est live, espacer les refresh conversations (évite double charge). */
const CONVERSATION_REFRESH_WHEN_LIVE_MS = 5 * 60_000
const DATA_REFRESH_MS = 120000
/** Toujours assez court pour rattraper une confirmation e-mail faite hors onglet (Safari Mail). */
const AUTH_USER_REFRESH_MS = 4000
/**
 * Refresh access token this many seconds before expires_at.
 * Safari freezes timers in background — refresh early while the tab is still awake.
 */
const ACCESS_TOKEN_SKEW_SECONDS = 10 * 60
/** While tab is visible, check JWT freshness on this cadence (~JWT is 1h). */
const KEEPALIVE_MS = 45_000
const PROACTIVE_REFRESH_MIN_GAP_MS = 20_000
const SESSION_RESOLVE_TIMEOUT_MS = 15_000
const TRANSIENT_RETRY_MS = 5_000
/** Échecs « missing » consécutifs avant logout réel (évite faux positifs Safari). */
const MAX_CONSECUTIVE_SESSION_MISSES = 3
/** Délai après SIGNED_OUT parasite avant recovery. */
const SIGNED_OUT_RECOVERY_DELAY_MS = 600

let consecutiveSessionMisses = 0

function noteSessionRecovered() {
  consecutiveSessionMisses = 0
}

function noteSessionMiss() {
  consecutiveSessionMisses += 1
  return consecutiveSessionMisses
}

async function refreshConversationsIfNeeded(dispatch, getState) {
  if (!getState().auth.user) return
  const now = Date.now()
  const minGap = isRealtimeConnected()
    ? CONVERSATION_REFRESH_WHEN_LIVE_MS
    : CONVERSATION_REFRESH_MS
  if (now - lastConversationRefresh < minGap) return
  lastConversationRefresh = now
  const { refreshConversations } = await import('../features/communications/communicationSlice')
  dispatch(refreshConversations())
}

/** Focus : delta ciblé (transferts incrémentaux) — plus de mega loadAllData. */
async function refreshDataIfNeeded(dispatch, getState) {
  if (!getState().auth.user) return
  const now = Date.now()
  if (now - lastDataRefresh < DATA_REFRESH_MS) return
  lastDataRefresh = now
  const userId = getState().auth.user.id
  const { refreshVisibleTransfers } = await import('../features/transfers/transferSync')
  const business = (getState().businesses?.items || []).find(
    (item) => String(item.ownerId) === String(userId),
  )
  dispatch(refreshVisibleTransfers({ userId, businessId: business?.id }))
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

function isAccessTokenExpiring(session, skewSeconds = ACCESS_TOKEN_SKEW_SECONDS) {
  if (!session) return true
  const expiresAt = Number(session.expires_at)
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return false
  return expiresAt * 1000 <= Date.now() + skewSeconds * 1000
}

/** Refresh déjà consommé ailleurs — race multi-onglet / keepalive, pas une vraie déconnexion. */
function isRefreshRaceError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()
  return (
    code === 'refresh_token_already_used' ||
    message.includes('refresh_token_already_used') ||
    message.includes('already used')
  )
}

/**
 * Perte définitive de session (token refresh invalide / révoqué).
 * N’inclut PAS already_used (race) ni les timeouts réseau.
 */
function isDefinitiveSessionLoss(error) {
  if (!error || isRefreshRaceError(error)) return false
  const message = String(error?.message || error || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()
  return (
    code === 'refresh_token_not_found' ||
    code === 'session_not_found' ||
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('refresh_token_not_found') ||
    message.includes('session from session_id claim in jwt does not exist') ||
    (Number(error?.status) === 401 &&
      message.includes('refresh') &&
      !message.includes('already'))
  )
}

async function recoverSessionAfterRace() {
  await new Promise((resolve) => setTimeout(resolve, 400))
  try {
    const { data } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_RESOLVE_TIMEOUT_MS,
      'getSession',
    )
    if (data?.session) return { status: 'ok', session: data.session }
  } catch {
    // ignore
  }
  return { status: 'transient' }
}

/** Call before auth.signOut() so SIGNED_OUT is treated as intentional logout. */
export function markIntentionalSignOut(durationMs = 15_000) {
  intentionalSignOutUntil = Date.now() + durationMs
}

function isIntentionalSignOut() {
  return Date.now() < intentionalSignOutUntil
}

/**
 * Resolve Supabase session without treating Safari resume timeouts as logout.
 * @returns {{ status: 'ok', session: object } | { status: 'missing' } | { status: 'transient' }}
 */
async function resolveSupabaseSession() {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_RESOLVE_TIMEOUT_MS,
      'getSession',
    )
    if (error && isDefinitiveSessionLoss(error)) {
      return { status: 'missing' }
    }

    let session = data?.session ?? null

    // Safari suspends timers — access JWT often expired after ~1h idle.
    if (session && isAccessTokenExpiring(session)) {
      try {
        const { data: refreshed, error: refreshError } = await withTimeout(
          supabase.auth.refreshSession(),
          SESSION_RESOLVE_TIMEOUT_MS,
          'refreshSession',
        )
        if (refreshed?.session) {
          lastProactiveRefresh = Date.now()
          return { status: 'ok', session: refreshed.session }
        }
        if (isRefreshRaceError(refreshError)) {
          return recoverSessionAfterRace()
        }
        if (isDefinitiveSessionLoss(refreshError)) {
          return { status: 'missing' }
        }
        // Keep the stored session if refresh failed transiently and JWT not hard-expired.
        if (!isAccessTokenExpiring(session, 0)) {
          return { status: 'ok', session }
        }
        return { status: 'transient' }
      } catch {
        if (!isAccessTokenExpiring(session, 0)) {
          return { status: 'ok', session }
        }
        return { status: 'transient' }
      }
    }

    if (session) {
      return { status: 'ok', session }
    }

    try {
      const { data: refreshed, error: refreshError } = await withTimeout(
        supabase.auth.refreshSession(),
        SESSION_RESOLVE_TIMEOUT_MS,
        'refreshSession',
      )
      if (refreshed?.session) {
        lastProactiveRefresh = Date.now()
        return { status: 'ok', session: refreshed.session }
      }
      if (isRefreshRaceError(refreshError)) {
        return recoverSessionAfterRace()
      }
      if (isDefinitiveSessionLoss(refreshError)) {
        return { status: 'missing' }
      }
      // Pas d’erreur nette + pas de session : souvent storage vide après race —
      // si un token sb-* existe encore, traiter comme transient.
      if (!refreshError) {
        if (hasSupabaseAuthInStorage()) return { status: 'transient' }
        return { status: 'missing' }
      }
      return { status: 'transient' }
    } catch {
      return { status: 'transient' }
    }
  } catch {
    return { status: 'transient' }
  }
}

/**
 * Logout dur uniquement si la session est vraiment morte.
 * Conserve Redux + tokens tant qu’il reste un espoir de recovery.
 */
function shouldForceLogoutOnMissing() {
  if (hasSupabaseAuthInStorage()) return false
  return noteSessionMiss() >= MAX_CONSECUTIVE_SESSION_MISSES
}

function forceLogout(dispatch, reason) {
  consecutiveSessionMisses = 0
  stopRealtimeSubscription()
  dispatch(clearSession())
  clearClientCache({ scope: 'full', reason, preserveAuth: false })
}

function scheduleTransientRetry(dispatch, getState) {
  if (retryTimer || typeof window === 'undefined') return
  retryTimer = window.setTimeout(() => {
    retryTimer = null
    if (document.visibilityState !== 'visible') return
    if (!getState().auth.user) return
    void onForeground(dispatch, getState, { forceAuth: true })
  }, TRANSIENT_RETRY_MS)
}

async function applyTokenToStore(session, dispatch, getState) {
  if (!session?.access_token) return
  const current = getState().auth.user
  if (!current) return
  dispatch(
    applySession({
      user: current,
      token: session.access_token,
    }),
  )
  await syncRealtimeAuthToken()
}

async function syncSessionToStore(
  session,
  dispatch,
  getState,
  { skipDataLoad = false } = {},
) {
  if (!session) {
    // Ne jamais wipe sur session null ambiguë — laisser le caller décider.
    console.warn('[MOXT] syncSessionToStore: session absente, Redux conservé')
    return
  }

  const payload = await authService.sessionFromSupabaseUser(session)
  if (!payload) {
    // Profil orphelin confirmé seulement si plus aucun token local.
    if (!hasSupabaseAuthInStorage() && shouldForceLogoutOnMissing()) {
      forceLogout(dispatch, 'orphan-session')
    }
    return
  }

  noteSessionRecovered()
  const previousUser = getState().auth.user
  const previousUserId = previousUser?.id
  const authStatus = getState().auth.status

  // During login/OTP thunks, SIGNED_IN can race with a metadata stub (incomplete
  // firstName/phone). Applying it bounces PublicOnlyRoute → /register while
  // Supabase already has a real session. Let the thunk finish instead.
  if (authStatus === 'loading' && !isProfileComplete(payload.user) && !isProfileComplete(previousUser)) {
    return
  }

  // SIGNED_IN after OTP can resolve a stub profile after verifyPhoneRegistration
  // already stored a complete user — never downgrade completeness in Redux.
  const sessionPayload =
    previousUser?.id === payload.user?.id &&
    isProfileComplete(previousUser) &&
    !isProfileComplete(payload.user)
      ? { user: previousUser, token: payload.token }
      : payload
  dispatch(applySession(sessionPayload))

  void startRealtimeSubscription(payload.user.id, dispatch, getState)

  const onRegisterOtpStep =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/register')
  const onAuthCallback =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback')
  if (!skipDataLoad && payload.user.id !== previousUserId && !onRegisterOtpStep && !onAuthCallback) {
    const { loadAllData } = await import('../app/loadAllData')
    dispatch(loadAllData())
  }

  const { setNativePushUserId } = await import('../platform/pushNotifications')
  setNativePushUserId(payload.user.id)

  const preferences = getState().account.preferences?.[payload.user.id]
  if (preferences?.pushNotifications !== false) {
    const { isNative } = await import('../platform/capacitor')
    if (isNative) {
      const { initNativePushNotifications } = await import('../platform/pushNotifications')
      void initNativePushNotifications()
    } else {
      const { ensureWebPushSubscription } = await import('../platform/webPush')
      void ensureWebPushSubscription(payload.user.id)
    }
  }
}

/** Re-sync Auth user (email_confirmed_at) sans attendre le throttle loadAllData. */
async function refreshAuthUserIfNeeded(dispatch, getState, { force = false } = {}) {
  if (!getState().auth.user) return
  const now = Date.now()
  if (!force && now - lastAuthUserRefresh < AUTH_USER_REFRESH_MS) return
  lastAuthUserRefresh = now

  let payload = null
  try {
    payload = await authService.refreshAuthSession()
  } catch {
    // Erreur réseau / profil — conserver la session Redux.
    return
  }

  if (!payload) {
    // Null ambigu (timeout Safari, refresh en cours) : ne déconnecter
    // que si Supabase confirme l'absence ET plus de token local après plusieurs essais.
    const resolved = await resolveSupabaseSession()
    if (resolved.status === 'ok') {
      noteSessionRecovered()
      return
    }
    if (resolved.status === 'transient' || hasSupabaseAuthInStorage()) {
      scheduleTransientRetry(dispatch, getState)
      return
    }
    if (resolved.status === 'missing' && getState().auth.user && shouldForceLogoutOnMissing()) {
      forceLogout(dispatch, 'session-invalid')
    }
    return
  }

  noteSessionRecovered()
  const previousUser = getState().auth.user
  if (
    previousUser?.id === payload.user?.id &&
    isProfileComplete(previousUser) &&
    !isProfileComplete(payload.user)
  ) {
    return
  }
  dispatch(applySession(payload))
}

async function ensureFreshAccessToken(dispatch, getState) {
  if (!supabase || !getState().auth.user) return
  const now = Date.now()
  if (now - lastProactiveRefresh < PROACTIVE_REFRESH_MIN_GAP_MS) return

  try {
    const { data } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_RESOLVE_TIMEOUT_MS,
      'getSession',
    )
    const session = data?.session
    if (!session) return
    if (!isAccessTokenExpiring(session)) return

    const { data: refreshed, error } = await withTimeout(
      supabase.auth.refreshSession(),
      SESSION_RESOLVE_TIMEOUT_MS,
      'refreshSession',
    )
    if (refreshed?.session) {
      lastProactiveRefresh = Date.now()
      noteSessionRecovered()
      await applyTokenToStore(refreshed.session, dispatch, getState)
      return
    }
    if (isRefreshRaceError(error)) {
      const recovered = await recoverSessionAfterRace()
      if (recovered.status === 'ok') {
        lastProactiveRefresh = Date.now()
        noteSessionRecovered()
        await applyTokenToStore(recovered.session, dispatch, getState)
      }
      return
    }
    // Jamais de forceLogout ici — keepalive ne doit pas déconnecter.
    // Un JWT mort sans refresh valide sera retenté au prochain focus.
  } catch {
    // Keep session — retry on next keepalive / visibility.
  }
}

async function onForeground(dispatch, getState, { forceAuth = false } = {}) {
  try {
    const resolved = await resolveSupabaseSession()
    if (resolved.status === 'ok') {
      noteSessionRecovered()
      await syncRealtimeAuthToken()
      // Keep Redux access_token aligned after Safari resume refresh.
      if (resolved.session?.access_token) {
        await applyTokenToStore(resolved.session, dispatch, getState)
      }
      await refreshAuthUserIfNeeded(dispatch, getState, { force: forceAuth })
      await refreshDataIfNeeded(dispatch, getState)
      await refreshConversationsIfNeeded(dispatch, getState)
      return
    }

    if (resolved.status === 'transient' || hasSupabaseAuthInStorage()) {
      // iPhone Safari / race refresh : conserver Redux, retenter.
      scheduleTransientRetry(dispatch, getState)
      return
    }

    if (getState().auth.user && shouldForceLogoutOnMissing()) {
      forceLogout(dispatch, 'session-expired')
    } else if (getState().auth.user) {
      scheduleTransientRetry(dispatch, getState)
    }
  } catch {
    // Erreur réseau — conserver la session Redux en place.
  }
}

function startKeepalive(dispatch, getState) {
  if (typeof window === 'undefined' || keepaliveTimer) return
  keepaliveTimer = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return
    void ensureFreshAccessToken(dispatch, getState)
  }, KEEPALIVE_MS)
}

function stopKeepalive() {
  if (!keepaliveTimer) return
  clearInterval(keepaliveTimer)
  keepaliveTimer = null
}

/** Garde Redux aligné avec Supabase (refresh token, déconnexion, retour d'onglet). */
export function startAuthSessionSync(store) {
  if (!supabase || authSubscription) return

  const { dispatch, getState } = store

  // Rescue: email confirm links that land on Site URL (/ or /register) with hash tokens.
  if (typeof window !== 'undefined') {
    const { pathname, hash, search } = window.location
    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
    const queryParams = new URLSearchParams(search)
    const authType = hashParams.get('type') || queryParams.get('type') || ''
    const hasAccessToken = hashParams.has('access_token') || queryParams.has('code')
    const isEmailConfirmType = ['signup', 'email_change', 'email', 'magiclink'].includes(authType)
    if (
      hasAccessToken &&
      isEmailConfirmType &&
      !pathname.startsWith('/auth/callback') &&
      !pathname.startsWith('/reset-password')
    ) {
      window.location.replace(`/auth/callback?next=/security${hash || ''}`)
      return
    }
  }
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      // Intentional logout (button / RegisterPage) — clear immediately.
      if (isIntentionalSignOut()) {
        forceLogout(dispatch, 'signed-out')
        return
      }

      // Safari / supabase-js émettent souvent SIGNED_OUT après un refresh raté
      // (race / JWT ~1h). Ne JAMAIS wipe tant qu’on peut recovery.
      await new Promise((resolve) => setTimeout(resolve, SIGNED_OUT_RECOVERY_DELAY_MS))
      const resolved = await resolveSupabaseSession()
      if (resolved.status === 'ok') {
        noteSessionRecovered()
        await syncSessionToStore(resolved.session, dispatch, getState, { skipDataLoad: true })
        return
      }
      if (getState().auth.user) {
        console.warn('[MOXT] SIGNED_OUT ignoré (non intentionnel) — session Redux conservée')
        scheduleTransientRetry(dispatch, getState)
      }
      return
    }

    if (event === 'PASSWORD_RECOVERY') {
      if (!window.location.pathname.startsWith('/reset-password')) {
        const hash = window.location.hash || ''
        window.location.replace(`/reset-password${hash}`)
        return
      }
      if (session) {
        await syncSessionToStore(session, dispatch, getState)
      }
      return
    }

    // Email confirmation / magic-link: keep tokens on /auth/callback (never bounce to /register).
    if (
      session &&
      ['SIGNED_IN', 'USER_UPDATED'].includes(event) &&
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/auth/callback')
    ) {
      await syncSessionToStore(session, dispatch, getState, { skipDataLoad: true })
      return
    }

    if (event === 'TOKEN_REFRESHED' && session) {
      if (window.location.pathname.startsWith('/reset-password')) return
      lastProactiveRefresh = Date.now()
      noteSessionRecovered()
      await applyTokenToStore(session, dispatch, getState)
      return
    }

    if (session && ['INITIAL_SESSION', 'SIGNED_IN', 'USER_UPDATED'].includes(event)) {
      if (window.location.pathname.startsWith('/reset-password')) return
      await syncSessionToStore(session, dispatch, getState, {
        skipDataLoad: event === 'INITIAL_SESSION',
      })
    }
  })
  authSubscription = data.subscription

  visibilityHandler = () => {
    if (document.visibilityState !== 'visible') return
    void onForeground(dispatch, getState, { forceAuth: true })
  }
  document.addEventListener('visibilitychange', visibilityHandler)

  pageShowHandler = (event) => {
    // bfcache Safari : forcer un getUser frais au retour
    if (event.persisted) {
      void onForeground(dispatch, getState, { forceAuth: true })
    }
  }
  window.addEventListener('pageshow', pageShowHandler)

  startKeepalive(dispatch, getState)
  // Warm refresh shortly after boot while the tab is awake.
  void ensureFreshAccessToken(dispatch, getState)

  void import('../platform/capacitor').then(({ isNative }) => {
    if (!isNative) return
    void import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) void onForeground(dispatch, getState, { forceAuth: true })
      })
    })
  })
}

export function stopAuthSessionSync() {
  authSubscription?.unsubscribe()
  authSubscription = null
  stopKeepalive()
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
  }
  if (pageShowHandler) {
    window.removeEventListener('pageshow', pageShowHandler)
    pageShowHandler = null
  }
}

/** Exposition pour pull-to-refresh / soft remount. */
export async function softRefreshSession(store) {
  const { dispatch, getState } = store
  lastAuthUserRefresh = 0
  lastDataRefresh = 0
  lastProactiveRefresh = 0
  await onForeground(dispatch, getState, { forceAuth: true })
  const { loadAllData } = await import('../app/loadAllData')
  await dispatch(loadAllData())
}
