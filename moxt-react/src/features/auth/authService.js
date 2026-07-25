import { createAuthService, translateAuthError } from '@moxt/shared/auth/createAuthService.js'
import { supabase } from '../../services/supabaseClient'
import { getSiteUrl } from '../../utils/siteUrl'

export { translateAuthError }

/**
 * Redirections e-mail / magic link → URL publique (moxtapp.ru),
 * pas https://localhost de la WebView Capacitor embarquée.
 */
export const authService = createAuthService(supabase, {
  getEmailRedirectUrl: () => `${getSiteUrl()}/auth/callback?next=/security`,
  getPasswordResetRedirectUrl: () => `${getSiteUrl()}/reset-password`,
})

export const demoAccounts = []
