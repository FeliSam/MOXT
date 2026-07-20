import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { APP_MESSAGES } from '../constants/messages.js'

/**
 * @param {ReturnType<import('./createAuthService.js').createAuthService>} authService
 */
export function createAuthSlice(authService) {
  const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  })

  const completeOAuthProfile = createAsyncThunk(
    'auth/completeOAuthProfile',
    async (details, { rejectWithValue }) => {
      try {
        return await authService.completeOAuthProfile(details)
      } catch (error) {
        return rejectWithValue(error.message)
      }
    },
  )

  const register = createAsyncThunk('auth/register', async (details, { rejectWithValue }) => {
    try {
      return await authService.register(details)
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : String(error))
    }
  })

  const registerWithEmailAfterSmsDenied = createAsyncThunk(
    'auth/registerWithEmailAfterSmsDenied',
    async (details, { rejectWithValue }) => {
      try {
        return await authService.registerWithEmailAfterSmsDenied(details)
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : String(error))
      }
    },
  )

  const verifyEmailRegistration = createAsyncThunk(
    'auth/verifyEmailRegistration',
    async (details, { rejectWithValue }) => {
      try {
        return await authService.verifyEmailRegistration(details)
      } catch (error) {
        return rejectWithValue(error.message)
      }
    },
  )

  const verifyPhoneRegistration = createAsyncThunk(
    'auth/verifyPhoneRegistration',
    async (details, { rejectWithValue }) => {
      try {
        return await authService.verifyPhoneRegistration(details)
      } catch (error) {
        return rejectWithValue(error.message)
      }
    },
  )

  const resendPhoneRegistrationOtp = createAsyncThunk(
    'auth/resendPhoneRegistrationOtp',
    async (phone, { rejectWithValue }) => {
      try {
        return await authService.resendPhoneRegistrationOtp(phone)
      } catch (error) {
        return rejectWithValue(error.message)
      }
    },
  )

  const resendEmailRegistrationOtp = createAsyncThunk(
    'auth/resendEmailRegistrationOtp',
    async (email, { rejectWithValue }) => {
      try {
        return await authService.resendEmailRegistrationOtp(email)
      } catch (error) {
        return rejectWithValue(error.message)
      }
    },
  )

  const requestPhoneVerificationOtp = createAsyncThunk(
    'auth/requestPhoneVerificationOtp',
    async (phone, { getState, rejectWithValue }) => {
      try {
        return await authService.requestPhoneVerificationOtp(getState().auth.user, phone)
      } catch (error) {
        return rejectWithValue(error.message)
      }
    },
  )

  const confirmPhoneVerification = createAsyncThunk(
    'auth/confirmPhoneVerification',
    async (details, { getState, rejectWithValue }) => {
      try {
        return await authService.confirmPhoneVerification(getState().auth.user, details)
      } catch (error) {
        return rejectWithValue(error.message)
      }
    },
  )

  const requestEmailVerificationOtp = createAsyncThunk(
    'auth/requestEmailVerificationOtp',
    async (email, { getState, rejectWithValue }) => {
      try {
        return await authService.requestEmailVerificationOtp(getState().auth.user, email)
      } catch (error) {
        return rejectWithValue(error.message)
      }
    },
  )

  const confirmEmailVerification = createAsyncThunk(
    'auth/confirmEmailVerification',
    async (details, { getState, rejectWithValue }) => {
      try {
        return await authService.confirmEmailVerification(getState().auth.user, details)
      } catch (error) {
        return rejectWithValue(error.message)
      }
    },
  )

  const updateProfile = createAsyncThunk('auth/updateProfile', async (details, { getState, rejectWithValue }) => {
    try {
      return await authService.updateProfile(getState().auth.user, details)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  })

  const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
    try {
      return await authService.restoreSession()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  })

  const logout = createAsyncThunk('auth/logout', async () => {
    await authService.logout()
  })

  const initialState = {
    user: null,
    token: null,
    status: 'loading',
    error: null,
    registrationEmail: null,
  }

  const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
      clearAuthError(state) {
        state.error = null
      },
      setUser(state, action) {
        state.user = action.payload
      },
      applySession(state, action) {
        state.user = action.payload.user
        state.token = action.payload.token
        state.status = 'authenticated'
        state.error = null
      },
      clearSession(state) {
        state.user = null
        state.token = null
        state.status = 'anonymous'
        state.error = null
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(restoreSession.pending, (state) => {
          // Évite un splash AuthLoadingScreen si la session est déjà résolue
          // (retry, dispatch en double, retour d'onglet).
          if (state.status === 'authenticated' || state.status === 'anonymous') return
          state.status = 'loading'
        })
        .addCase(restoreSession.fulfilled, (state, action) => {
          if (action.payload) {
            state.user = action.payload.user
            state.token = action.payload.token
            state.status = 'authenticated'
          } else {
            state.status = 'anonymous'
          }
        })
        .addCase(restoreSession.rejected, (state) => {
          state.status = 'anonymous'
        })
        .addCase(login.pending, setLoading)
        .addCase(login.fulfilled, setSession)
        .addCase(login.rejected, setFailure)
        .addCase(completeOAuthProfile.pending, setLoading)
        .addCase(completeOAuthProfile.fulfilled, setSession)
        .addCase(completeOAuthProfile.rejected, setFailure)
        .addCase(register.pending, setLoading)
        .addCase(register.fulfilled, (state, action) => {
          if (
            action.payload.requiresEmailConfirmation ||
            action.payload.requiresPhoneConfirmation
          ) {
            state.user = null
            state.token = null
            state.status = 'anonymous'
            state.error = null
            state.registrationEmail = action.payload.email
            return
          }
          state.registrationEmail = null
          setSession(state, action)
        })
        .addCase(register.rejected, setFailure)
        .addCase(registerWithEmailAfterSmsDenied.pending, setLoading)
        .addCase(registerWithEmailAfterSmsDenied.fulfilled, (state, action) => {
          if (action.payload.requiresEmailConfirmation) {
            state.user = null
            state.token = null
            state.status = 'anonymous'
            state.error = null
            state.registrationEmail = action.payload.email
            return
          }
          state.registrationEmail = null
          setSession(state, action)
        })
        .addCase(registerWithEmailAfterSmsDenied.rejected, setFailure)
        .addCase(verifyEmailRegistration.pending, setLoading)
        .addCase(verifyEmailRegistration.fulfilled, setSession)
        .addCase(verifyEmailRegistration.rejected, setFailure)
        .addCase(verifyPhoneRegistration.pending, setLoading)
        .addCase(verifyPhoneRegistration.fulfilled, setSession)
        .addCase(verifyPhoneRegistration.rejected, setFailure)
        .addCase(resendPhoneRegistrationOtp.pending, setLoading)
        .addCase(resendPhoneRegistrationOtp.fulfilled, (state) => {
          state.status = 'anonymous'
          state.error = null
        })
        .addCase(resendPhoneRegistrationOtp.rejected, setFailure)
        .addCase(resendEmailRegistrationOtp.pending, setLoading)
        .addCase(resendEmailRegistrationOtp.fulfilled, (state) => {
          state.status = 'anonymous'
          state.error = null
        })
        .addCase(resendEmailRegistrationOtp.rejected, setFailure)
        .addCase(requestPhoneVerificationOtp.pending, clearAuthErrorOnly)
        .addCase(requestPhoneVerificationOtp.fulfilled, (state, action) => {
          state.status = 'authenticated'
          state.error = null
          if (action.payload?.user) {
            state.user = action.payload.user
          }
        })
        .addCase(requestPhoneVerificationOtp.rejected, setFailure)
        .addCase(confirmPhoneVerification.pending, clearAuthErrorOnly)
        .addCase(confirmPhoneVerification.fulfilled, (state, action) => {
          state.user = action.payload
          state.status = 'authenticated'
          state.error = null
        })
        .addCase(confirmPhoneVerification.rejected, setFailure)
        .addCase(requestEmailVerificationOtp.pending, clearAuthErrorOnly)
        .addCase(requestEmailVerificationOtp.fulfilled, (state, action) => {
          state.status = 'authenticated'
          state.error = null
          if (action.payload?.user) {
            state.user = action.payload.user
          }
        })
        .addCase(requestEmailVerificationOtp.rejected, setFailure)
        .addCase(confirmEmailVerification.pending, clearAuthErrorOnly)
        .addCase(confirmEmailVerification.fulfilled, (state, action) => {
          state.user = action.payload
          state.status = 'authenticated'
          state.error = null
        })
        .addCase(confirmEmailVerification.rejected, setFailure)
        .addCase(updateProfile.pending, setLoading)
        .addCase(updateProfile.fulfilled, (state, action) => {
          state.user = action.payload
          state.status = 'authenticated'
        })
        .addCase(updateProfile.rejected, setFailure)
        .addCase(logout.fulfilled, (state) => {
          state.user = null
          state.token = null
          state.status = 'anonymous'
          state.error = null
        })
    },
  })

  return {
    reducer: authSlice.reducer,
    actions: authSlice.actions,
    login,
    completeOAuthProfile,
    register,
    registerWithEmailAfterSmsDenied,
    verifyEmailRegistration,
    verifyPhoneRegistration,
    resendPhoneRegistrationOtp,
    resendEmailRegistrationOtp,
    requestPhoneVerificationOtp,
    confirmPhoneVerification,
    requestEmailVerificationOtp,
    confirmEmailVerification,
    updateProfile,
    restoreSession,
    logout,
  }
}

function setLoading(state) {
  state.status = 'loading'
  state.error = null
}

function clearAuthErrorOnly(state) {
  state.error = null
}

function setSession(state, action) {
  if (!action.payload) return
  state.user = action.payload.user
  state.token = action.payload.token
  state.status = 'authenticated'
  state.error = null
}

function setFailure(state, action) {
  state.status = state.user ? 'authenticated' : 'anonymous'
  state.error = action.payload || APP_MESSAGES.genericError
}
