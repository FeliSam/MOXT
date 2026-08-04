import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import {
  checkRateLimit,
  clientIp,
  logSecurityEvent,
} from '../_shared/rateLimit.ts'

/**
 * Valide manuellement le numéro d'un utilisateur (auth.users.phone_confirmed_at
 * + profiles.phone_verified). Aligné sur admin-verify-email : service role requis
 * pour phone_confirm via Auth Admin API.
 */
const ALLOW_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-supabase-api-version'

const RATE_WINDOW_SEC = 15 * 60
const RATE_MAX = 20

function digitsOnly(phone = '') {
  return String(phone).replace(/\D/g, '')
}

function normalizeE164(phone = '') {
  const trimmed = String(phone).trim()
  const digits = digitsOnly(trimmed)
  if (!digits) return ''
  if (trimmed.startsWith('+') || /^\+\d+$/.test(trimmed)) return `+${digits}`
  if (/^8\d{10}$/.test(digits)) return `+7${digits.slice(1)}`
  if (/^7\d{10}$/.test(digits)) return `+${digits}`
  return `+${digits}`
}

function json(body: Record<string, unknown>, status = 200, req?: Request) {
  const cors = corsHeadersFor(req || new Request('https://moxtapp.ru'), ALLOW_HEADERS)
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    },
  })
}

Deno.serve(async (req) => {
  const respond = (body: Record<string, unknown>, status = 200) => json(body, status, req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeadersFor(req, ALLOW_HEADERS),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  if (req.method !== 'POST') {
    return respond({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return respond({ error: 'Configuration Supabase incomplète.' }, 503)
  }

  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return respond({ error: 'Session expirée.' }, 401)
  }

  let body: { userId?: string; phone?: string }
  try {
    body = await req.json()
  } catch {
    return respond({ error: 'Corps JSON invalide.' }, 400)
  }

  const userId = String(body.userId || '').trim()
  if (!userId) {
    return respond({ error: 'Utilisateur manquant.' }, 400)
  }
  const requestedPhone = normalizeE164(body.phone || '')

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData?.user) {
    return respond({ error: 'Session invalide.' }, 401)
  }

  const ip = clientIp(req)
  const callerId = authData.user.id
  const ipOk = await checkRateLimit(admin, `admin-verify-phone:ip:${ip}`, RATE_MAX, RATE_WINDOW_SEC)
  const userOk = await checkRateLimit(
    admin,
    `admin-verify-phone:user:${callerId}`,
    RATE_MAX,
    RATE_WINDOW_SEC,
  )
  if (!ipOk || !userOk) {
    await logSecurityEvent(admin, 'admin_verify_phone_rate_limited', callerId, { ip, target: userId })
    return respond({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, 429)
  }

  const { data: callerProfile, error: callerError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .maybeSingle()

  if (callerError) {
    return respond({ error: callerError.message }, 500)
  }

  if (!callerProfile || !['admin', 'superadmin'].includes(callerProfile.role)) {
    await logSecurityEvent(admin, 'admin_verify_phone_forbidden', callerId, { ip })
    return respond({ error: 'Réservé aux administrateurs.' }, 403)
  }

  const { data: targetUser, error: getUserError } = await admin.auth.admin.getUserById(userId)
  if (getUserError || !targetUser?.user) {
    return respond({ error: 'Utilisateur introuvable.' }, 404)
  }

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('phone')
    .eq('id', userId)
    .maybeSingle()

  const nextPhone =
    requestedPhone ||
    normalizeE164(targetUser.user.phone || '') ||
    normalizeE164(targetProfile?.phone || '')

  if (!nextPhone) {
    return respond({ error: 'Aucun numéro à valider pour cet utilisateur.' }, 400)
  }

  const authPatch: { phone: string; phone_confirm: true } = {
    phone: nextPhone,
    phone_confirm: true,
  }
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, authPatch)
  if (updateError) {
    return respond({ error: updateError.message }, 500)
  }

  const now = new Date().toISOString()
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      phone: nextPhone,
      phone_verified: true,
      phone_verified_at: now,
      updated_at: now,
    })
    .eq('id', userId)
  if (profileError) {
    return respond({ error: profileError.message }, 500)
  }

  // Notification demandeur : via trigger phone_assist (file) ou client (fiche user).

  await logSecurityEvent(admin, 'admin_verify_phone_ok', callerId, { ip, target: userId })
  return respond({ ok: true, userId, phone: nextPhone }, 200)
})
