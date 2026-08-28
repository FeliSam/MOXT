import { applySession, clearSession } from '../features/auth/authSlice'
import { clearAuthBootstrapCache, writeAuthBootstrapCache } from '../services/authBootstrapCache'

function cachePayloadFromAction(action, state) {
  if (action.payload?.user?.id && action.payload?.token) {
    return { user: action.payload.user, token: action.payload.token }
  }
  if (action.payload?.id && state.auth?.token) {
    return { user: action.payload, token: state.auth.token }
  }
  return null
}

/** Persiste la session pour un démarrage instantané au prochain chargement. */
export const authBootstrapMiddleware = (store) => (next) => (action) => {
  const result = next(action)

  if (
    action.type === applySession.type ||
    action.type === 'auth/login/fulfilled' ||
    action.type === 'auth/restoreSession/fulfilled' ||
    action.type === 'auth/updateProfile/fulfilled'
  ) {
    const payload = cachePayloadFromAction(action, store.getState())
    if (payload) writeAuthBootstrapCache(payload)
  }

  if (action.type === clearSession.type || action.type === 'auth/logout/fulfilled') {
    clearAuthBootstrapCache()
  }

  return result
}
