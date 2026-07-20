import { createAuthService, translateAuthError } from '@moxt/shared/auth/createAuthService.js'
import { supabase } from '../../services/supabaseClient'

export { translateAuthError }

function browserOrigin() {
  if (typeof window === 'undefined' || !window.location?.origin) return ''
  return window.location.origin
}

export const authService = createAuthService(supabase, {
  getEmailRedirectUrl: () => {
    const origin = browserOrigin()
    return origin ? `${origin}/auth/callback?next=/security` : ''
  },
  getPasswordResetRedirectUrl: () => {
    const origin = browserOrigin()
    return origin ? `${origin}/reset-password` : ''
  },
})

export const demoAccounts = []
