import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = {
  getUser: vi.fn(),
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOtp: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  setSession: vi.fn(),
  updateUser: vi.fn(),
  verifyOtp: vi.fn(),
  resend: vi.fn(),
}

const profileQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
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
const { __resetOtpSendCooldownForTests, __resetIdentityAvailabilityCacheForTests } = await import(
  '@moxt/shared/auth/createAuthService.js'
)
const { OTP_SEND_CAP_ENABLED, OTP_RESEND_COOLDOWN_SECONDS } = await import(
  '@moxt/shared/auth/otpCooldown.js',
)

function mockSmsVerifySession(userOverrides = {}) {
  const user = {
    id: 'user-sms',
    email: null,
    phone: '+79000000010',
    phone_confirmed_at: '2026-07-15T12:00:00.000Z',
    user_metadata: {
      first_name: 'Nouvelle',
      phone: '+79000000010',
    },
    ...userOverrides,
  }
  const session = {
    access_token: 'sms-session',
    refresh_token: 'sms-refresh',
    user,
  }
  auth.verifyOtp.mockResolvedValue({ data: { user, session }, error: null })
  auth.setSession.mockResolvedValue({ data: { session, user }, error: null })
  // Fresh confirm path: no prior session → verifyOtp; then getUser after setSession.
  auth.getUser
    .mockResolvedValueOnce({ data: { user: null }, error: null })
    .mockResolvedValue({ data: { user }, error: null })
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  return { user, session }
}

function mockAlreadyConfirmedPhoneSession(userOverrides = {}) {
  const { user, session } = mockSmsVerifySession(userOverrides)
  auth.getUser.mockReset()
  auth.getUser.mockResolvedValue({ data: { user }, error: null })
  auth.getSession.mockResolvedValue({ data: { session }, error: null })
  return { user, session }
}

