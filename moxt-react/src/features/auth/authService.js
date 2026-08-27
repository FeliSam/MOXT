import { createAuthService, translateAuthError } from '@moxt/shared/auth/createAuthService.js'
import { supabase } from '../../services/supabaseClient'
import { isE2eHarnessActive, readE2eHarnessSession } from '../../services/e2eSession'
import { getSiteUrl } from '../../utils/siteUrl'

export { translateAuthError }

/**
 * Redirections e-mail / magic link → URL publique (moxtapp.ru),
 * pas https://localhost de la WebView Capacitor embarquée.
 */
const liveAuthService = createAuthService(supabase, {
  getEmailRedirectUrl: () => `${getSiteUrl()}/auth/callback?next=/security`,
  getPasswordResetRedirectUrl: () => `${getSiteUrl()}/reset-password`,
})

export const authService = {
  ...liveAuthService,
  async restoreSession() {
    if (isE2eHarnessActive()) return readE2eHarnessSession()
    return liveAuthService.restoreSession()
  },
}

export const demoAccounts = []
