import { applySession, clearSession } from '../features/auth/authSlice'
import { authService } from '../features/auth/authService'
import { supabase } from './supabaseClient'
import { startRealtimeSubscription, stopRealtimeSubscription } from './realtimeService'

let authSubscription = null
let visibilityHandler = null
let lastConversationRefresh = 0
const CONVERSATION_REFRESH_MS = 15000

async function refreshConversationsIfNeeded(dispatch, getState) {
  if (!getState().auth.user) return
  const now = Date.now()
  if (now - lastConversationRefresh < CONVERSATION_REFRESH_MS) return
  lastConversationRefresh = now
  const { refreshConversations } = await import('../features/communications/communicationSlice')
  dispatch(refreshConversations())
}

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

  startRealtimeSubscription(payload.user.id, dispatch, getState)

  if (payload.user.id !== previousUserId) {
    const { loadAllData } = await import('../app/loadAllData')
    dispatch(loadAllData())
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
    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      if (sessionData.session) {
        await syncSessionToStore(sessionData.session, dispatch, getState)
        await refreshConversationsIfNeeded(dispatch, getState)
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
