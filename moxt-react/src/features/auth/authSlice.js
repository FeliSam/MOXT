import { createAuthSlice } from '@moxt/shared/auth/createAuthSlice.js'
import { authService } from './authService'

const authModule = createAuthSlice(authService)

export const {
  login,
  loginWithGoogle,
  completeOAuthProfile,
  requestPhoneLoginOtp,
  verifyPhoneLogin,
  register,
  verifyEmailRegistration,
  verifyPhoneRegistration,
  resendPhoneRegistrationOtp,
  updateProfile,
  restoreSession,
  logout,
} = authModule

export const { clearAuthError, setUser, applySession, clearSession } = authModule.actions

export default authModule.reducer
