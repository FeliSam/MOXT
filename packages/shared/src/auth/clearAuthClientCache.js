import { clearOtpSendLog } from './otpCooldown.js'
import { clearPendingRegistration } from './pendingRegistration.js'

/** Clears auth-flow client state shared across web and mobile (no Redux). */
export function clearAuthClientCache() {
  clearPendingRegistration()
  clearOtpSendLog()
}
