import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEFAULT_ORIGINS = ['https://moxtapp.ru', 'https://www.moxtapp.ru']
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_MAX_PER_IP = 30
const RATE_MAX_PER_PHONE = 8

const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function allowedOrigins() {
  const raw = Deno.env.get('MOXT_ALLOWED_ORIGINS') || ''
  const fromEnv = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return fromEnv.length ? fromEnv : DEFAULT_ORIGINS
}

function corsHeaders(origin: string | null) {
  const allowed = allowedOrigins()
  const resolved =
    origin && allowed.includes(origin) ? origin : allowed[0] || DEFAULT_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': resolved,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  }
}

function json(body: Record<string, unknown>, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function rateLimit(key: string, max: number) {
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  bucket.count += 1
  if (bucket.count > max) return true
  return false
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

const GENERIC_AUTH_ERROR = 'Identifiants incorrects. Vérifiez votre numéro et mot de passe.'

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Configuration Supabase incomplète.' }, 503, origin)
  }

  const ip = clientIp(req)

  try {
    const body = await req.json()
    const phone = normalizeE164(body?.phone)
    const password = String(body?.password || '')
    if (!phone || !password) {
      return json({ error: 'Numéro et mot de passe obligatoires.' }, 400, origin)
    }

    if (rateLimit(`ip:${ip}`, RATE_MAX_PER_IP) || rateLimit(`phone:${phone}`, RATE_MAX_PER_PHONE)) {
      return json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, 429, origin)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const variants = phoneVariants(phone)

    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id, email, phone, phone_verified')
      .in('phone', variants)
      .limit(5)

    if (profileError) {
      return json({ error: GENERIC_AUTH_ERROR }, 401, origin)
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
      return json({ error: GENERIC_AUTH_ERROR }, 401, origin)
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id)
    if (userError || !userData.user) {
      return json({ error: GENERIC_AUTH_ERROR }, 401, origin)
    }

    const authUser = userData.user
    const authPhone = normalizeE164(authUser.phone || profile.phone || phone)
    const phoneConfirmed = Boolean(authUser.phone_confirmed_at || profile.phone_verified)

    if (authPhone && !phoneConfirmed) {
      return json({ error: GENERIC_AUTH_ERROR }, 401, origin)
    }

    if (authPhone) {
      const phoneSignIn = await admin.auth.signInWithPassword({
        phone: authPhone,
        password,
      })
      if (phoneSignIn.data?.session && phoneSignIn.data.user) {
        return json(
          {
            ...sessionPayload(phoneSignIn.data.session),
            user: phoneSignIn.data.user,
          },
          200,
          origin,
        )
      }
    }

    const email = (authUser.email || profile.email || '').trim().toLowerCase()
    if (!email) {
      return json({ error: GENERIC_AUTH_ERROR }, 401, origin)
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await authClient.auth.signInWithPassword({ email, password })
    if (error || !data.session || !data.user) {
      return json({ error: GENERIC_AUTH_ERROR }, 401, origin)
    }

    return json(
      {
        ...sessionPayload(data.session),
        user: data.user,
      },
      200,
      origin,
    )
  } catch {
    return json({ error: GENERIC_AUTH_ERROR }, 401, origin)
  }
})
