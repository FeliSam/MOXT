import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import authReducer from '../features/auth/authSlice'

const refreshSession = vi.fn()
const getSession = vi.fn()
const onAuthStateChange = vi.fn()

vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      getSession,
      refreshSession,
      onAuthStateChange,
    },
  },
}))

vi.mock('../features/auth/authService', () => ({
  authService: {
    sessionFromSupabaseUser: vi.fn(async (session) => ({
      user: { id: session.user.id, firstName: 'Amina', lastName: 'Demo' },
      token: session.access_token,
    })),
  },
}))

vi.mock('./realtimeService', () => ({
  startRealtimeSubscription: vi.fn(),
  reconnectRealtimeSubscription: vi.fn(),
  stopRealtimeSubscription: vi.fn(),
}))

describe('authSessionSync visibility handler', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    const { stopAuthSessionSync } = await import('./authSessionSync')
    stopAuthSessionSync()
  })

  it('rafraichit la session au retour d onglet sans deconnecter', async () => {
    const { startAuthSessionSync, stopAuthSessionSync } = await import('./authSessionSync')

    getSession.mockResolvedValue({ data: { session: null } })
    refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'fresh-token',
          user: { id: 'u1', user_metadata: {} },
        },
      },
    })

    const store = configureStore({
      reducer: {
        auth: authReducer,
        communications: () => ({ conversations: [] }),
      },
      preloadedState: {
        auth: {
          user: { id: 'u1', firstName: 'Amina' },
          token: 'old-token',
          status: 'authenticated',
          error: null,
          registrationEmail: null,
        },
      },
    })

    startAuthSessionSync(store)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await vi.waitFor(() => {
      expect(refreshSession).toHaveBeenCalled()
      expect(store.getState().auth.status).toBe('authenticated')
      expect(store.getState().auth.token).toBe('fresh-token')
    })

    stopAuthSessionSync()
  })

  it('conserve la session Redux en cas d erreur reseau', async () => {
    const { startAuthSessionSync, stopAuthSessionSync } = await import('./authSessionSync')

    getSession.mockRejectedValue(new Error('network'))
    refreshSession.mockRejectedValue(new Error('network'))

    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: { id: 'u1', firstName: 'Amina' },
          token: 'old-token',
          status: 'authenticated',
          error: null,
          registrationEmail: null,
        },
      },
    })

    startAuthSessionSync(store)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await vi.waitFor(() => {
      expect(getSession).toHaveBeenCalled()
    })

    expect(store.getState().auth.user?.id).toBe('u1')
    expect(store.getState().auth.status).toBe('authenticated')

    stopAuthSessionSync()
  })
})
