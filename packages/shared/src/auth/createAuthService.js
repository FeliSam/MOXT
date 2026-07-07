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
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} supabase
 * @param {{
 *   getOAuthRedirectUrl?: () => string,
 *   getEmailRedirectUrl?: () => string,
 *   getPasswordResetRedirectUrl?: () => string,
 * }} redirects
 */
export function createAuthService(supabase, redirects = {}) {
  const getOAuthRedirectUrl = redirects.getOAuthRedirectUrl ?? (() => '')
  const getEmailRedirectUrl = redirects.getEmailRedirectUrl ?? (() => '')
  const getPasswordResetRedirectUrl = redirects.getPasswordResetRedirectUrl ?? (() => '')

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
      const credentials = loginIdentifier.includes('@')
        ? { email: loginIdentifier.toLowerCase(), password }
        : { phone: normalizeRussianAuthPhone(loginIdentifier), password }
      const { data, error } = await supabase.auth.signInWithPassword({ ...credentials })
      if (error) throw new Error(error.message)
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
      return {
        user,
        token: data.session?.access_token || '',
        requiresEmailConfirmation: verificationMethod === 'email' && !data.session,
        requiresPhoneConfirmation: verificationMethod === 'phone' && !data.session,
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

    async restoreSession() {
      if (!supabase) return null
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) return null

      try {
        const user = await fetchOrCreateProfile(data.session.user)
        return { user, token: data.session.access_token }
      } catch (profileError) {
        console.warn('[MOXT] Profil indisponible, session conservée:', profileError?.message)
        const authUser = data.session.user
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
          token: data.session.access_token,
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

    async requestPasswordReset(email) {
      if (!supabase) return true
      const redirectTo = getPasswordResetRedirectUrl()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || undefined,
      })
      if (error) throw new Error(error.message)
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
