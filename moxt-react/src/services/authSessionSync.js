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

async function resolveSupabaseSession() {
  try {
    const { data } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_RESOLVE_TIMEOUT_MS,
      'getSession',
    )
    if (data.session) return data.session

    const { data: refreshed } = await withTimeout(
      supabase.auth.refreshSession(),
      SESSION_RESOLVE_TIMEOUT_MS,
      'refreshSession',
    )
    return refreshed.session ?? null
  } catch {
    return null
  }
}

async function syncSessionToStore(
  session,
  dispatch,
  getState,
  { skipDataLoad = false } = {},
) {
  if (!session) {
    stopRealtimeSubscription()
    dispatch(clearSession())
    clearClientCache({ scope: 'full', reason: 'session-missing' })
    return
  }

  const payload = await authService.sessionFromSupabaseUser(session)
  if (!payload) {
    stopRealtimeSubscription()
    dispatch(clearSession())
    clearClientCache({ scope: 'full', reason: 'orphan-session' })
    return
  }

  const previousUserId = getState().auth.user?.id
  dispatch(applySession(payload))

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
    // Null ambigu (race getSession, refresh en cours) : ne déconnecter
    // que si Supabase n'a vraiment plus de session après retry.
    const session = await resolveSupabaseSession().catch(() => null)
    if (!session && getState().auth.user) {
      stopRealtimeSubscription()
      dispatch(clearSession())
      clearClientCache({ scope: 'full', reason: 'session-invalid' })
    }
    return
  }
  dispatch(applySession(payload))
}

async function onForeground(dispatch, getState, { forceAuth = false } = {}) {
  try {
    const session = await resolveSupabaseSession()
    if (session) {
      await syncRealtimeAuthToken()
      await refreshAuthUserIfNeeded(dispatch, getState, { force: forceAuth })
      await refreshDataIfNeeded(dispatch, getState)
      await refreshConversationsIfNeeded(dispatch, getState)
      return
    }

    if (getState().auth.user) {
      stopRealtimeSubscription()
      dispatch(clearSession())
      clearClientCache({ scope: 'full', reason: 'session-expired' })
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
      stopRealtimeSubscription()
      dispatch(clearSession())
      clearClientCache({ scope: 'full', reason: 'signed-out' })
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
