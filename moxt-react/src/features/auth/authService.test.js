import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
  verifyOtp: vi.fn(),
}

const profileQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
}

vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    auth,
    from: vi.fn(() => profileQuery),
  },
}))

const { authService, translateAuthError } = await import('./authService')

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profileQuery.select.mockReturnValue(profileQuery)
    profileQuery.eq.mockReturnValue(profileQuery)
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    profileQuery.upsert.mockResolvedValue({ error: null })
  })

  it('crée le profil avec une session immédiatement disponible', async () => {
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: { access_token: 'session-token' },
      },
      error: null,
    })

    const result = await authService.register(registrationDetails())

    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({
            first_name: 'Nouvelle',
            role: 'user',
          }),
        }),
      }),
    )
    expect(profileQuery.upsert).toHaveBeenCalledOnce()
    expect(result.requiresEmailConfirmation).toBe(false)
    expect(result.token).toBe('session-token')
  })

  it("n'écrit pas anonymement dans profiles si l'e-mail doit être confirmé", async () => {
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-2', identities: [{ id: 'identity-2' }] },
        session: null,
      },
      error: null,
    })

    const result = await authService.register({
      ...registrationDetails(),
      verificationMethod: 'email',
    })

    expect(profileQuery.upsert).not.toHaveBeenCalled()
    expect(result.requiresEmailConfirmation).toBe(true)
    expect(result.email).toBe('personne@example.com')
  })

  it('connecte un utilisateur avec un numéro russe national', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-phone',
          email: 'personne@example.com',
          user_metadata: {},
        },
        session: { access_token: 'phone-session' },
      },
      error: null,
    })
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'user-phone',
        email: 'personne@example.com',
        role: 'user',
        status: 'active',
      },
      error: null,
    })

    await authService.login({
      identifier: '8 900 000 00 10',
      password: 'mot-de-passe-solide',
    })

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      phone: '+79000000010',
      password: 'mot-de-passe-solide',
    })
  })

  it('valide le code SMS puis lie l’adresse e-mail', async () => {
    auth.verifyOtp.mockResolvedValue({
      data: {
        user: {
          id: 'user-sms',
          email: null,
          user_metadata: {
            first_name: 'Nouvelle',
            phone: '+79000000010',
          },
        },
        session: { access_token: 'sms-session' },
      },
      error: null,
    })
    auth.updateUser.mockResolvedValue({ error: null })

    const result = await authService.verifyPhoneRegistration({
      phone: '+79000000010',
      token: '123456',
      email: 'personne@example.com',
    })

    expect(auth.verifyOtp).toHaveBeenCalledWith({
      phone: '+79000000010',
      token: '123456',
      type: 'sms',
    })
    expect(auth.updateUser).toHaveBeenCalledWith({ email: 'personne@example.com' })
    expect(result.token).toBe('sms-session')
  })

  it('termine l inscription SMS meme si la liaison e-mail echoue', async () => {
    auth.verifyOtp.mockResolvedValue({
      data: {
        user: {
          id: 'user-sms',
          email: null,
          user_metadata: { first_name: 'Nouvelle', phone: '+79000000010' },
        },
        session: { access_token: 'sms-session' },
      },
      error: null,
    })
    auth.updateUser.mockResolvedValue({
      error: { message: 'User already registered', code: 'email_exists' },
    })
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'user-sms',
        email: '',
        role: 'user',
        status: 'active',
      },
      error: null,
    })

    const result = await authService.verifyPhoneRegistration({
      phone: '+79000000010',
      token: '123456',
      email: 'personne@example.com',
    })

    expect(result.token).toBe('sms-session')
    expect(result.emailLinkDeferred).toBe(true)
  })

  it('continue l inscription si le profil existe deja cote serveur', async () => {
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-1', identities: [{ id: 'identity-1' }] },
        session: { access_token: 'session-token' },
      },
      error: null,
    })
    profileQuery.upsert.mockResolvedValue({ error: { message: 'duplicate key value violates unique constraint' } })
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'personne@example.com',
        role: 'user',
        status: 'active',
      },
      error: null,
    })

    const result = await authService.register(registrationDetails())

    expect(result.token).toBe('session-token')
  })
})

describe('translateAuthError', () => {
  it('mappe les codes Supabase vers des messages utilisateur', () => {
    expect(translateAuthError({ code: 'email_exists', message: 'duplicate' })).toBe('ALREADY_REGISTERED')
    expect(translateAuthError({ code: 'sms_send_failed', message: 'failed' })).toContain('SMS')
  })
})

function registrationDetails() {
  return {
    firstName: 'Nouvelle',
    lastName: 'Personne',
    email: 'Personne@example.com',
    password: 'mot-de-passe-solide',
    russianPhone: '+79000000010',
    originPhone: '+2290190000010',
    originCountry: 'BJ',
    residenceCity: 'Moscou',
  }
}
