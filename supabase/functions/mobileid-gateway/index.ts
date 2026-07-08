/// <reference path="../deno.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2'

// ═══════════════════════════════════════════════════════════════════════════
// COLLEZ VOS CLÉS SMS AERO MOBILEID ICI (cabinet MobileID → client_id + secret)
// ═══════════════════════════════════════════════════════════════════════════
const MOBILEID_CLIENT_ID = 'c2cab649-ecbd-4b12-9f3f-fae0593ea7ff'
const MOBILEID_API_SECRET = '1c439f19d98b73f78943b0b083322738bc13f7f3d12e48ffeff668816df31bb7'
// ═══════════════════════════════════════════════════════════════════════════

const MIDSDK_BASE = 'https://midsdk.smsaero.ru'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

function phonesMatch(a: string, b: string) {
  const left = digitsOnly(a)
  const right = digitsOnly(b)
  if (!left || !right) return false
  if (left === right) return true
  if (left.length === 11 && right.length === 11) return left.slice(1) === right.slice(1)
  return false
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSha256Hex(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return toHex(sig)
}

function assertKeys() {
  if (
    !MOBILEID_CLIENT_ID ||
    MOBILEID_CLIENT_ID.includes('COLLEZ') ||
    !MOBILEID_API_SECRET ||
    MOBILEID_API_SECRET.includes('COLLEZ')
  ) {
    throw new Error('Configurez MOBILEID_CLIENT_ID et MOBILEID_API_SECRET dans mobileid-gateway/index.ts')
  }
}

async function issueInitToken(fingerprintHash: string) {
  assertKeys()
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const message = `${MOBILEID_CLIENT_ID}${fingerprintHash}${timestamp}`
  const signature = await hmacSha256Hex(message, MOBILEID_API_SECRET)

  const response = await fetch(`${MIDSDK_BASE}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: MOBILEID_CLIENT_ID,
      fingerprint_hash: fingerprintHash,
      timestamp,
      signature,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(String(payload?.message || payload?.error || 'Token MobileID refusé.'))
  }

  const token = payload?.token || payload?.data?.token
  if (!token) throw new Error('Réponse MobileID sans token.')
  return { token }
}

async function verifyWithMidSdk(sessionId: string, verifyToken: string) {
  assertKeys()
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const message = `${MOBILEID_CLIENT_ID}${sessionId}${verifyToken}${timestamp}`
  const signature = await hmacSha256Hex(message, MOBILEID_API_SECRET)

  const response = await fetch(`${MIDSDK_BASE}/api/siteverify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: MOBILEID_CLIENT_ID,
      session_id: sessionId,
      verify_token: verifyToken,
      timestamp,
      signature,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(String(payload?.message || payload?.error || 'Vérification MobileID refusée.'))
  }
  return payload
}

async function registerUser(
  admin: ReturnType<typeof createClient>,
  phone: string,
  password: string,
  email: string,
  profileFields: Record<string, unknown>,
) {
  const createPayload: Record<string, unknown> = {
    phone,
    password,
    phone_confirm: false,
    user_metadata: profileFields,
  }
  if (email) {
    createPayload.email = email
    createPayload.email_confirm = true
  }

  const { data, error } = await admin.auth.admin.createUser(createPayload as never)
  if (error) {
    const message = String(error.message || '')
    if (
      message.toLowerCase().includes('already') ||
      message.toLowerCase().includes('exists') ||
      message.toLowerCase().includes('registered')
    ) {
      throw new Error('ALREADY_REGISTERED')
    }
    throw new Error(message || 'Création du compte impossible.')
  }

  const createdUser = data.user
  if (!createdUser?.id) throw new Error('Échec de création du compte.')

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: createdUser.id,
      ...profileFields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (profileError) {
    console.warn('[MOXT] Profil inscription MobileID:', profileError.message)
  }

  return createdUser.id
}

async function signInAfterVerify(
  admin: ReturnType<typeof createClient>,
  supabaseUrl: string,
  anonKey: string,
  phone: string,
  password: string,
  email: string,
) {
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (email) {
    const emailResult = await authClient.auth.signInWithPassword({ email, password })
    if (!emailResult.error && emailResult.data.session) {
      return emailResult.data
    }
  }

  const phoneResult = await authClient.auth.signInWithPassword({ phone, password })
  if (!phoneResult.error && phoneResult.data.session) {
    return phoneResult.data
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('email')
    .eq('phone', phone)
    .maybeSingle()

  if (profile?.email) {
    const fallback = await authClient.auth.signInWithPassword({ email: profile.email, password })
    if (!fallback.error && fallback.data.session) {
      return fallback.data
    }
  }

  throw new Error(phoneResult.error?.message || 'Connexion impossible après MobileID.')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Configuration Supabase incomplète.' }, 503)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '')
    const admin = createClient(supabaseUrl, serviceRoleKey)

    // SDK MobileID → init token (POST { fingerprint_hash })
    if (!action && body?.fingerprint_hash) {
      const tokenPayload = await issueInitToken(String(body.fingerprint_hash))
      return json(tokenPayload)
    }

    if (action === 'register') {
      const phone = normalizeE164(body?.phone)
      const password = String(body?.password || '')
      const email = String(body?.email || '').trim().toLowerCase()
      const profileFields =
        body?.profileFields && typeof body.profileFields === 'object' ? body.profileFields : {}

      if (!phone || password.length < 8) {
        return json({ error: 'Numéro et mot de passe obligatoires.' }, 400)
      }

      const userId = await registerUser(admin, phone, password, email, profileFields)
      return json({ ok: true, userId, phone, email: email || null })
    }

    if (action === 'complete') {
      const phone = normalizeE164(body?.phone)
      const userId = String(body?.userId || '')
      const sessionId = String(body?.session_id || body?.sessionId || '')
      const verifyToken = String(body?.verify_token || body?.verifyToken || '')
      const password = String(body?.password || '')
      const email = String(body?.email || '').trim().toLowerCase()

      if (!phone || !userId || !sessionId || !verifyToken || !password) {
        return json({ error: 'Paramètres MobileID incomplets.' }, 400)
      }

      const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId)
      if (userError || !userData.user) {
        return json({ error: 'Compte introuvable.' }, 404)
      }
      if (!phonesMatch(userData.user.phone || '', phone)) {
        return json({ error: 'Ce numéro ne correspond pas au compte en cours de création.' }, 403)
      }

      const verifyResult = await verifyWithMidSdk(sessionId, verifyToken)
      const success = verifyResult?.success === true || verifyResult?.data?.success === true
      if (!success) {
        return json({ error: 'Vérification MobileID non confirmée.', details: verifyResult }, 400)
      }

      const { error: confirmError } = await admin.auth.admin.updateUserById(userId, {
        phone_confirm: true,
      })
      if (confirmError) {
        return json({ error: confirmError.message }, 500)
      }

      const sessionData = await signInAfterVerify(admin, supabaseUrl, anonKey, phone, password, email)
      if (!sessionData.session || !sessionData.user) {
        return json({ error: 'Session invalide après MobileID.' }, 500)
      }

      return json({
        ok: true,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        user: sessionData.user,
        emailLinkDeferred: Boolean(email && !sessionData.user.email),
      })
    }

    return json({ error: 'Action inconnue.' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur MobileID.'
    const status = message === 'ALREADY_REGISTERED' ? 409 : message.includes('introuvable') ? 404 : 400
    return json({ error: message }, status)
  }
})
