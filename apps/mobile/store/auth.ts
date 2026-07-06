import { createAuthService } from '@moxt/shared/auth/createAuthService.js';
import { createAuthSlice } from '@moxt/shared/auth/createAuthSlice.js';

import { supabase } from '../services/supabase';
import type { AuthState } from './types';

const authRedirectBase = process.env.EXPO_PUBLIC_AUTH_REDIRECT_BASE || 'moxt://';

export const authService = createAuthService(supabase, {
  getOAuthRedirectUrl: () => `${authRedirectBase}dashboard`,
  getEmailRedirectUrl: () => `${authRedirectBase}login`,
  getPasswordResetRedirectUrl: () => `${authRedirectBase}reset-password`,
});

const authModule = createAuthSlice(authService);

export const authReducer = authModule.reducer as unknown as import('@reduxjs/toolkit').Reducer<AuthState>;

export const {
  login,
  loginWithGoogle,
  register,
  verifyEmailRegistration,
  verifyPhoneRegistration,
  updateProfile,
  restoreSession,
  logout,
} = authModule;

export const { clearAuthError, setUser } = authModule.actions;
