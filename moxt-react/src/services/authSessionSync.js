import { isProfileComplete } from '@moxt/shared/auth/profileCompletion.js'
import { applySession, clearSession } from '../features/auth/authSlice'
import { authService } from '../features/auth/authService'
import { supabase } from './supabaseClient'
import { clearClientCache } from './clearClientCache'
import {
  startRealtimeSubscription,
  stopRealtimeSubscription,
  syncRealtimeAuthToken,
} from './realtimeService'

let authSubscription = null
let visibilityHandler = null
let pageShowHandler = null
let lastConversationRefresh = 0
let lastDataRefresh = 0
let lastAuthUserRefresh = 0
const CONVERSATION_REFRESH_MS = 60000
const DATA_REFRESH_MS = 120000
/** Toujours assez court pour rattraper une confirmation e-mail faite hors onglet (Safari Mail). */
const AUTH_USER_REFRESH_MS = 4000
/** Refresh access token this many seconds before expires_at. */
const ACCESS_TOKEN_SKEW_SECONDS = 60

async function refreshConversationsIfNeeded(dispatch, getState) {
  if (!getState().auth.user) return
  const now = Date.now()
  if (now - lastConversationRefresh < CONVERSATION_REFRESH_MS) return
  lastConversationRefresh = now
  const { refreshConversations } = await import('../features/communications/communicationSlice')
  dispatch(refreshConversations())
}

async function refreshDataIfNeeded(dispatch, getState) {
  if (!getState().auth.user) return
  const now = Date.now()
  if (now - lastDataRefresh < DATA_REFRESH_MS) return
  lastDataRefresh = now
  const { loadAllData } = await import('../app/loadAllData')
  dispatch(loadAllData())
}

const SESSION_RESOLVE_TIMEOUT_MS = 8000

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

function isDefinitiveSessionLoss(error) {
  const message = String(error?.message || error || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()
  return (
    code === 'refresh_token_not_found' ||
    code === 'session_not_found' ||
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('refresh_token_not_found') ||
    message.includes('session from session_id claim in jwt does not exist') ||
    (Number(error?.status) === 401 && message.includes('refresh'))
  )
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

    // Safari suspends timers — access JWT often expired after a few hours idle.
    if (session && isAccessTokenExpiring(session)) {
      try {
        const { data: refreshed, error: refreshError } = await withTimeout(
          supabase.auth.refreshSession(),
          SESSION_RESOLVE_TIMEOUT_MS,
          'refreshSession',
        )
        if (refreshed?.session) {
          return { status: 'ok', session: refreshed.session }
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
        return { status: 'ok', session: refreshed.session }
      }
      if (isDefinitiveSessionLoss(refreshError)) {
        return { status: 'missing' }
      }
      // Empty session + no definitive auth error: treat as logged out only when
      // refresh completed cleanly without a session (not a hang/timeout).
      if (!refreshError) {
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

function forceLogout(dispatch, reason) {
  stopRealtimeSubscription()
  dispatch(clearSession())
  clearClientCache({ scope: 'full', reason })
}

async function syncSessionToStore(
  session,
  dispatch,
  getState,
  { skipDataLoad = false } = {},
) {
  if (!session) {
    forceLogout(dispatch, 'session-missing')
    return
  }

  const payload = await authService.sessionFromSupabaseUser(session)
  if (!payload) {
    forceLogout(dispatch, 'orphan-session')
    return
  }

  const previousUser = getState().auth.user
  const previousUserId = previousUser?.id
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
    // que si Supabase confirme explicitement l'absence de session.
    const resolved = await resolveSupabaseSession()
    if (resolved.status === 'missing' && getState().auth.user) {
      forceLogout(dispatch, 'session-invalid')
    }
    return
  }
  dispatch(applySession(payload))
}

async function onForeground(dispatch, getState, { forceAuth = false } = {}) {
  try {
    const resolved = await resolveSupabaseSession()
    if (resolved.status === 'ok') {
      await syncRealtimeAuthToken()
      await refreshAuthUserIfNeeded(dispatch, getState, { force: forceAuth })
      await refreshDataIfNeeded(dispatch, getState)
      await refreshConversationsIfNeeded(dispatch, getState)
      return
    }

    if (resolved.status === 'transient') {
      // iPhone Safari: tab resume often times out getSession/refreshSession.
      // Keep Redux session; next successful refresh or SIGNED_OUT will reconcile.
      return
    }

    if (getState().auth.user) {
      forceLogout(dispatch, 'session-expired')
    }
  } catch {
    // Erreur réseau — conserver la session Redux en place.
  }
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
      forceLogout(dispatch, 'signed-out')
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
      await syncRealtimeAuthToken()
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
  await onForeground(dispatch, getState, { forceAuth: true })
  const { loadAllData } = await import('../app/loadAllData')
  await dispatch(loadAllData())
}
