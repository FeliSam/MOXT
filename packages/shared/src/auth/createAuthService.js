import { normalizePhone, normalizeRussianAuthPhone } from '../utils/phone.js'
import { translateAuthError } from './translateAuthError.js'

function profileToUser(profile) {
  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone || '',
    secondaryPhone: profile.origin_phone || '',
    country: profile.country || 'RU',
    originCountry: profile.origin_country || 'BJ',
    city: profile.city || '',
    avatarUrl: profile.avatar_url || '',
    role: profile.role || 'user',
    verified: profile.status === 'verified',
    status: profile.status || 'active',
    createdAt: profile.created_at || profile.updated_at || null,
  }
}

function isPhoneLoginDisabledError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  const code = error?.code
  return (
    code === 'phone_provider_disabled' ||
    message.includes('phone logins are disabled') ||
    message.includes('phone provider') ||
    message.includes('unsupported phone provider')
  )
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} supabase
 * @param {{
 *   getOAuthRedirectUrl?: () => string,
 *   getEmailRedirectUrl?: () => string,
 *   getPasswordResetRedirectUrl?: () => string,
 * }} redirects
 */
export function createAuthService(supabase, redirects = {}, integrations = {}) {
  const { invokeTelegramGateway, invokeMobileIdGateway } = integrations
  const getOAuthRedirectUrl = redirects.getOAuthRedirectUrl ?? (() => '')
  const getEmailRedirectUrl = redirects.getEmailRedirectUrl ?? (() => '')
  const getPasswordResetRedirectUrl = redirects.getPasswordResetRedirectUrl ?? (() => '')

  async function signInWithPhoneFallback(phone, password) {
    // 1) Tentative native Supabase (si Phone est activé dans le dashboard)
    const phoneResult = await supabase.auth.signInWithPassword({ phone, password })
    if (!phoneResult.error && phoneResult.data?.session) {
      return phoneResult
    }

    if (phoneResult.error && !isPhoneLoginDisabledError(phoneResult.error)) {
      if (
        String(phoneResult.error.message || '')
          .toLowerCase()
          .includes('invalid login credentials')
      ) {
        return phoneResult
      }
    }

    // 2) Fallback Edge Function : login e-mail du profil lié au numéro
    const { data, error } = await supabase.functions.invoke('phone-login', {
      body: { phone, password },
    })
    if (error || data?.error) {
      let detail = data?.error
      if (!detail && error?.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.json()
          detail = body?.error
        } catch {
          // ignore
        }
      }
      return {
        data: { user: null, session: null },
        error: {
          message:
            detail ||
            phoneResult.error?.message ||
            error?.message ||
            'Connexion par numéro impossible.',
        },
      }
    }

    if (!data?.access_token || !data?.refresh_token) {
      return {
        data: { user: null, session: null },
        error: { message: 'Session invalide après connexion téléphone.' },
      }
    }

    const sessionResult = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
    if (sessionResult.error) {
      return { data: { user: null, session: null }, error: sessionResult.error }
    }

    return {
      data: {
        user: sessionResult.data.user || data.user,
        session: sessionResult.data.session,
      },
      error: null,
    }
  }

  async function fetchProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? profileToUser(data) : null
  }

  async function upsertProfile(userId, fields) {
    const { error } = await supabase.from('profiles').upsert(
      { id: userId, ...fields, updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
    if (error) throw new Error(error.message)
  }

  async function upsertProfileSafely(userId, fields) {
    try {
      await upsertProfile(userId, fields)
    } catch (err) {
      const existing = await fetchProfile(userId)
      if (existing) return
      throw err
    }
  }

  function profileFieldsFromAuthUser(authUser) {
    const metadata = authUser.user_metadata || {}
    return {
      first_name: metadata.first_name || metadata.full_name?.split(' ')[0] || 'Utilisateur',
      last_name: metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || '',
      email: authUser.email || metadata.email || '',
      phone: authUser.phone || metadata.phone || '',
      origin_phone: metadata.origin_phone || '',
      country: 'RU',
      origin_country: metadata.origin_country || 'BJ',
      city: metadata.city || '',
      avatar_url: metadata.avatar_url || '',
      role: 'user',
      status: 'active',
    }
  }

  async function fetchOrCreateProfile(authUser) {
    const existingProfile = await fetchProfile(authUser.id)
    if (existingProfile) return existingProfile

    const profileFields = profileFieldsFromAuthUser(authUser)
    await upsertProfile(authUser.id, profileFields)
    return profileToUser({ id: authUser.id, ...profileFields })
  }

  return {
    async login({ identifier, email, password }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const loginIdentifier = (identifier || email || '').trim()
      const isEmail = loginIdentifier.includes('@')
      const { data, error } = isEmail
        ? await supabase.auth.signInWithPassword({
            email: loginIdentifier.toLowerCase(),
            password,
          })
        : await signInWithPhoneFallback(normalizeRussianAuthPhone(loginIdentifier), password)
      if (error) throw new Error(translateAuthError(error))
      if (!data?.session || !data?.user) {
        throw new Error('Connexion impossible. Vérifiez vos identifiants.')
      }
      const user = await fetchOrCreateProfile(data.user)
      return { user, token: data.session.access_token }
    },

    async loginWithGoogle() {
      if (!supabase) throw new Error('Supabase non configuré.')
      const redirectTo = getOAuthRedirectUrl()
      if (!redirectTo) throw new Error('Redirection OAuth non configurée.')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (error) throw new Error(error.message)
      return null
    },

    async fetchGoogleProfile() {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data } = await supabase.auth.getUser()
      if (!data?.user) throw new Error('Aucune session Google active.')
      return {
        firstName: data.user.user_metadata?.full_name?.split(' ')[0] || 'Utilisateur',
        lastName: data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'Google',
        email: data.user.email || '',
        avatarUrl: data.user.user_metadata?.avatar_url || '',
      }
    },

    async register(details) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const email = details.email.trim().toLowerCase()

      const profileFields = {
        first_name: details.firstName.trim(),
        last_name: details.lastName.trim(),
        email,
        phone: details.russianPhone?.trim() || '',
        origin_phone: details.originPhone?.trim() || '',
        country: 'RU',
        origin_country: details.originCountry,
        city: details.residenceCity?.trim() || '',
        avatar_url: details.avatarUrl?.trim() || '',
        role: 'user',
        status: 'active',
      }

      const verificationMethod = details.verificationMethod || 'phone'
      const phoneDeliveryChannel =
        verificationMethod === 'phone' ? details.phoneDeliveryChannel || 'sms' : 'sms'

      // Telegram : crée le compte côté Edge Function (sans SMS Supabase).
      if (verificationMethod === 'phone' && phoneDeliveryChannel === 'telegram') {
        if (!invokeTelegramGateway) {
          throw new Error('La vérification Telegram n’est pas configurée sur cette application.')
        }
        const phone = normalizeRussianAuthPhone(details.russianPhone)
        const registered = await invokeTelegramGateway({
          action: 'register',
          phone,
          password: details.password,
          email,
          profileFields,
        })
        if (!registered?.userId) {
          throw new Error('Échec de création du compte Telegram.')
        }
        return {
          user: profileToUser({ id: registered.userId, ...profileFields }),
          token: '',
          requiresEmailConfirmation: false,
          requiresPhoneConfirmation: false,
          requiresTelegramPhoneConfirmation: true,
          pendingUserId: registered.userId,
          phoneDeliveryChannel: 'telegram',
          verificationMethod: 'phone',
          email,
          phone,
        }
      }

      // MobileID : crée le compte puis vérifie le numéro via le SDK SMS Aero.
      if (verificationMethod === 'phone' && phoneDeliveryChannel === 'mobileid') {
        if (!invokeMobileIdGateway) {
          throw new Error('La vérification MobileID n’est pas configurée sur cette application.')
        }
        const phone = normalizeRussianAuthPhone(details.russianPhone)
        const registered = await invokeMobileIdGateway({
          action: 'register',
          phone,
          password: details.password,
          email,
          profileFields,
        })
        if (!registered?.userId) {
          throw new Error('Échec de création du compte MobileID.')
        }
        return {
          user: profileToUser({ id: registered.userId, ...profileFields }),
          token: '',
          requiresEmailConfirmation: false,
          requiresPhoneConfirmation: false,
          requiresTelegramPhoneConfirmation: false,
          requiresMobileIdPhoneConfirmation: true,
          pendingUserId: registered.userId,
          phoneDeliveryChannel: 'mobileid',
          verificationMethod: 'phone',
          email,
          phone,
        }
      }

      const credentials =
        verificationMethod === 'phone'
          ? {
              phone: normalizeRussianAuthPhone(details.russianPhone),
              password: details.password,
              options: { channel: 'sms', data: profileFields },
            }
          : {
              email,
              password: details.password,
              options: {
                emailRedirectTo: getEmailRedirectUrl(),
                data: profileFields,
              },
            }

      const { data, error } = await supabase.auth.signUp(credentials)
      if (error) {
        if (error.status === 500 || error.status >= 500) {
          throw new Error(
            verificationMethod === 'email'
              ? "L'envoi d'e-mail de confirmation est indisponible. Choisissez la vérification par téléphone ou réessayez plus tard."
              : "Le service d'inscription est temporairement indisponible. Réessayez plus tard.",
          )
        }
        throw new Error(translateAuthError(error))
      }

      if (data.user && !data.session) {
        const identityCount = data.user.identities?.length ?? 0
        if (identityCount === 0) {
          throw new Error('ALREADY_REGISTERED')
        }
      }
      if (!data.user) throw new Error('Échec de création du compte.')

      if (data.session) await upsertProfileSafely(data.user.id, profileFields)

      const user = profileToUser({ id: data.user.id, ...profileFields })
      const pendingConfirmation = verificationMethod === 'phone' && !data.session
      return {
        user,
        token: data.session?.access_token || '',
        requiresEmailConfirmation: verificationMethod === 'email' && !data.session,
        requiresPhoneConfirmation: pendingConfirmation,
        requiresTelegramPhoneConfirmation: false,
        pendingUserId: data.user.id,
        phoneDeliveryChannel,
        verificationMethod,
        email,
        phone: normalizeRussianAuthPhone(details.russianPhone),
      }
    },

    async verifyEmailRegistration({ email, token }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'signup',
      })
      if (error) throw new Error(translateAuthError(error))
      if (!data.session || !data.user) {
        throw new Error("Le code est invalide ou a expiré. Recommencez l'inscription.")
      }
      const user = await fetchOrCreateProfile(data.user)
      return { user, token: data.session.access_token }
    },

    async verifyPhoneRegistration({ phone, token, email }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizeRussianAuthPhone(phone),
        token: token.trim(),
        type: 'sms',
      })
      if (error) throw new Error(translateAuthError(error))
      if (!data.session || !data.user) {
        throw new Error('Le code de vérification est invalide.')
      }

      if (email && !data.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email.trim().toLowerCase(),
        })
        if (emailError) {
          console.warn('[MOXT] Liaison e-mail différée après inscription SMS:', emailError.message)
        }
      }

      const user = await fetchOrCreateProfile(data.user)
      return {
        user,
        token: data.session.access_token,
        emailLinkDeferred: Boolean(email && !data.user.email),
      }
    },

    async verifyTelegramPhoneRegistration({
      phone,
      token,
      requestId,
      userId,
      password,
      email,
    }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      if (!invokeTelegramGateway) {
        throw new Error('La vérification Telegram n’est pas configurée sur cette application.')
      }
      if (!requestId || !userId) {
        throw new Error('Session de vérification Telegram invalide. Recommencez l’inscription.')
      }

      const normalizedPhone = normalizeRussianAuthPhone(phone)
      await invokeTelegramGateway({
        action: 'verify',
        phone: normalizedPhone,
        userId,
        requestId,
        code: token.trim(),
      })

      // Prefer email login when available — Phone provider may be disabled.
      let authResult = null
      const emailLogin = email?.trim().toLowerCase()
      if (emailLogin) {
        authResult = await supabase.auth.signInWithPassword({
          email: emailLogin,
          password,
        })
      }
      if (authResult?.error || !authResult?.data?.session) {
        authResult = await signInWithPhoneFallback(normalizedPhone, password)
      }
      const { data, error } = authResult
      if (error) throw new Error(translateAuthError(error))
      if (!data?.session || !data?.user) {
        throw new Error('Connexion impossible après vérification Telegram.')
      }

      if (emailLogin && !data.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: emailLogin,
        })
        if (emailError) {
          console.warn('[MOXT] Liaison e-mail différée après inscription Telegram:', emailError.message)
        }
      }

      const user = await fetchOrCreateProfile(data.user)
      return {
        user,
        token: data.session.access_token,
        emailLinkDeferred: Boolean(emailLogin && !data.user.email),
      }
    },

    async verifyMobileIdPhoneRegistration({
      phone,
      sessionId,
      verifyToken,
      userId,
      password,
      email,
    }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      if (!invokeMobileIdGateway) {
        throw new Error('La vérification MobileID n’est pas configurée sur cette application.')
      }
      if (!sessionId || !verifyToken || !userId) {
        throw new Error('Session MobileID invalide. Recommencez l’inscription.')
      }

      const normalizedPhone = normalizeRussianAuthPhone(phone)
      const result = await invokeMobileIdGateway({
        action: 'complete',
        phone: normalizedPhone,
        userId,
        session_id: sessionId,
        verify_token: verifyToken,
        password,
        email: email?.trim().toLowerCase(),
      })

      if (!result?.access_token || !result?.refresh_token) {
        throw new Error('Session invalide après vérification MobileID.')
      }

      const sessionResult = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      })
      if (sessionResult.error) {
        throw new Error(translateAuthError(sessionResult.error))
      }
      if (!sessionResult.data.session || !sessionResult.data.user) {
        throw new Error('Connexion impossible après MobileID.')
      }

      const emailLogin = email?.trim().toLowerCase()
      if (emailLogin && !sessionResult.data.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: emailLogin })
        if (emailError) {
          console.warn('[MOXT] Liaison e-mail différée après MobileID:', emailError.message)
        }
      }

      const user = await fetchOrCreateProfile(sessionResult.data.user)
      return {
        user,
        token: sessionResult.data.session.access_token,
        emailLinkDeferred: Boolean(result.emailLinkDeferred || (emailLogin && !sessionResult.data.user.email)),
      }
    },

    async restoreSession() {
      if (!supabase) return null

      let session = null
      try {
        const { data } = await supabase.auth.getSession()
        session = data.session
        if (!session) {
          const { data: refreshed } = await supabase.auth.refreshSession()
          session = refreshed.session
        }
      } catch (error) {
        console.warn('[MOXT] Session Supabase indisponible au démarrage:', error?.message)
        return null
      }

      if (!session) return null

      try {
        const user = await fetchOrCreateProfile(session.user)
        return { user, token: session.access_token }
      } catch (profileError) {
        console.warn('[MOXT] Profil indisponible, session conservée:', profileError?.message)
        const authUser = session.user
        const metadata = authUser.user_metadata || {}
        return {
          user: profileToUser({
            id: authUser.id,
            first_name: metadata.first_name || 'Utilisateur',
            last_name: metadata.last_name || '',
            email: authUser.email || metadata.email || '',
            phone: authUser.phone || metadata.phone || '',
            origin_phone: metadata.origin_phone || '',
            country: 'RU',
            origin_country: metadata.origin_country || 'BJ',
            city: metadata.city || '',
            avatar_url: metadata.avatar_url || '',
            role: 'user',
            status: 'active',
          }),
          token: session.access_token,
        }
      }
    },

    async sessionFromSupabaseUser(session) {
      if (!session?.user) return null
      try {
        const user = await fetchOrCreateProfile(session.user)
        return { user, token: session.access_token }
      } catch {
        const authUser = session.user
        const metadata = authUser.user_metadata || {}
        return {
          user: profileToUser({
            id: authUser.id,
            first_name: metadata.first_name || 'Utilisateur',
            last_name: metadata.last_name || '',
            email: authUser.email || metadata.email || '',
            phone: authUser.phone || metadata.phone || '',
            origin_phone: metadata.origin_phone || '',
            country: 'RU',
            origin_country: metadata.origin_country || 'BJ',
            city: metadata.city || '',
            avatar_url: metadata.avatar_url || '',
            role: 'user',
            status: 'active',
          }),
          token: session.access_token,
        }
      }
    },

    async logout() {
      if (!supabase) return
      await supabase.auth.signOut()
    },

    async signOutOtherSessions() {
      if (!supabase) return
      const { error } = await supabase.auth.signOut({ scope: 'others' })
      if (error) throw new Error(error.message)
    },

    async updatePassword(newPassword) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const password = String(newPassword || '').trim()
      if (password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(translateAuthError(error))
      return true
    },

    async requestPasswordReset(email) {
      if (!supabase) return true
      const redirectTo = getPasswordResetRedirectUrl()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || undefined,
      })
      if (error) throw new Error(error.message)
      return true
    },

    async listMfaFactors() {
      if (!supabase) return { totp: [] }
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw new Error(error.message)
      return data || { totp: [] }
    },

    async enrollMfa() {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'MOXT Authenticator',
      })
      if (error) throw new Error(error.message)
      return data
    },

    async verifyMfaEnrollment({ factorId, challengeId, code }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: String(code || '').trim(),
      })
      if (error) throw new Error(error.message)
      return data
    },

    async challengeMfa(factorId) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data, error } = await supabase.auth.mfa.challenge({ factorId })
      if (error) throw new Error(error.message)
      return data
    },

    async unenrollMfa(factorId) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw new Error(error.message)
      return true
    },

    async requestAccountDeletion(userId, requestId) {
      if (!supabase || !userId) throw new Error('Session expirée.')
      const now = new Date().toISOString()
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'pending_deletion', updated_at: now })
        .eq('id', userId)
      if (profileError) throw new Error(profileError.message)

      const id = requestId || `DEL-${Date.now().toString(36).toUpperCase()}`
      const { error } = await supabase.from('account_deletion_requests').insert({
        id,
        user_id: userId,
        status: 'requested',
        created_at: now,
      })
      if (error) throw new Error(error.message)
      return { id, userId, status: 'requested', createdAt: now }
    },

    async cancelAccountDeletion(userId) {
      if (!supabase || !userId) throw new Error('Session expirée.')
      const now = new Date().toISOString()
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'active', updated_at: now })
        .eq('id', userId)
      if (profileError) throw new Error(profileError.message)

      const { data: rows } = await supabase
        .from('account_deletion_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'requested')
        .limit(1)

      if (rows?.[0]?.id) {
        const { error } = await supabase
          .from('account_deletion_requests')
          .update({ status: 'cancelled', cancelled_at: now })
          .eq('id', rows[0].id)
        if (error) throw new Error(error.message)
      }
      return true
    },

    async updateProfile(currentUser, details) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const profileFields = {
        first_name: details.firstName.trim(),
        last_name: details.lastName.trim(),
        phone: details.phone?.trim() || '',
        origin_phone: details.secondaryPhone?.trim() || '',
        city: details.city?.trim() || '',
        origin_country: details.originCountry,
        avatar_url: details.avatarUrl?.trim() || '',
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('profiles').update(profileFields).eq('id', currentUser.id)
      if (error) throw new Error(error.message)
      return {
        ...currentUser,
        ...profileToUser({
          id: currentUser.id,
          ...profileFields,
          email: currentUser.email,
          role: currentUser.role,
          status: currentUser.status,
        }),
      }
    },
  }
}

export { normalizePhone, normalizeRussianAuthPhone, translateAuthError }
