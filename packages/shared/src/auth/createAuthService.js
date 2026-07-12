import { normalizePhone, normalizeRussianAuthPhone } from '../utils/phone.js'
import { isProfileComplete } from './profileCompletion.js'
import { translateAuthError } from './translateAuthError.js'

function profileToUser(profile) {
  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: normalizeRussianAuthPhone(profile.phone || ''),
    secondaryPhone: profile.origin_phone || '',
    country: profile.country || 'RU',
    originCountry: profile.origin_country || 'BJ',
    city: profile.city || '',
    avatarUrl: profile.avatar_url || '',
    role: profile.role || 'user',
    verified: profile.status === 'verified',
    status: profile.status || 'active',
    phoneVerified: profile.phone_verified === true,
    phoneVerifiedAt: profile.phone_verified_at || null,
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
 *   getEmailRedirectUrl?: () => string,
 *   getPasswordResetRedirectUrl?: () => string,
 * }} redirects
 */
export function createAuthService(supabase, redirects = {}) {
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

  async function assertIdentityAvailable(kind, value, userId = null, context = {}) {
    if (!supabase || !value) return

    const { data, error } = await supabase.rpc('moxt_check_identity_available', {
      p_kind: kind,
      p_value: value,
      p_user_id: userId,
    })

    if (error) {
      console.warn('[MOXT] Vérification identité indisponible:', error.message)
      return
    }

    if (data?.available === false) {
      if (data.reason === 'limit') {
        throw new Error('IDENTITY_LIMIT_REACHED')
      }
      throw new Error(
        translateAuthError(
          { message: 'MOXT_IDENTITY_ACTIVE' },
          { ...context, channel: kind === 'phone' ? 'phone' : 'email' },
        ),
      )
    }
  }

  async function getAuthenticatedAuthUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw new Error(translateAuthError(error, { channel: 'phone' }))
    if (!data?.user) throw new Error('Session expirée.')
    return data.user
  }

  async function syncPhoneVerifiedFromAuth(authUser, userId) {
    if (!authUser?.phone_confirmed_at) return null
    const authPhone = normalizeRussianAuthPhone(authUser.phone || '')
    if (!/^\+7\d{10}$/.test(authPhone)) return null

    const existing = await fetchProfile(userId)
    if (
      existing?.phoneVerified &&
      normalizeRussianAuthPhone(existing.phone || '') === authPhone
    ) {
      return existing
    }

    const now = new Date().toISOString()
    await upsertProfile(userId, {
      phone: authPhone,
      phone_verified: true,
      phone_verified_at: existing?.phoneVerifiedAt || now,
      updated_at: now,
    })
    return fetchProfile(userId)
  }

  function profileFieldsFromAuthUser(authUser) {
    const metadata = authUser.user_metadata || {}
    const fullName = metadata.full_name || metadata.name || ''
    const nameParts = String(fullName).trim().split(/\s+/).filter(Boolean)
    return {
      first_name: metadata.first_name || nameParts[0] || 'Utilisateur',
      last_name: metadata.last_name || nameParts.slice(1).join(' ') || '',
      email: authUser.email || metadata.email || '',
      phone: normalizeRussianAuthPhone(authUser.phone || metadata.phone || ''),
      origin_phone: metadata.origin_phone || '',
      country: 'RU',
      origin_country: metadata.origin_country || 'BJ',
      city: metadata.city || '',
      avatar_url: metadata.avatar_url || metadata.picture || '',
      role: 'user',
      status: 'active',
    }
  }

  async function fetchOrCreateProfile(authUser) {
    const profileFields = profileFieldsFromAuthUser(authUser)
    const existingProfile = await fetchProfile(authUser.id)

    if (existingProfile) {
      if (!isProfileComplete(existingProfile)) {
        await upsertProfile(authUser.id, {
          first_name: profileFields.first_name || existingProfile.firstName,
          last_name: profileFields.last_name || existingProfile.lastName,
          email: profileFields.email || existingProfile.email,
          phone: profileFields.phone || existingProfile.phone,
          origin_phone: profileFields.origin_phone || existingProfile.secondaryPhone,
          origin_country: profileFields.origin_country || existingProfile.originCountry,
          city: profileFields.city || existingProfile.city,
          avatar_url: profileFields.avatar_url || existingProfile.avatarUrl,
          country: profileFields.country || existingProfile.country,
          role: profileFields.role || existingProfile.role,
          status: existingProfile.status || profileFields.status,
        })
        const refreshed = await fetchProfile(authUser.id)
        if (refreshed) {
          return (await syncPhoneVerifiedFromAuth(authUser, authUser.id)) || refreshed
        }
      }
      return (await syncPhoneVerifiedFromAuth(authUser, authUser.id)) || existingProfile
    }

    await upsertProfile(authUser.id, profileFields)
    const created = profileToUser({ id: authUser.id, ...profileFields })
    return (await syncPhoneVerifiedFromAuth(authUser, authUser.id)) || created
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
      if (error) throw new Error(translateAuthError(error, { channel: isEmail ? 'email' : 'phone' }))
      if (!data?.session || !data?.user) {
        throw new Error('Connexion impossible. Vérifiez vos identifiants.')
      }
      const user = await fetchOrCreateProfile(data.user)
      return { user, token: data.session.access_token }
    },

    async requestPhoneLoginOtp(phone) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const normalizedPhone = normalizeRussianAuthPhone(phone)
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { shouldCreateUser: false },
      })
      if (error) throw new Error(translateAuthError(error, { channel: 'phone' }))
      return { phone: normalizedPhone }
    },

    async verifyPhoneLogin({ phone, token }) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizeRussianAuthPhone(phone),
        token: String(token || '').trim(),
        type: 'sms',
      })
      if (error) throw new Error(translateAuthError(error, { channel: 'phone' }))
      if (!data?.session || !data?.user) {
        throw new Error('Le code est invalide ou a expiré.')
      }
      const user = await fetchOrCreateProfile(data.user)
      return { user, token: data.session.access_token }
    },

    async completeOAuthProfile(details) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData.session?.user
      if (!authUser) throw new Error('Session expirée. Reconnectez-vous pour compléter votre profil.')

      const profileFields = {
        first_name: details.firstName.trim(),
        last_name: details.lastName.trim(),
        phone: normalizeRussianAuthPhone(details.russianPhone),
        origin_phone: details.originPhone?.trim() || '',
        country: 'RU',
        origin_country: details.originCountry,
        city: details.residenceCity?.trim() || '',
        avatar_url: details.avatarUrl?.trim() || authUser.user_metadata?.picture || authUser.user_metadata?.avatar_url || '',
        role: 'user',
        status: 'active',
        updated_at: new Date().toISOString(),
      }

      const normalizedPhone = normalizeRussianAuthPhone(details.russianPhone)
      const resolvedEmail = String(
        details.email || authUser.email || authUser.user_metadata?.email || '',
      )
        .trim()
        .toLowerCase()
      const phoneVerified = /^\+7\d{10}$/.test(normalizedPhone)
      const now = new Date().toISOString()

      await upsertProfile(authUser.id, {
        ...profileFields,
        email: resolvedEmail,
        phone: normalizedPhone,
        phone_verified: phoneVerified,
        phone_verified_at: phoneVerified ? now : null,
      })

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          first_name: profileFields.first_name,
          last_name: profileFields.last_name,
          origin_country: profileFields.origin_country,
          city: profileFields.city,
          phone: profileFields.phone,
          origin_phone: profileFields.origin_phone,
          avatar_url: profileFields.avatar_url,
        },
      })
      if (metadataError) {
        console.warn('[MOXT] Métadonnées profil non mises à jour:', metadataError.message)
      }

      const user = await fetchProfile(authUser.id)
      if (!user) throw new Error('Impossible de charger le profil après complétion.')
      return { user, token: sessionData.session.access_token }
    },

    async register(details) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const email = String(details.email || '').trim().toLowerCase()

      const profileFields = {
        first_name: details.firstName.trim(),
        last_name: details.lastName.trim(),
        email,
        phone: normalizeRussianAuthPhone(details.russianPhone || ''),
        origin_phone: details.originPhone?.trim() || '',
        country: 'RU',
        origin_country: details.originCountry,
        city: details.residenceCity?.trim() || '',
        avatar_url: details.avatarUrl?.trim() || '',
        role: 'user',
        status: 'active',
      }

      const verificationMethod =
        details.verificationMethod === 'email' ? 'email' : 'phone'

      if (verificationMethod === 'email' && !email) {
        throw new Error("L'e-mail est obligatoire pour confirmer votre compte par e-mail.")
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

      const authChannel = verificationMethod === 'phone' ? 'phone' : 'email'
      if (verificationMethod === 'phone') {
        await assertIdentityAvailable(
          'phone',
          normalizeRussianAuthPhone(details.russianPhone),
          null,
          { channel: 'phone' },
        )
      } else {
        await assertIdentityAvailable('email', email, null, { channel: 'email' })
      }

      const { data, error } = await supabase.auth.signUp(credentials)
      if (error) {
        throw new Error(translateAuthError(error, { channel: authChannel }))
      }

      if (data.user && !data.session) {
        const identityCount = data.user.identities?.length ?? 0
        if (identityCount === 0) {
          throw new Error('ALREADY_REGISTERED')
        }
      }
      if (!data.user) throw new Error('Échec de création du compte.')

      if (data.session) {
        await supabase.auth.signOut()
      }

      const user = profileToUser({ id: data.user.id, ...profileFields })
      return {
        user,
        token: '',
        requiresEmailConfirmation: verificationMethod === 'email',
        requiresPhoneConfirmation: verificationMethod === 'phone',
        pendingUserId: data.user.id,
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
      if (error) throw new Error(translateAuthError(error, { channel: 'email' }))
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
      if (error) throw new Error(translateAuthError(error, { channel: 'phone' }))
      if (!data.session || !data.user) {
        throw new Error('Le code de vérification est invalide.')
      }

      const linkedEmail = String(email || '').trim().toLowerCase()
      if (linkedEmail && !data.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: linkedEmail,
        })
        if (emailError) {
          console.warn('[MOXT] Liaison e-mail différée après inscription SMS:', emailError.message)
        }
      }

      const profileFields = profileFieldsFromAuthUser(data.user)
      const normalizedPhone = normalizeRussianAuthPhone(
        data.user.phone || profileFields.phone || phone || '',
      )
      if (linkedEmail) {
        profileFields.email = linkedEmail
      }
      profileFields.phone = normalizedPhone

      const now = new Date().toISOString()
      await upsertProfile(data.user.id, {
        first_name: profileFields.first_name,
        last_name: profileFields.last_name,
        email: profileFields.email,
        phone: normalizedPhone,
        origin_phone: profileFields.origin_phone,
        country: profileFields.country || 'RU',
        origin_country: profileFields.origin_country || 'BJ',
        city: profileFields.city,
        avatar_url: profileFields.avatar_url,
        role: profileFields.role || 'user',
        status: profileFields.status || 'active',
        phone_verified: true,
        phone_verified_at: now,
      })
      const user = await fetchProfile(data.user.id)
      if (!user) {
        throw new Error('Impossible de charger le profil après vérification SMS.')
      }
      return {
        user,
        token: data.session.access_token,
        emailLinkDeferred: Boolean(linkedEmail && !data.user.email),
      }
    },

    async resendPhoneRegistrationOtp(phone) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const normalizedPhone = normalizeRussianAuthPhone(phone)
      const { error } = await supabase.auth.resend({
        type: 'sms',
        phone: normalizedPhone,
      })
      if (error) throw new Error(translateAuthError(error, { channel: 'phone' }))
      return true
    },

    async resendEmailRegistrationOtp(email) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const normalizedEmail = String(email || '').trim().toLowerCase()
      if (!normalizedEmail) {
        throw new Error("L'e-mail est obligatoire pour renvoyer le code.")
      }
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
      })
      if (error) throw new Error(translateAuthError(error, { channel: 'email' }))
      return true
    },

    async requestPhoneVerificationOtp(currentUser, phone) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const normalizedPhone = normalizeRussianAuthPhone(phone)
      if (!/^\+7\d{10}$/.test(normalizedPhone)) {
        throw new Error('Numéro de téléphone invalide. Vérifiez le format (+7XXXXXXXXXX).')
      }

      const authUser = await getAuthenticatedAuthUser()
      const phoneContext = { channel: 'phone', intent: 'phone_verification' }
      const syncedUser = await syncPhoneVerifiedFromAuth(authUser, currentUser.id)
      if (syncedUser && normalizeRussianAuthPhone(syncedUser.phone || '') === normalizedPhone) {
        return { phone: normalizedPhone, user: syncedUser }
      }

      const authPhone = normalizeRussianAuthPhone(authUser.phone || '')
      if (authPhone === normalizedPhone) {
        const { error } = await supabase.auth.resend({
          type: 'phone_change',
          phone: normalizedPhone,
        })
        if (error) {
          const fallback = await supabase.auth.resend({
            type: 'sms',
            phone: normalizedPhone,
          })
          if (fallback.error) {
            throw new Error(translateAuthError(fallback.error, phoneContext))
          }
        }
        return { phone: normalizedPhone }
      }

      await assertIdentityAvailable('phone', normalizedPhone, currentUser.id, phoneContext)

      const { error } = await supabase.auth.updateUser({ phone: normalizedPhone })
      if (error) throw new Error(translateAuthError(error, phoneContext))
      return { phone: normalizedPhone }
    },

    async confirmPhoneVerification(currentUser, { phone, token }) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const normalizedPhone = normalizeRussianAuthPhone(phone)
      const phoneContext = { channel: 'phone', intent: 'phone_verification' }

      const authUser = await getAuthenticatedAuthUser()
      const syncedUser = await syncPhoneVerifiedFromAuth(authUser, currentUser.id)
      if (syncedUser && normalizeRussianAuthPhone(syncedUser.phone || '') === normalizedPhone) {
        return syncedUser
      }

      let verifyResult = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: String(token || '').trim(),
        type: 'phone_change',
      })
      if (verifyResult.error) {
        verifyResult = await supabase.auth.verifyOtp({
          phone: normalizedPhone,
          token: String(token || '').trim(),
          type: 'sms',
        })
      }
      if (verifyResult.error) {
        throw new Error(translateAuthError(verifyResult.error, phoneContext))
      }

      const now = new Date().toISOString()
      await upsertProfile(currentUser.id, {
        phone: normalizedPhone,
        phone_verified: true,
        phone_verified_at: now,
        updated_at: now,
      })
      const user = await fetchProfile(currentUser.id)
      if (!user) throw new Error('Impossible de charger le profil après vérification.')
      return user
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
      if (error) throw new Error(translateAuthError(error, { channel: 'email' }))
      return true
    },

    async requestPasswordReset(email) {
      if (!supabase) return true
      const redirectTo = getPasswordResetRedirectUrl()
      const { error } = await supabase.auth.resetPasswordForEmail(String(email || '').trim().toLowerCase(), {
        redirectTo: redirectTo || undefined,
      })
      if (error) throw new Error(translateAuthError(error, { channel: 'email' }))
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
      const nextPhone = details.phone?.trim() || ''
      const phoneChanged =
        normalizeRussianAuthPhone(nextPhone) !== normalizeRussianAuthPhone(currentUser.phone || '')
      const profileFields = {
        first_name: details.firstName.trim(),
        last_name: details.lastName.trim(),
        phone: nextPhone,
        origin_phone: details.secondaryPhone?.trim() || '',
        city: details.city?.trim() || '',
        origin_country: details.originCountry,
        avatar_url: details.avatarUrl?.trim() || '',
        updated_at: new Date().toISOString(),
      }
      if (phoneChanged) {
        profileFields.phone_verified = false
        profileFields.phone_verified_at = null
      }
      const { error } = await supabase.from('profiles').update(profileFields).eq('id', currentUser.id)
      if (error) throw new Error(error.message)
      const refreshed = await fetchProfile(currentUser.id)
      return refreshed || {
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
