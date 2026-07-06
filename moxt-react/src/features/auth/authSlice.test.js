import { beforeEach, describe, expect, it } from 'vitest'
import reducer, { login, logout, register, updateProfile } from './authSlice'

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('enregistre une session apres une connexion reussie', () => {
    const payload = {
      user: { id: 'u1', email: 'user@demo.com', role: 'user' },
      token: 'session-token',
    }
    const state = reducer(undefined, login.fulfilled(payload))

    expect(state.status).toBe('authenticated')
    expect(state.user.id).toBe('u1')
    expect(state.token).toBe('session-token')
  })

  it('impose le role utilisateur lors de la creation de compte', () => {
    const payload = {
      user: { id: 'u2', email: 'new@moxt.test', role: 'user' },
      token: 'new-session',
    }
    const state = reducer(undefined, register.fulfilled(payload))

    expect(state.user.role).toBe('user')
  })

  it('conserve la session si une mise a jour du profil echoue', () => {
    const authenticated = {
      user: { id: 'u1', role: 'user' },
      token: 'token',
      status: 'authenticated',
      error: null,
    }
    const state = reducer(authenticated, updateProfile.rejected(null, '', null, 'Erreur'))

    expect(state.status).toBe('authenticated')
    expect(state.user.id).toBe('u1')
  })

  it('efface completement la session a la deconnexion', () => {
    const state = reducer(
      { user: { id: 'u1' }, token: 'token', status: 'authenticated', error: null },
      logout.fulfilled(),
    )

    expect(state.status).toBe('anonymous')
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })
})
