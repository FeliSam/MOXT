import { applySession } from '../features/auth/authSlice'
import { hasSupabaseAuthInStorage } from './clearClientCache'

const AUTH_BOOTSTRAP_KEY = 'moxt-auth-bootstrap-v1'
/** Ignore un cache auth trop ancien (profil peut avoir changé). */
const AUTH_BOOTSTRAP_TTL_MS = 7 * 24 * 60 * 60 * 1000

function readRaw() {
  if (typeof localStorage === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(AUTH_BOOTSTRAP_KEY) || 'null')
  } catch {
    return null
  }
}

export function writeAuthBootstrapCache({ user, token }) {
  if (typeof localStorage === 'undefined' || !user?.id || !token) return
  try {
    localStorage.setItem(
      AUTH_BOOTSTRAP_KEY,
      JSON.stringify({
        user,
        token,
        at: new Date().toISOString(),
      }),
    )
  } catch {
    // quota / mode privé
  }
}

export function clearAuthBootstrapCache() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(AUTH_BOOTSTRAP_KEY)
  } catch {
    // ignore
  }
}

/**
 * Ré-applique la dernière session connue pour afficher l’app sans attendre Supabase.
 */
export function readAuthBootstrapCache() {
  if (!hasSupabaseAuthInStorage()) {
    clearAuthBootstrapCache()
    return null
  }
  const raw = readRaw()
  if (!raw?.user?.id || !raw?.token || !raw?.at) return null
  if (Date.now() - Date.parse(raw.at) > AUTH_BOOTSTRAP_TTL_MS) return null
  return { user: raw.user, token: raw.token }
}

export function hydrateAuthFromBootstrapCache(dispatch) {
  const cached = readAuthBootstrapCache()
  if (!cached) return false
  dispatch(applySession(cached))
  return true
}