function mockFinalizePhoneProfile(overrides = {}) {
  const profile = {
    id: 'user-sms',
    first_name: 'Nouvelle',
    last_name: 'Personne',
    email: 'personne@example.com',
    phone: '+79000000010',
    phone_verified: true,
    phone_verified_at: '2026-07-15T12:00:00.000Z',
    origin_country: 'BJ',
    city: 'Moscou',
    role: 'user',
    status: 'active',
    ...overrides,
  }
  rpc.mockImplementation((name, args) => {
    if (name === 'moxt_finalize_phone_registration') {
      return Promise.resolve({
        data: {
          ...profile,
          first_name: args?.p_first_name || profile.first_name,
          last_name: args?.p_last_name ?? profile.last_name,
          email: args?.p_email || profile.email,
          city: args?.p_city || profile.city,
          origin_country: args?.p_origin_country || profile.origin_country,
        },
        error: null,
      })
    }
    if (name === 'moxt_check_identity_available') {
      return Promise.resolve({ data: { available: true, reason: null }, error: null })
    }
    return Promise.resolve({ data: { available: true, reason: null }, error: null })
  })
  return profile
}

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetOtpSendCooldownForTests()
    __resetIdentityAvailabilityCacheForTests()
    auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    profileQuery.select.mockReturnValue(profileQuery)
    profileQuery.eq.mockReturnValue(profileQuery)
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    profileQuery.upsert.mockResolvedValue({ error: null })
    profileQuery.insert.mockResolvedValue({ error: null })
    profileQuery.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
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

  it("n'écrit pas anonymement dans profiles tant que le SMS n'est pas confirmé", async () => {
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-2', identities: [{ id: 'identity-2' }] },
        session: null,
      },
      error: null,
    })

    const result = await authService.register(registrationDetails())

    expect(profileQuery.upsert).not.toHaveBeenCalled()
    expect(result.requiresPhoneConfirmation).toBe(true)
    expect(result.requiresEmailConfirmation).toBe(false)
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

  it('ne transmet jamais first_name null au profil lors de la connexion', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-phone-null',
          email: 'personne@example.com',
          phone: '+79000000010',
          phone_confirmed_at: '2026-07-15T12:00:00.000Z',
          user_metadata: { first_name: null, last_name: null },
        },
        session: { access_token: 'phone-session' },
      },
      error: null,
    })
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null })

    await authService.login({
      identifier: '+79000000010',
      password: 'mot-de-passe-solide',
    })

    expect(profileQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Utilisateur',
      }),
      { onConflict: 'id' },
    )
  })

  it('déconnecte une session orpheline (profil absent après wipe DB)', async () => {
    const user = {
      id: 'user-wiped',
      email: 'wiped@example.com',
      phone_confirmed_at: '2026-07-15T12:00:00.000Z',
      user_metadata: { first_name: 'Wiped' },
    }
    auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'stale', user } },
      error: null,
    })
    auth.getUser.mockResolvedValue({ data: { user }, error: null })
    auth.signOut.mockResolvedValue({ error: null })
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await authService.restoreSession()

    expect(result).toBeNull()
    expect(auth.signOut).toHaveBeenCalled()
    expect(profileQuery.upsert).not.toHaveBeenCalled()
  })

  it('refreshAuthSession recree un profil manquant au lieu de deconnecter', async () => {
    const user = {
      id: 'user-refresh',
      email: 'refresh@example.com',
      phone_confirmed_at: '2026-07-15T12:00:00.000Z',
      user_metadata: { first_name: 'Refresh', last_name: 'User' },
    }
    auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'tok', user } },
      error: null,
    })
    auth.getUser.mockResolvedValue({ data: { user }, error: null })
    auth.signOut.mockResolvedValue({ error: null })
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    profileQuery.upsert.mockResolvedValue({ error: null })

    const result = await authService.refreshAuthSession()

    expect(result?.user?.id).toBe('user-refresh')
    expect(auth.signOut).not.toHaveBeenCalled()
    expect(profileQuery.upsert).toHaveBeenCalled()
  })

  it('refreshAuthSession retente via refreshSession si getSession est vide', async () => {
    const user = {
      id: 'user-retry',
      email: 'retry@example.com',
      phone_confirmed_at: '2026-07-15T12:00:00.000Z',
      user_metadata: { first_name: 'Retry' },
    }
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    auth.refreshSession.mockResolvedValue({
      data: { session: { access_token: 'fresh', user } },
      error: null,
    })
    auth.getUser.mockResolvedValue({ data: { user }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'user-retry',
        first_name: 'Retry',
        last_name: '',
        email: 'retry@example.com',
        role: 'user',
        status: 'active',
      },
      error: null,
    })

    const result = await authService.refreshAuthSession()

    expect(auth.refreshSession).toHaveBeenCalled()
    expect(result?.token).toBe('fresh')
    expect(result?.user?.id).toBe('user-retry')
  })

  it('fusionne les champs pending registration lors de la vérification SMS', async () => {
    mockSmsVerifySession({ user_metadata: {} })
    mockFinalizePhoneProfile({
      first_name: 'Nova',
      last_name: 'Test',
      email: 'nova@example.com',
      city: 'Moscou',
      origin_country: 'BJ',
    })

    await authService.verifyPhoneRegistration({
      phone: '+79000000010',
      token: '123456',
      email: 'nova@example.com',
      profileDetails: {
        firstName: 'Nova',
        lastName: 'Test',
        residenceCity: 'Moscou',
        originCountry: 'BJ',
      },
    })

    expect(rpc).toHaveBeenCalledWith(
      'moxt_finalize_phone_registration',
      expect.objectContaining({
        p_first_name: 'Nova',
        p_last_name: 'Test',
        p_city: 'Moscou',
      }),
    )
    expect(profileQuery.upsert).not.toHaveBeenCalled()
  })

  it('valide le code SMS puis enregistre le profil sans lien magique e-mail', async () => {
    mockSmsVerifySession({
      user_metadata: {
        first_name: 'Nouvelle',
        phone: '+79000000010',
      },
    })
    mockFinalizePhoneProfile()

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
    expect(auth.setSession).toHaveBeenCalledWith({
      access_token: 'sms-session',
      refresh_token: 'sms-refresh',
    })
    // No auto updateUser({ email }) — avoids magic-link → /register trap.
    expect(auth.updateUser).not.toHaveBeenCalled()
    expect(result.token).toBe('sms-session')
    expect(result.phoneVerified).toBe(true)
    expect(result.nextVerification).toBe('email')
    expect(result.emailLinkDeferred).toBe(true)
  })

  it('termine l inscription SMS meme sans liaison Auth e-mail immediate', async () => {
    mockSmsVerifySession({
      user_metadata: { first_name: 'Nouvelle', phone: '+79000000010' },
    })
    mockFinalizePhoneProfile()

    const result = await authService.verifyPhoneRegistration({
      phone: '+79000000010',
      token: '123456',
      email: 'personne@example.com',
    })

    expect(rpc).toHaveBeenCalledWith('moxt_finalize_phone_registration', expect.any(Object))
    expect(profileQuery.upsert).not.toHaveBeenCalled()
    expect(result.token).toBe('sms-session')
    expect(result.emailLinkDeferred).toBe(true)
  })

  it('enregistre le profil complet après vérification SMS', async () => {
    mockSmsVerifySession({
      user_metadata: {
        first_name: 'Nouvelle',
        last_name: 'Personne',
        email: 'personne@example.com',
        origin_country: 'BJ',
        city: 'Moscou',
        phone: '+79000000010',
      },
    })
    mockFinalizePhoneProfile({ city: 'Moscou' })

    const result = await authService.verifyPhoneRegistration({
      phone: '+79000000010',
      token: '123456',
      email: 'personne@example.com',
    })

    expect(rpc).toHaveBeenCalledWith('moxt_finalize_phone_registration', expect.any(Object))
    expect(result.user.email).toBe('personne@example.com')
    expect(result.user.city).toBe('Moscou')
    expect(result.user.phoneVerified).toBe(true)
  })

  it('fusionne les champs du formulaire d inscription lors de la verification SMS', async () => {
    mockSmsVerifySession({
      user_metadata: { phone: '+79000000010' },
    })
    mockFinalizePhoneProfile({
      first_name: 'Nouvelle',
      last_name: 'Personne',
      city: 'Moscou',
      origin_country: 'BJ',
    })

    await authService.verifyPhoneRegistration({
      phone: '+79000000010',
      token: '123456',
      email: 'personne@example.com',
      profileDetails: {
        firstName: 'Nouvelle',
        lastName: 'Personne',
        originCountry: 'BJ',
        residenceCity: 'Moscou',
      },
    })

    expect(rpc).toHaveBeenCalledWith(
      'moxt_finalize_phone_registration',
      expect.objectContaining({
        p_first_name: 'Nouvelle',
        p_last_name: 'Personne',
        p_city: 'Moscou',
        p_origin_country: 'BJ',
      }),
    )
    expect(profileQuery.upsert).not.toHaveBeenCalled()
  })

  it('rejoue finalize sans verifyOtp si le téléphone est déjà confirmé en session', async () => {
    const { user, session } = mockAlreadyConfirmedPhoneSession()
    mockFinalizePhoneProfile()
    auth.verifyOtp.mockClear()

    const result = await authService.verifyPhoneRegistration({
      phone: '+79000000010',
      token: '000000',
      email: 'personne@example.com',
    })

    expect(auth.verifyOtp).not.toHaveBeenCalled()
    expect(auth.getUser).toHaveBeenCalled()
    expect(auth.getSession).toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledWith('moxt_finalize_phone_registration', expect.any(Object))
    expect(result.token).toBe(session.access_token)
    expect(result.user.id).toBe(user.id)
  })

  it('surface une erreur claire si finalize RPC échoue', async () => {
    mockSmsVerifySession()
    rpc.mockImplementation((name) => {
      if (name === 'moxt_finalize_phone_registration') {
        return Promise.resolve({
          data: null,
          error: { message: 'MOXT_FINALIZE_FAILED' },
        })
      }
      return Promise.resolve({ data: { available: true, reason: null }, error: null })
    })

    await expect(
      authService.verifyPhoneRegistration({
        phone: '+79000000010',
        token: '123456',
        email: 'personne@example.com',
      }),
    ).rejects.toThrow(/finalisation du profil/i)
    expect(profileQuery.upsert).not.toHaveBeenCalled()
  })

  it('exige la confirmation SMS avant de créer le profil même avec une session (signOut)', async () => {
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-2', identities: [{ id: 'identity-2' }] },
        session: { access_token: 'session-token' },
      },
      error: null,
    })
    auth.signOut.mockResolvedValue({ error: null })

    const result = await authService.register(registrationDetails())

    expect(auth.signOut).toHaveBeenCalledOnce()
    expect(profileQuery.upsert).not.toHaveBeenCalled()
    expect(result.requiresPhoneConfirmation).toBe(true)
    expect(result.requiresEmailConfirmation).toBe(false)
    expect(result.token).toBe('')
  })

  it('renvoie un code SMS pour finaliser l inscription', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null })

    await authService.resendPhoneRegistrationOtp('+79000000010')

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      phone: '+79000000010',
      options: { channel: 'sms', shouldCreateUser: false },
    })
    // Renvoi reste sur SMSC : pas de marquage prefer_p1sms.
    expect(rpc).not.toHaveBeenCalledWith('moxt_mark_otp_resend', expect.anything())
  })

  it('impose 90 secondes entre deux renvois SMS', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null })

    await authService.resendPhoneRegistrationOtp('+79000000010')
    await expect(authService.resendPhoneRegistrationOtp('+79000000010')).rejects.toThrow(
      /Patientez \d+ secondes/,
    )
    expect(auth.signInWithOtp).toHaveBeenCalledTimes(1)
  })

  it('fusionne deux register() concurrents en un seul SMS (anti double-clic)', async () => {
    let resolveSignUp
    auth.signUp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignUp = resolve
        }),
    )

    const details = registrationDetails()
    const first = authService.register(details)
    const second = authService.register(details)

    await vi.waitFor(() => {
      expect(auth.signUp).toHaveBeenCalledTimes(1)
      expect(resolveSignUp).toEqual(expect.any(Function))
    })

    resolveSignUp({
      data: {
        user: { id: 'user-inflight', identities: [{ id: 'identity-1' }] },
        session: null,
      },
      error: null,
    })

    const [a, b] = await Promise.all([first, second])
    expect(auth.signUp).toHaveBeenCalledTimes(1)
    expect(auth.resend).not.toHaveBeenCalled()
    expect(a.pendingUserId).toBe('user-inflight')
    expect(b.pendingUserId).toBe('user-inflight')
  })

  it('fusionne deux resendPhoneRegistrationOtp() concurrents en un seul SMS', async () => {
    let resolveOtp
    auth.signInWithOtp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOtp = resolve
        }),
    )

    const first = authService.resendPhoneRegistrationOtp('+79000000010')
    const second = authService.resendPhoneRegistrationOtp('+79000000010')

    await vi.waitFor(() => {
      expect(auth.signInWithOtp).toHaveBeenCalledTimes(1)
      expect(resolveOtp).toEqual(expect.any(Function))
    })
    resolveOtp({ error: null })

    await Promise.all([first, second])
    expect(auth.signInWithOtp).toHaveBeenCalledTimes(1)
  })

  it.skipIf(!OTP_SEND_CAP_ENABLED)('bloque un 5e envoi OTP dans la fenetre de 3 heures', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-15T12:00:00.000Z'))

    await authService.resendPhoneRegistrationOtp('+79001110001')
    vi.advanceTimersByTime(91_000)
    await authService.resendPhoneRegistrationOtp('+79001110001')
    vi.advanceTimersByTime(91_000)
    await authService.resendPhoneRegistrationOtp('+79001110001')
    vi.advanceTimersByTime(91_000)
    await authService.resendPhoneRegistrationOtp('+79001110001')
    vi.advanceTimersByTime(91_000)

    await expect(authService.resendPhoneRegistrationOtp('+79001110001')).rejects.toThrow(
      /Limite atteinte/,
    )
    expect(auth.signInWithOtp).toHaveBeenCalledTimes(4)

    vi.useRealTimers()
  })

  it('renvoie un code e-mail pour finaliser l inscription', async () => {
    auth.resend.mockResolvedValue({ error: null })

    await authService.resendEmailRegistrationOtp('personne@example.com')

    expect(auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'personne@example.com',
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      },
    })
  })

  it('pointe la verification e-mail vers /auth/callback puis /security', async () => {
    auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-email',
          email: 'personne@example.com',
          email_confirmed_at: null,
          identities: [{ provider: 'email' }],
        },
      },
      error: null,
    })
    auth.resend.mockResolvedValue({ error: null })

    await authService.requestEmailVerificationOtp(
      { id: 'user-email', email: 'personne@example.com' },
      'personne@example.com',
    )

    expect(auth.resend).toHaveBeenCalledWith({
      type: 'email_change',
      email: 'personne@example.com',
      options: {
        emailRedirectTo: expect.stringMatching(/\/auth\/callback\?next=\/security/),
      },
    })
  })

  it('confirme l e-mail sans violer NOT NULL sur first_name si le profil est absent', async () => {
    const pendingAuth = {
      id: 'user-email',
      email: 'personne@example.com',
      email_confirmed_at: null,
      user_metadata: { first_name: 'Nova' },
    }
    const verifiedAuth = {
      ...pendingAuth,
      email_confirmed_at: '2026-07-17T08:00:00.000Z',
    }
    auth.getUser.mockResolvedValue({ data: { user: pendingAuth }, error: null })
    auth.verifyOtp.mockResolvedValue({
      data: { user: verifiedAuth, session: null },
      error: null,
    })
    // syncEmailVerifiedFromAuth skips (email not confirmed yet).
    // patchProfileFields: no row → insert; then fetchProfile.
    profileQuery.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: {
          id: 'user-email',
          first_name: 'Nova',
          last_name: '',
          email: 'personne@example.com',
          phone: '+79000000010',
          phone_verified: true,
          role: 'user',
          status: 'active',
        },
        error: null,
      })

    const result = await authService.confirmEmailVerification(
      {
        id: 'user-email',
        firstName: 'Nova',
        email: 'personne@example.com',
        phone: '+79000000010',
      },
      { email: 'personne@example.com', token: '123456', otpType: 'email_change' },
    )

    expect(profileQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-email',
        first_name: 'Nova',
        email: 'personne@example.com',
      }),
    )
    expect(profileQuery.upsert).not.toHaveBeenCalled()
    expect(result.email).toBe('personne@example.com')
    expect(result.emailVerified).toBe(true)
  })

  it('bloque l inscription si le numéro est encore lié à un compte actif', async () => {
    rpc.mockImplementation((name, args) => {
      if (name === 'moxt_check_identity_available' && args?.p_kind === 'phone') {
        return Promise.resolve({ data: { available: false, reason: 'active' }, error: null })
      }
      return Promise.resolve({ data: { available: true, reason: null }, error: null })
    })

    await expect(authService.register(registrationDetails())).rejects.toThrow('ALREADY_REGISTERED')
    expect(auth.signUp).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledWith('moxt_check_identity_available', {
      p_kind: 'phone',
      p_value: '+79000000010',
      p_user_id: null,
    })
  })

  it('bloque l inscription si le numéro est masqué unavailable (compte confirmé, anti-énumération)', async () => {
    rpc.mockImplementation((name, args) => {
      if (name === 'moxt_check_identity_available' && args?.p_kind === 'phone') {
        return Promise.resolve({ data: { available: false, reason: 'unavailable' }, error: null })
      }
      return Promise.resolve({ data: { available: true, reason: null }, error: null })
    })

    await expect(authService.register(registrationDetails())).rejects.toThrow('ALREADY_REGISTERED')
    expect(auth.signUp).not.toHaveBeenCalled()
    expect(auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('réutilise le prefetch identité au submit (pas de 2ᵉ RPC téléphone)', async () => {
    let phoneChecks = 0
    rpc.mockImplementation((name, args) => {
      if (name === 'moxt_check_identity_available' && args?.p_kind === 'phone') {
        phoneChecks += 1
        return Promise.resolve({ data: { available: true, reason: null }, error: null })
      }
      return Promise.resolve({ data: { available: true, reason: null }, error: null })
    })
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-prefetch', identities: [{ id: 'id-1' }] },
        session: null,
      },
      error: null,
    })

    await authService.prefetchRegistrationIdentities({
      phone: '+79000000010',
      email: 'personne@example.com',
    })
    expect(phoneChecks).toBe(1)

    await authService.register(registrationDetails())
    expect(phoneChecks).toBe(1)
    expect(auth.signUp).toHaveBeenCalledOnce()
  })

  it('refuse l OTP si le numéro est déjà pris (assertRegistrationIdentities)', async () => {
    rpc.mockImplementation((name, args) => {
      if (name === 'moxt_check_identity_available' && args?.p_kind === 'phone') {
        return Promise.resolve({ data: { available: false, reason: 'unavailable' }, error: null })
      }
      return Promise.resolve({ data: { available: true, reason: null }, error: null })
    })

    await expect(
      authService.assertRegistrationIdentitiesEligible({
        phone: '+79000000010',
        email: 'personne@example.com',
      }),
    ).rejects.toThrow('ALREADY_REGISTERED')
  })

  it('refuse l OTP si l e-mail est déjà lié à un compte', async () => {
    rpc.mockImplementation((name, args) => {
      if (name === 'moxt_check_identity_available' && args?.p_kind === 'email') {
        return Promise.resolve({ data: { available: false, reason: 'unavailable' }, error: null })
      }
      return Promise.resolve({ data: { available: true, reason: null }, error: null })
    })

    await expect(
      authService.assertRegistrationIdentitiesEligible({
        phone: '+79000000010',
        email: 'pris@example.com',
      }),
    ).rejects.toThrow(/e-mail|email|déjà|compte/i)
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('bloque register si l e-mail est déjà lié (avant SMS)', async () => {
    rpc.mockImplementation((name, args) => {
      if (name === 'moxt_check_identity_available' && args?.p_kind === 'email') {
        return Promise.resolve({ data: { available: false, reason: 'active' }, error: null })
      }
      return Promise.resolve({ data: { available: true, reason: null }, error: null })
    })

    await expect(authService.register(registrationDetails())).rejects.toThrow(/e-mail|email|déjà|compte/i)
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('ne reprend pas un OTP pour un numéro déjà confirmé via resumePhoneSignup', async () => {
    auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'user_already_exists', message: 'User already registered' },
    })
    let phoneChecks = 0
    rpc.mockImplementation((name, args) => {
      if (name === 'moxt_check_identity_available' && args?.p_kind === 'phone') {
        phoneChecks += 1
        // 1st = register gate (available unfinished); 2nd = resume guard (confirmed)
        if (phoneChecks >= 2) {
          return Promise.resolve({ data: { available: false, reason: 'unavailable' }, error: null })
        }
        return Promise.resolve({ data: { available: true, reason: null }, error: null })
      }
      return Promise.resolve({ data: { available: true, reason: null }, error: null })
    })

    await expect(authService.register(registrationDetails())).rejects.toThrow('ALREADY_REGISTERED')
    expect(auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('accepte un signup téléphone sans champ identities (confirmation SMS en attente)', async () => {
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-pending-sms', email: null, phone: '+79000000010' },
        session: null,
      },
      error: null,
    })

    const result = await authService.register(registrationDetails())

    expect(result.requiresPhoneConfirmation).toBe(true)
    expect(result.pendingUserId).toBe('user-pending-sms')
    expect(result.token).toBe('')
  })

  it('rejette un doublon Supabase avec identities vide explicite', async () => {
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-dup', identities: [] },
        session: null,
      },
      error: null,
    })
    auth.signInWithOtp.mockResolvedValue({ error: null })

    const result = await authService.register(registrationDetails())
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      phone: '+79000000010',
      options: { channel: 'sms', shouldCreateUser: false },
    })
    expect(result.requiresPhoneConfirmation).toBe(true)
    expect(result.pendingUserId).toBe('user-dup')
    expect(result.resumedSignup).toBe(true)
  })

  it('reprend l inscription si Supabase renvoie user_already_exists', async () => {
    auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'user_already_exists', message: 'User already registered' },
    })
    auth.signInWithOtp.mockResolvedValue({ error: null })

    const result = await authService.register(registrationDetails())

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      phone: '+79000000010',
      options: { channel: 'sms', shouldCreateUser: false },
    })
    expect(result.requiresPhoneConfirmation).toBe(true)
    expect(result.resumedSignup).toBe(true)
  })

  it('envoie un OTP phone_change pour un compte e-mail sans téléphone Auth', async () => {
    auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-email',
          email: 'personne@example.com',
          phone: null,
          identities: [{ provider: 'email' }],
        },
      },
      error: null,
    })
    auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null })

    const result = await authService.requestPhoneVerificationOtp(
      {
        id: 'user-email',
        firstName: 'Nouvelle',
        lastName: 'Personne',
        email: 'personne@example.com',
        phone: '+79000000010',
      },
      '+79000000010',
    )

    expect(auth.updateUser).toHaveBeenCalledWith({ phone: '+79000000010' })
    expect(auth.resend).not.toHaveBeenCalled()
    expect(result).toEqual({ phone: '+79000000010', otpType: 'phone_change' })
  })

  it('ne retente pas un second verifyOtp avec un autre type', async () => {
    auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-email',
          email: 'personne@example.com',
          phone: '+79000000010',
          identities: [{ provider: 'email' }],
          user_metadata: { first_name: 'Nouvelle' },
        },
      },
      error: null,
    })
    auth.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid OTP', code: 'otp_expired' },
    })

    await expect(
      authService.confirmPhoneVerification(
        {
          id: 'user-email',
          firstName: 'Nouvelle',
          lastName: 'Personne',
          email: 'personne@example.com',
        },
        { phone: '+79000000010', token: '123456', otpType: 'phone_change' },
      ),
    ).rejects.toThrow(/invalide|expiré/i)

    expect(auth.verifyOtp).toHaveBeenCalledTimes(1)
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      phone: '+79000000010',
      token: '123456',
      type: 'phone_change',
    })
  })

  it('confirme la vérification avec le type OTP reçu à l envoi', async () => {
    auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-email',
          email: 'personne@example.com',
          phone: '+79000000010',
          identities: [{ provider: 'email' }],
          user_metadata: { first_name: 'Nouvelle' },
        },
      },
      error: null,
    })
    auth.verifyOtp.mockResolvedValue({
      data: {
        user: {
          id: 'user-email',
          email: 'personne@example.com',
          phone: '+79000000010',
          phone_confirmed_at: '2026-01-01T00:00:00.000Z',
          user_metadata: { first_name: 'Nouvelle' },
        },
      },
      error: null,
    })
    auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'user-email',
        first_name: 'Nouvelle',
        last_name: 'Personne',
        email: 'personne@example.com',
        phone: '+79000000010',
        phone_verified: true,
        origin_country: 'BJ',
        city: 'Moscou',
        role: 'user',
        status: 'active',
      },
      error: null,
    })

    await authService.confirmPhoneVerification(
      {
        id: 'user-email',
        firstName: 'Nouvelle',
        lastName: 'Personne',
        email: 'personne@example.com',
        originCountry: 'BJ',
        city: 'Moscou',
      },
      { phone: '+79000000010', token: '123456', otpType: 'phone_change' },
    )

    expect(auth.verifyOtp).toHaveBeenCalledWith({
      phone: '+79000000010',
      token: '123456',
      type: 'phone_change',
    })
    expect(auth.updateUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phone: '+79000000010',
        first_name: 'Nouvelle',
      }),
    })
    expect(profileQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+79000000010',
        phone_verified: true,
      }),
    )
  })

  it('ne marque pas le téléphone vérifié lors de la complétion OAuth', async () => {
    auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'oauth-session',
          user: {
            id: 'user-oauth',
            email: 'personne@example.com',
            user_metadata: { picture: 'https://example.com/avatar.png' },
          },
        },
      },
      error: null,
    })
    auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'user-oauth',
        first_name: 'Nouvelle',
        last_name: 'Personne',
        email: 'personne@example.com',
        phone: '+79000000010',
        phone_verified: false,
        origin_country: 'BJ',
        city: 'Moscou',
        role: 'user',
        status: 'active',
      },
      error: null,
    })

    await authService.completeOAuthProfile({
      firstName: 'Nouvelle',
      lastName: 'Personne',
      email: 'personne@example.com',
      russianPhone: '+79000000010',
      originPhone: '+2290190000010',
      originCountry: 'BJ',
      residenceCity: 'Moscou',
      acceptTerms: true,
    })

    expect(profileQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+79000000010',
        phone_verified: false,
        phone_verified_at: null,
      }),
      { onConflict: 'id' },
    )
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
