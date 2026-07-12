import { createAuthSlice } from '@moxt/shared/auth/createAuthSlice.js'
import { authService } from './authService'

const authModule = createAuthSlice(authService)

export const {
  login,
  completeOAuthProfile,
  requestPhoneLoginOtp,
  verifyPhoneLogin,
  register,
  verifyEmailRegistration,
  verifyPhoneRegistration,
  resendPhoneRegistrationOtp,
  resendEmailRegistrationOtp,
  requestPhoneVerificationOtp,
  confirmPhoneVerification,
  updateProfile,
  restoreSession,
  logout,
} = authModule

export const { clearAuthError, setUser, applySession, clearSession } = authModule.actions

export default authModule.reducer
