import { createAuthService, translateAuthError } from '@moxt/shared/auth/createAuthService.js'
import { supabase } from '../../services/supabaseClient'
import { invokeTelegramGateway } from '../../services/telegramGatewayService'
import { invokeMobileIdGateway } from '../../services/mobileIdGatewayService'

export { translateAuthError }

export const authService = createAuthService(
  supabase,
  {
    getOAuthRedirectUrl: () => `${window.location.origin}/dashboard`,
    getEmailRedirectUrl: () => `${window.location.origin}/login`,
    getPasswordResetRedirectUrl: () => `${window.location.origin}/reset-password`,
  },
  { invokeTelegramGateway, invokeMobileIdGateway },
)

export const demoAccounts = []
