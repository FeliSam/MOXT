import { supabase } from '../services/supabaseClient'

/** Active l’option Mobile ID à l’inscription. */
export const MOBILE_ID_ENABLED = true

const MIDSDK_DIRECT = 'https://midsdk.smsaero.ru'

/**
 * Base URL du SDK — proxy same-origin pour éviter les erreurs CORS
 * (midsdk n’autorise que certaines origines dans le cabinet SMS Aero).
 */
export function getMobileIdBaseUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/midsdk`
  }
  return MIDSDK_DIRECT
}

/** URL token (init SDK) — proxy same-origin en navigateur. */
export function getMobileIdTokenUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/mobileid-token`
  }
  const base = import.meta.env.VITE_SUPABASE_URL
  if (!base) return ''
  return `${String(base).replace(/\/$/, '')}/functions/v1/mobileid-gateway`
}

export function isMobileIdConfigured() {
  return MOBILE_ID_ENABLED && Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(supabase)
}
