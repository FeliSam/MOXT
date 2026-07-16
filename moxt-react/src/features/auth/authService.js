import { createAuthService, translateAuthError } from '@moxt/shared/auth/createAuthService.js'
import { supabase } from '../../services/supabaseClient'

export { translateAuthError }

export const authService = createAuthService(supabase, {
  getEmailRedirectUrl: () => `${window.location.origin}/auth/callback?next=/security`,
  getPasswordResetRedirectUrl: () => `${window.location.origin}/reset-password`,
})

export const demoAccounts = []
