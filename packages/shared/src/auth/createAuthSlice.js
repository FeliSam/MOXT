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

  const loginWithGoogle = createAsyncThunk('auth/loginWithGoogle', async (_, { rejectWithValue }) => {
    try {
      return await authService.loginWithGoogle()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  })

  const register = createAsyncThunk('auth/register', async (details, { rejectWithValue }) => {
    try {
      return await authService.register(details)
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : String(error))
    }
  })

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
        .addCase(loginWithGoogle.pending, setLoading)
        .addCase(loginWithGoogle.fulfilled, (state, action) => {
          if (action.payload) setSession(state, action)
        })
        .addCase(loginWithGoogle.rejected, setFailure)
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
        .addCase(verifyEmailRegistration.pending, setLoading)
        .addCase(verifyEmailRegistration.fulfilled, setSession)
        .addCase(verifyEmailRegistration.rejected, setFailure)
        .addCase(verifyPhoneRegistration.pending, setLoading)
        .addCase(verifyPhoneRegistration.fulfilled, setSession)
        .addCase(verifyPhoneRegistration.rejected, setFailure)
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
    loginWithGoogle,
    register,
    verifyEmailRegistration,
    verifyPhoneRegistration,
    updateProfile,
    restoreSession,
    logout,
  }
}

function setLoading(state) {
  state.status = 'loading'
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
