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
    refreshAuthSession: vi.fn(async () => ({
      user: { id: 'u1', firstName: 'Amina', lastName: 'Demo' },
      token: 'fresh-token',
    })),
  },
}))

vi.mock('./realtimeService', () => ({
  startRealtimeSubscription: vi.fn(),
  reconnectRealtimeSubscription: vi.fn(),
  stopRealtimeSubscription: vi.fn(),
  syncRealtimeAuthToken: vi.fn(),
}))

vi.mock('../app/loadAllData', () => ({
  loadAllData: () => () => Promise.resolve(),
}))

vi.mock('../features/communications/communicationSlice', () => ({
  refreshConversations: () => () => Promise.resolve(),
}))

vi.mock('./clearClientCache', () => ({
  clearClientCache: vi.fn(),
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
    const { clearClientCache } = await import('./clearClientCache')
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
    // Let onForeground finish (must not clear on transient errors).
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(store.getState().auth.user?.id).toBe('u1')
    expect(store.getState().auth.status).toBe('authenticated')
    expect(clearClientCache).not.toHaveBeenCalled()

    stopAuthSessionSync()
  })

  it('conserve la session si getSession timeout (Safari resume)', async () => {
    const { clearClientCache } = await import('./clearClientCache')
    const { startAuthSessionSync, stopAuthSessionSync } = await import('./authSessionSync')

    getSession.mockImplementation(
      () => new Promise(() => {}), // hang until timeout
    )

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

    vi.useFakeTimers()
    startAuthSessionSync(store)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(16_000)

    expect(store.getState().auth.user?.id).toBe('u1')
    expect(store.getState().auth.status).toBe('authenticated')
    expect(clearClientCache).not.toHaveBeenCalled()

    stopAuthSessionSync()
    vi.useRealTimers()
  })

  it('rafraichit un JWT expire encore present en localStorage', async () => {
    const { startAuthSessionSync, stopAuthSessionSync } = await import('./authSessionSync')

    const expiredSession = {
      access_token: 'expired-token',
      expires_at: Math.floor(Date.now() / 1000) - 120,
      user: { id: 'u1', user_metadata: {} },
    }
    getSession.mockResolvedValue({ data: { session: expiredSession } })
    refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'fresh-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
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
          token: 'expired-token',
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
      expect(store.getState().auth.token).toBe('fresh-token')
    })

    stopAuthSessionSync()
  })

  it('ne deconnecte pas si refreshAuthSession renvoie null alors que la session Supabase existe encore', async () => {
    const { authService } = await import('../features/auth/authService')
    const { clearClientCache } = await import('./clearClientCache')
    const { startAuthSessionSync, stopAuthSessionSync } = await import('./authSessionSync')

    const liveSession = {
      access_token: 'still-valid',
      user: { id: 'u1', user_metadata: {} },
    }
    getSession.mockResolvedValue({ data: { session: liveSession } })
    authService.refreshAuthSession.mockResolvedValue(null)

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
      expect(authService.refreshAuthSession).toHaveBeenCalled()
    })

    expect(store.getState().auth.user?.id).toBe('u1')
    expect(store.getState().auth.status).toBe('authenticated')
    expect(clearClientCache).not.toHaveBeenCalled()

    stopAuthSessionSync()
  })
})
