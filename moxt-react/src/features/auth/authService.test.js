import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = {
  signInWithPassword: vi.fn(),
  signInWithOtp: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
  verifyOtp: vi.fn(),
  resend: vi.fn(),
}

const profileQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
}

const rpc = vi.fn()

vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    auth,
    from: vi.fn(() => profileQuery),
    rpc,
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
    rpc.mockResolvedValue({ data: { available: true, reason: null }, error: null })
  })

  it('exige la confirmation SMS avant de créer le profil même avec une session', async () => {
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-1', identities: [{ id: 'identity-1' }] },
        session: { access_token: 'session-token' },
      },
      error: null,
    })
    auth.signOut.mockResolvedValue({ error: null })

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
    expect(auth.signOut).toHaveBeenCalledOnce()
    expect(profileQuery.upsert).not.toHaveBeenCalled()
    expect(result.requiresPhoneConfirmation).toBe(true)
    expect(result.token).toBe('')
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
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'user-sms',
        first_name: 'Nouvelle',
        last_name: 'Personne',
        email: 'personne@example.com',
        phone: '+79000000010',
        origin_country: 'BJ',
        city: 'Moscou',
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
        first_name: 'Nouvelle',
        last_name: 'Personne',
        email: 'personne@example.com',
        phone: '+79000000010',
        origin_country: 'BJ',
        city: 'Moscou',
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

    expect(profileQuery.upsert).toHaveBeenCalled()
    expect(result.token).toBe('sms-session')
    expect(result.emailLinkDeferred).toBe(true)
  })

  it('enregistre le profil complet après vérification SMS', async () => {
    auth.verifyOtp.mockResolvedValue({
      data: {
        user: {
          id: 'user-sms',
          email: null,
          phone: '+79000000010',
          user_metadata: {
            first_name: 'Nouvelle',
            last_name: 'Personne',
            email: 'personne@example.com',
            origin_country: 'BJ',
            city: 'Moscou',
            phone: '+79000000010',
          },
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
        first_name: 'Nouvelle',
        last_name: 'Personne',
        email: 'personne@example.com',
        phone: '+79000000010',
        origin_country: 'BJ',
        city: 'Moscou',
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

    expect(profileQuery.upsert).toHaveBeenCalled()
    expect(result.user.email).toBe('personne@example.com')
    expect(result.user.city).toBe('Moscou')
  })

  it('exige la confirmation e-mail avant de créer le profil même avec une session', async () => {
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-2', identities: [{ id: 'identity-2' }] },
        session: { access_token: 'session-token' },
      },
      error: null,
    })
    auth.signOut.mockResolvedValue({ error: null })

    const result = await authService.register({
      ...registrationDetails(),
      verificationMethod: 'email',
    })

    expect(auth.signOut).toHaveBeenCalledOnce()
    expect(profileQuery.upsert).not.toHaveBeenCalled()
    expect(result.requiresEmailConfirmation).toBe(true)
    expect(result.token).toBe('')
  })

  it('renvoie un code SMS pour finaliser l inscription', async () => {
    auth.resend.mockResolvedValue({ error: null })

    await authService.resendPhoneRegistrationOtp('+79000000010')

    expect(auth.resend).toHaveBeenCalledWith({
      type: 'sms',
      phone: '+79000000010',
    })
  })

  it('renvoie un code e-mail pour finaliser l inscription', async () => {
    auth.resend.mockResolvedValue({ error: null })

    await authService.resendEmailRegistrationOtp('personne@example.com')

    expect(auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'personne@example.com',
    })
  })

  it('envoie un code SMS pour la connexion', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null })

    const result = await authService.requestPhoneLoginOtp('8 900 000 00 10')

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      phone: '+79000000010',
      options: { shouldCreateUser: false },
    })
    expect(result.phone).toBe('+79000000010')
  })

  it('valide un code SMS de connexion', async () => {
    auth.verifyOtp.mockResolvedValue({
      data: {
        user: { id: 'user-sms', email: 'personne@example.com', user_metadata: {} },
        session: { access_token: 'login-sms-session' },
      },
      error: null,
    })
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'user-sms',
        email: 'personne@example.com',
        role: 'user',
        status: 'active',
      },
      error: null,
    })

    const result = await authService.verifyPhoneLogin({ phone: '+79000000010', token: '123456' })

    expect(auth.verifyOtp).toHaveBeenCalledWith({
      phone: '+79000000010',
      token: '123456',
      type: 'sms',
    })
    expect(result.token).toBe('login-sms-session')
  })

  it('bloque l inscription si le numéro est encore lié à un compte actif', async () => {
    rpc.mockResolvedValueOnce({ data: { available: false, reason: 'active' }, error: null })

    await expect(authService.register(registrationDetails())).rejects.toThrow('ALREADY_REGISTERED')
    expect(auth.signUp).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledWith('moxt_check_identity_available', {
      p_kind: 'phone',
      p_value: '+79000000010',
      p_user_id: null,
    })
  })
})

describe('translateAuthError', () => {
  it('mappe les codes Supabase vers des messages utilisateur', () => {
    expect(translateAuthError({ code: 'email_exists', message: 'duplicate' })).toBe('ALREADY_REGISTERED')
    expect(translateAuthError({ message: 'MOXT_IDENTITY_LIMIT_REACHED' })).toBe('IDENTITY_LIMIT_REACHED')
    expect(translateAuthError({ code: 'sms_send_failed', message: 'failed' })).toMatch(/SMS|Telegram/i)
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
