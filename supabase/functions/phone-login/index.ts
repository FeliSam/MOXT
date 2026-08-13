import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import {
  checkRateLimit,
  clientIp,
  logSecurityEvent,
} from '../_shared/rateLimit.ts'

const RATE_WINDOW_SEC = 15 * 60
const RATE_MAX_PER_IP = 30
const RATE_MAX_PER_PHONE = 8

const GENERIC_AUTH_ERROR = 'Identifiants incorrects. Vérifiez votre numéro et mot de passe.'

function json(body: Record<string, unknown>, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req || new Request('https://moxtapp.ru')),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    },
  })
}

function digitsOnly(phone = '') {
  return String(phone).replace(/\D/g, '')
}

function normalizeE164(phone = '') {
  const trimmed = String(phone).trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = digitsOnly(trimmed)
  if (!digits) return ''
  if (hasPlus || trimmed.startsWith('+')) return `+${digits}`
  if (/^8\d{10}$/.test(digits)) return `+7${digits.slice(1)}`
  return `+${digits}`
}

function phoneVariants(phone: string) {
  const e164 = normalizeE164(phone)
  const digits = digitsOnly(e164)
  const variants = new Set([e164, digits, `+${digits}`])
  if (digits.length === 11 && digits.startsWith('7')) {
    variants.add(`8${digits.slice(1)}`)
    variants.add(`+7${digits.slice(1)}`)
  }
  if (digits.length === 11 && digits.startsWith('8')) {
    variants.add(`+7${digits.slice(1)}`)
    variants.add(`7${digits.slice(1)}`)
  }
  return [...variants].filter(Boolean)
}

function sessionPayload(session: {
  access_token: string
  refresh_token: string
  expires_in?: number
  token_type?: string
}) {
  return {
    ok: true,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    token_type: session.token_type,
  }
}

Deno.serve(async (req) => {
  const respond = (body: Record<string, unknown>, status = 200) => json(body, status, req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeadersFor(req),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return respond({ error: 'Configuration Supabase incomplète.' }, 503)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const ip = clientIp(req)

  try {
    const body = await req.json()
    const phone = normalizeE164(body?.phone)
    const password = String(body?.password || '')
    if (!phone || !password) {
      return respond({ error: 'Numéro et mot de passe obligatoires.' }, 400)
    }

    const ipOk = await checkRateLimit(admin, `phone-login:ip:${ip}`, RATE_MAX_PER_IP, RATE_WINDOW_SEC)
    const phoneOk = await checkRateLimit(
      admin,
      `phone-login:phone:${phone}`,
      RATE_MAX_PER_PHONE,
      RATE_WINDOW_SEC,
    )
    if (!ipOk || !phoneOk) {
      await logSecurityEvent(admin, 'phone_login_rate_limited', phone, { ip })
      return respond({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, 429)
    }

    const variants = phoneVariants(phone)

    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id, email, phone, phone_verified')
      .in('phone', variants)
      .limit(5)

    if (profileError) {
      await logSecurityEvent(admin, 'phone_login_denied', phone, { ip, reason: 'profile_lookup' })
      return respond({ error: GENERIC_AUTH_ERROR }, 401)
    }

    let profile = profiles?.[0] || null
    if (!profile) {
      const tail = digitsOnly(phone).slice(-10)
      if (tail.length === 10) {
        const { data: loose } = await admin
          .from('profiles')
          .select('id, email, phone, phone_verified')
          .ilike('phone', `%${tail}`)
          .limit(5)
        profile = loose?.find((row) => digitsOnly(row.phone).endsWith(tail)) || null
      }
    }

    if (!profile?.id) {
      await logSecurityEvent(admin, 'phone_login_denied', phone, { ip, reason: 'unknown_phone' })
      return respond({ error: GENERIC_AUTH_ERROR }, 401)
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id)
    if (userError || !userData.user) {
      await logSecurityEvent(admin, 'phone_login_denied', phone, { ip, reason: 'auth_user' })
      return respond({ error: GENERIC_AUTH_ERROR }, 401)
    }

    const authUser = userData.user
    const authPhone = normalizeE164(authUser.phone || profile.phone || phone)
    const phoneConfirmed = Boolean(authUser.phone_confirmed_at || profile.phone_verified)

    if (authPhone && !phoneConfirmed) {
      await logSecurityEvent(admin, 'phone_login_denied', phone, { ip, reason: 'unconfirmed' })
      return respond({ error: 'MOXT_PHONE_NOT_CONFIRMED' }, 401)
    }

    if (authPhone) {
      const phoneSignIn = await admin.auth.signInWithPassword({
        phone: authPhone,
        password,
      })
      if (phoneSignIn.data?.session && phoneSignIn.data.user) {
        return respond(
          {
            ...sessionPayload(phoneSignIn.data.session),
            user: phoneSignIn.data.user,
          },
          200,
        )
      }
    }

    const email = (authUser.email || profile.email || '').trim().toLowerCase()
    if (!email) {
      await logSecurityEvent(admin, 'phone_login_denied', phone, { ip, reason: 'no_email' })
      return respond({ error: GENERIC_AUTH_ERROR }, 401)
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await authClient.auth.signInWithPassword({ email, password })
    if (error || !data.session || !data.user) {
      await logSecurityEvent(admin, 'phone_login_denied', phone, { ip, reason: 'bad_password' })
      return respond({ error: GENERIC_AUTH_ERROR }, 401)
    }

    return respond(
      {
        ...sessionPayload(data.session),
        user: data.user,
      },
      200,
    )
  } catch {
    await logSecurityEvent(admin, 'phone_login_denied', '', { ip, reason: 'exception' })
    return respond({ error: GENERIC_AUTH_ERROR }, 401)
  }
})
