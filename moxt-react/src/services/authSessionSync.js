import { applySession, clearSession } from '../features/auth/authSlice'
import { authService } from '../features/auth/authService'
import { supabase } from './supabaseClient'
import { startRealtimeSubscription, stopRealtimeSubscription } from './realtimeService'

let authSubscription = null
let visibilityHandler = null

async function syncSessionToStore(session, dispatch, getState) {
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

  if (payload.user.id !== previousUserId) {
    const { loadAllData } = await import('../app/loadAllData')
    dispatch(loadAllData())
    startRealtimeSubscription(payload.user.id, dispatch, getState)
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

    if (session && ['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
      await syncSessionToStore(session, dispatch, getState)
    }
  })
  authSubscription = data.subscription

  visibilityHandler = () => {
    if (document.visibilityState !== 'visible') return
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) {
        syncSessionToStore(sessionData.session, dispatch, getState)
      } else if (getState().auth.user) {
        stopRealtimeSubscription()
        dispatch(clearSession())
      }
    })
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
