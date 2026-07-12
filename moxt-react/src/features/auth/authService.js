import { createAuthService, translateAuthError } from '@moxt/shared/auth/createAuthService.js'
import { supabase } from '../../services/supabaseClient'

export { translateAuthError }

export const authService = createAuthService(supabase, {
  getEmailRedirectUrl: () => `${window.location.origin}/login`,
  getPasswordResetRedirectUrl: () => `${window.location.origin}/reset-password`,
})

export const demoAccounts = []
