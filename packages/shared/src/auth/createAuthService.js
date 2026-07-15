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
      throw new Error('IDENTITY_CHECK_UNAVAILABLE')
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

  function isValidAuthPhone(value = '') {
    return /^\+7\d{10}$/.test(normalizeRussianAuthPhone(value))
  }

  function authUserHasPhoneSignup(authUser) {
    return Boolean(
      authUser?.identities?.some(
        (identity) => identity.provider === 'phone' || identity.provider === 'sms',
      ),
    )
  }

  function resolvePhoneVerificationOtpType(authUser, normalizedPhone) {
    const authPhone = isValidAuthPhone(authUser?.phone)
      ? normalizeRussianAuthPhone(authUser.phone)
      : ''

    if (authUser?.phone_confirmed_at && authPhone === normalizedPhone) {
      return null
    }

    if (!authPhone || authPhone !== normalizedPhone) {
      return 'phone_change'
    }

    if (authUserHasPhoneSignup(authUser)) {
      return 'sms'
    }

    return 'phone_change'
  }

  async function syncAuthProfileMetadata(authUser, currentUser, normalizedPhone) {
    const metadata = authUser?.user_metadata || {}
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: currentUser.firstName || metadata.first_name || '',
        last_name: currentUser.lastName || metadata.last_name || '',
        phone: normalizedPhone,
        origin_phone: currentUser.secondaryPhone || metadata.origin_phone || '',
        origin_country: currentUser.originCountry || metadata.origin_country || 'BJ',
        city: currentUser.city || metadata.city || '',
        avatar_url: currentUser.avatarUrl || metadata.avatar_url || '',
      },
    })
    if (error) {
      console.warn(
        '[MOXT] Métadonnées Auth non synchronisées après vérif. téléphone:',
        error.message,
      )
    }
  }

  async function syncEmailVerifiedFromAuth(authUser, userId) {
    if (!authUser?.email_confirmed_at) return null
    const email = String(authUser.email || '').trim().toLowerCase()
    if (!email.includes('@')) return null

    const existing = await fetchProfile(userId)
    if (existing && String(existing.email || '').toLowerCase() === email) {
      return enrichUserFromAuth(existing, authUser)
    }

    await upsertProfile(userId, {
      email,
      updated_at: new Date().toISOString(),
    })
    const refreshed = await fetchProfile(userId)
    return refreshed ? enrichUserFromAuth(refreshed, authUser) : null
  }

  async function enrichUserFromAuth(user, authUser) {
    if (!user || !authUser) return user
    const email = String(authUser.email || user.email || '').trim()
    return {
      ...user,
      email,
      emailVerified: Boolean(authUser.email_confirmed_at) || user.emailVerified === true,
      emailVerifiedAt: authUser.email_confirmed_at || user.emailVerifiedAt || null,
    }
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
          const synced =
            (await syncPhoneVerifiedFromAuth(authUser, authUser.id)) ||
            (await syncEmailVerifiedFromAuth(authUser, authUser.id)) ||
            refreshed
          return enrichUserFromAuth(synced, authUser)
        }
      }
      const profile =
        (await syncPhoneVerifiedFromAuth(authUser, authUser.id)) ||
        (await syncEmailVerifiedFromAuth(authUser, authUser.id)) ||
        existingProfile
      return enrichUserFromAuth(profile, authUser)
    }

    await upsertProfile(authUser.id, profileFields)
    const created = profileToUser({ id: authUser.id, ...profileFields })
    const profile =
      (await syncPhoneVerifiedFromAuth(authUser, authUser.id)) ||
      (await syncEmailVerifiedFromAuth(authUser, authUser.id)) ||
      created
    return enrichUserFromAuth(profile, authUser)
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

      await upsertProfile(authUser.id, {
        ...profileFields,
        email: resolvedEmail,
        phone: normalizedPhone,
        phone_verified: false,
        phone_verified_at: null,
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

      const verificationMethod = 'phone'

      const credentials = {
        phone: normalizeRussianAuthPhone(details.russianPhone),
        password: details.password,
        options: { channel: 'sms', data: profileFields },
      }

      if (!email) {
        throw new Error("L'e-mail est obligatoire.")
      }

      await assertIdentityAvailable(
        'phone',
        normalizeRussianAuthPhone(details.russianPhone),
        null,
        { channel: 'phone' },
      )
      await assertIdentityAvailable('email', email, null, { channel: 'email' })

      const { data, error } = await supabase.auth.signUp(credentials)
      if (error) {
        throw new Error(translateAuthError(error, { channel: 'phone' }))
      }

      // Supabase anti-enumeration: duplicate email/phone returns identities: [].
      // Do not treat a missing/undefined identities field as a duplicate — phone
      // signup responses often omit identities when confirmation is pending.
      if (
        data.user &&
        !data.session &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        throw new Error('ALREADY_REGISTERED')
      }
      if (!data.user) throw new Error('Échec de création du compte.')

      if (data.session) {
        await supabase.auth.signOut()
      }

      const user = profileToUser({ id: data.user.id, ...profileFields })
      return {
        user,
        token: '',
        requiresEmailConfirmation: false,
        requiresPhoneConfirmation: true,
        pendingUserId: data.user.id,
        verificationMethod: 'phone',
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

      const authPhone = isValidAuthPhone(authUser.phone)
        ? normalizeRussianAuthPhone(authUser.phone)
        : ''
      const otpType = resolvePhoneVerificationOtpType(authUser, normalizedPhone)
      if (!otpType) {
        return { phone: normalizedPhone, user: syncedUser }
      }

      if (authPhone === normalizedPhone) {
        const primaryResend = await supabase.auth.resend({
          type: otpType,
          phone: normalizedPhone,
        })
        if (!primaryResend.error) {
          return { phone: normalizedPhone, otpType }
        }

        const fallbackType = otpType === 'sms' ? 'phone_change' : 'sms'
        const fallbackResend = await supabase.auth.resend({
          type: fallbackType,
          phone: normalizedPhone,
        })
        if (!fallbackResend.error) {
          return { phone: normalizedPhone, otpType: fallbackType }
        }

        throw new Error(
          translateAuthError(primaryResend.error || fallbackResend.error, phoneContext),
        )
      }

      await assertIdentityAvailable('phone', normalizedPhone, currentUser.id, phoneContext)

      const { error } = await supabase.auth.updateUser({ phone: normalizedPhone })
      if (error) throw new Error(translateAuthError(error, phoneContext))
      return { phone: normalizedPhone, otpType: 'phone_change' }
    },

    async confirmPhoneVerification(currentUser, { phone, token, otpType }) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const normalizedPhone = normalizeRussianAuthPhone(phone)
      const phoneContext = { channel: 'phone', intent: 'phone_verification' }

      const authUser = await getAuthenticatedAuthUser()
      const syncedUser = await syncPhoneVerifiedFromAuth(authUser, currentUser.id)
      if (syncedUser && normalizeRussianAuthPhone(syncedUser.phone || '') === normalizedPhone) {
        return syncedUser
      }

      const primaryType =
        otpType === 'sms' || otpType === 'phone_change'
          ? otpType
          : resolvePhoneVerificationOtpType(authUser, normalizedPhone) || 'phone_change'
      const fallbackType = primaryType === 'sms' ? 'phone_change' : 'sms'
      const trimmedToken = String(token || '').trim()

      let verifyResult = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: trimmedToken,
        type: primaryType,
      })
      if (verifyResult.error) {
        verifyResult = await supabase.auth.verifyOtp({
          phone: normalizedPhone,
          token: trimmedToken,
          type: fallbackType,
        })
      }
      if (verifyResult.error) {
        throw new Error(translateAuthError(verifyResult.error, phoneContext))
      }

      const verifiedAuthUser = verifyResult.data?.user || authUser
      await syncAuthProfileMetadata(verifiedAuthUser, currentUser, normalizedPhone)

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

    async requestEmailVerificationOtp(currentUser, email) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const normalizedEmail = String(email || '').trim().toLowerCase()
      if (!normalizedEmail.includes('@')) {
        throw new Error('Adresse e-mail invalide.')
      }

      const authUser = await getAuthenticatedAuthUser()
      const syncedUser = await syncEmailVerifiedFromAuth(authUser, currentUser.id)
      if (
        syncedUser?.emailVerified &&
        String(syncedUser.email || '').toLowerCase() === normalizedEmail
      ) {
        return { email: normalizedEmail, user: syncedUser }
      }

      await assertIdentityAvailable('email', normalizedEmail, currentUser.id, {
        channel: 'email',
        intent: 'email_verification',
      })

      const authEmail = String(authUser.email || '').trim().toLowerCase()
      const sameUnconfirmedEmail =
        authEmail === normalizedEmail && !authUser.email_confirmed_at

      if (sameUnconfirmedEmail) {
        let otpType = 'email_change'
        let { error } = await supabase.auth.resend({
          type: 'email_change',
          email: normalizedEmail,
        })
        if (error) {
          const second = await supabase.auth.resend({
            type: 'signup',
            email: normalizedEmail,
          })
          error = second.error
          otpType = 'signup'
        }
        if (error) {
          throw new Error(translateAuthError(error, { channel: 'email', intent: 'email_verification' }))
        }
        return { email: normalizedEmail, otpType }
      }

      const { error } = await supabase.auth.updateUser({ email: normalizedEmail })
      if (error) {
        throw new Error(translateAuthError(error, { channel: 'email', intent: 'email_verification' }))
      }

      return { email: normalizedEmail, otpType: 'email_change' }
    },

    async confirmEmailVerification(currentUser, { email, token, otpType }) {
      if (!supabase || !currentUser) throw new Error('Session expirée.')
      const normalizedEmail = String(email || '').trim().toLowerCase()
      const emailContext = { channel: 'email', intent: 'email_verification' }

      const authUser = await getAuthenticatedAuthUser()
      const syncedUser = await syncEmailVerifiedFromAuth(authUser, currentUser.id)
      if (
        syncedUser?.emailVerified &&
        String(syncedUser.email || '').toLowerCase() === normalizedEmail
      ) {
        return syncedUser
      }

      const type = otpType === 'signup' || otpType === 'email_change' ? otpType : 'email_change'
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: String(token || '').trim(),
        type,
      })
      if (error) {
        throw new Error(translateAuthError(error, emailContext))
      }

      const verifiedAuthUser = data?.user || authUser
      const confirmedEmail = String(verifiedAuthUser?.email || normalizedEmail)
        .trim()
        .toLowerCase()

      await upsertProfile(currentUser.id, {
        email: confirmedEmail,
        updated_at: new Date().toISOString(),
      })
      const user = await fetchProfile(currentUser.id)
      if (!user) throw new Error('Impossible de charger le profil après vérification e-mail.')
      return enrichUserFromAuth(user, verifiedAuthUser)
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

      // getUser() (réseau) — pas session.user local — pour email_confirmed_at à jour (Safari / autres onglets)
      let authUser = session.user
      try {
        authUser = await getAuthenticatedAuthUser()
      } catch (error) {
        console.warn('[MOXT] getUser indisponible, fallback session.user:', error?.message)
      }

      try {
        const user = await fetchOrCreateProfile(authUser)
        return { user, token: session.access_token }
      } catch (profileError) {
        console.warn('[MOXT] Profil indisponible, session conservée:', profileError?.message)
        const metadata = authUser.user_metadata || {}
        return {
          user: enrichUserFromAuth(
            profileToUser({
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
            authUser,
          ),
          token: session.access_token,
        }
      }
    },

    async sessionFromSupabaseUser(session) {
      if (!session?.user) return null
      let authUser = session.user
      try {
        authUser = await getAuthenticatedAuthUser()
      } catch {
        // Conservé session.user si getUser échoue (hors-ligne)
      }
      try {
        const user = await fetchOrCreateProfile(authUser)
        return { user, token: session.access_token }
      } catch {
        const metadata = authUser.user_metadata || {}
        return {
          user: enrichUserFromAuth(
            profileToUser({
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
            authUser,
          ),
          token: session.access_token,
        }
      }
    },

    /** Recharge Auth (getUser) + profil — corrige emailVerified stale (Safari, magic link autre onglet). */
    async refreshAuthSession() {
      if (!supabase) return null
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (!session) return null
      return this.sessionFromSupabaseUser(session)
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

    async requestPasswordChangeOtp(currentUser) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const authUser = await getAuthenticatedAuthUser()
      const email = String(authUser.email || currentUser?.email || '')
        .trim()
        .toLowerCase()
      if (!authUser.email_confirmed_at || !email.includes('@')) {
        throw new Error(
          'Confirmez votre adresse e-mail avant de modifier le mot de passe. Un code OTP sera envoyé à cette adresse.',
        )
      }
      const { error } = await supabase.auth.reauthenticate()
      if (error) throw new Error(translateAuthError(error, { channel: 'email', intent: 'password_change' }))
      return { email }
    },

    async updatePassword(newPassword, { nonce } = {}) {
      if (!supabase) throw new Error('Supabase non configuré.')
      const password = String(newPassword || '').trim()
      if (password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
      }
      const otp = String(nonce || '').trim()
      if (!/^\d{6}$/.test(otp)) {
        throw new Error('Saisissez le code à 6 chiffres reçu par e-mail.')
      }
      const { error } = await supabase.auth.updateUser({ password, nonce: otp })
      if (error) throw new Error(translateAuthError(error, { channel: 'email', intent: 'password_change' }))
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
