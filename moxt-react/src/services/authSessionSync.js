import { applySession, clearSession } from '../features/auth/authSlice'
import { authService } from '../features/auth/authService'
import { supabase } from './supabaseClient'
import {
  reconnectRealtimeSubscription,
  startRealtimeSubscription,
  stopRealtimeSubscription,
} from './realtimeService'

let authSubscription = null
let visibilityHandler = null
let lastConversationRefresh = 0
let lastDataRefresh = 0
const CONVERSATION_REFRESH_MS = 15000
const DATA_REFRESH_MS = 30000

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

async function resolveSupabaseSession() {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session

  const { data: refreshed } = await supabase.auth.refreshSession()
  return refreshed.session ?? null
}

async function syncSessionToStore(session, dispatch, getState, { forceRealtime = false } = {}) {
  if (!session) {
    stopRealtimeSubscription()
    dispatch(clearSession())
    return
  }

  const payload = await authService.sessionFromSupabaseUser(session)
  if (!payload) {
    stopRealtimeSubscription()
    dispatch(clearSession())
    return
  }

  const previousUserId = getState().auth.user?.id
  dispatch(applySession(payload))

  if (forceRealtime) {
    await reconnectRealtimeSubscription(payload.user.id, dispatch, getState)
  } else {
    void startRealtimeSubscription(payload.user.id, dispatch, getState)
  }

  if (payload.user.id !== previousUserId) {
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
      const { refreshWebPushSubscription } = await import('../platform/webPush')
      void refreshWebPushSubscription(payload.user.id)
    }
  }
}

/** Garde Redux aligné avec Supabase (refresh token, déconnexion, retour d'onglet). */
export function startAuthSessionSync(store) {
  if (!supabase || authSubscription) return

  const { dispatch, getState } = store

  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      stopRealtimeSubscription()
      dispatch(clearSession())
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

    if (event === 'TOKEN_REFRESHED' && session) {
      if (window.location.pathname.startsWith('/reset-password')) return
      await syncSessionToStore(session, dispatch, getState, { forceRealtime: true })
      return
    }

    if (session && ['INITIAL_SESSION', 'SIGNED_IN', 'USER_UPDATED'].includes(event)) {
      if (window.location.pathname.startsWith('/reset-password')) return
      await syncSessionToStore(session, dispatch, getState)
    }
  })
  authSubscription = data.subscription

  visibilityHandler = () => {
    if (document.visibilityState !== 'visible') return

    void (async () => {
      try {
        const session = await resolveSupabaseSession()
        if (session) {
          await syncSessionToStore(session, dispatch, getState, { forceRealtime: true })
          await refreshDataIfNeeded(dispatch, getState)
          await refreshConversationsIfNeeded(dispatch, getState)
          return
        }

        if (getState().auth.user) {
          stopRealtimeSubscription()
          dispatch(clearSession())
        }
      } catch {
        // Erreur réseau — conserver la session Redux en place.
      }
    })()
  }
  document.addEventListener('visibilitychange', visibilityHandler)
}

export function stopAuthSessionSync() {
  authSubscription?.unsubscribe()
  authSubscription = null
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
  }
}
