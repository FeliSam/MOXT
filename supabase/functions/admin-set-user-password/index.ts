import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import {
  checkRateLimit,
  clientIp,
  logSecurityEvent,
  timingSafeEqualString,
} from '../_shared/rateLimit.ts'

const ALLOW_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-supabase-api-version'

const RATE_WINDOW_SEC = 15 * 60
const RATE_MAX = 10

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

function digitsOnly(value = '') {
  return String(value).replace(/\D/g, '')
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
  const promoteSecret = Deno.env.get('MOXT_ADMIN_PROMOTE_PASSWORD')

  if (!supabaseUrl || !serviceRoleKey) {
    return respond({ error: 'Configuration Supabase incomplète.' }, 503)
  }

  if (!promoteSecret) {
    return respond({ error: 'MOXT_ADMIN_PROMOTE_PASSWORD manquant.' }, 503)
  }

  let body: { phone?: string; email?: string; userId?: string; password?: string; promotePassword?: string }
  try {
    body = await req.json()
  } catch {
    return respond({ error: 'Corps JSON invalide.' }, 400)
  }

  const promotePassword = String(body.promotePassword || '')
  const password = String(body.password || '')
  const phone = String(body.phone || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const userId = String(body.userId || '').trim()

  if (!timingSafeEqualString(promotePassword, promoteSecret)) {
    return respond({ error: 'Mot de passe ops refusé.' }, 403)
  }

  if (!password || password.length < 8) {
    return respond({ error: 'Mot de passe trop court (min. 8 caractères).' }, 400)
  }

  if (!userId && !phone && !email) {
    return respond({ error: 'Indiquez userId, phone ou email.' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const ip = clientIp(req)

  const ipOk = await checkRateLimit(admin, `admin-set-password:ip:${ip}`, RATE_MAX, RATE_WINDOW_SEC)
  if (!ipOk) {
    return respond({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, 429)
  }

  let resolvedId = userId
  if (!resolvedId && phone) {
    const tail = digitsOnly(phone).slice(-10)
    const { data, error } = await admin
      .from('profiles')
      .select('id, phone')
      .or(`phone.eq.${phone},phone.ilike.%${tail}%`)
      .limit(5)
    if (error) return respond({ error: error.message }, 500)
    resolvedId =
      data?.find((row) => digitsOnly(row.phone).endsWith(tail))?.id ||
      data?.find((row) => row.phone === phone)?.id ||
      data?.[0]?.id ||
      ''
  }

  if (!resolvedId && email) {
    const { data, error } = await admin.from('profiles').select('id').eq('email', email).maybeSingle()
    if (error) return respond({ error: error.message }, 500)
    resolvedId = data?.id || ''
  }

  if (!resolvedId) {
    await logSecurityEvent(admin, 'admin_set_password_denied', phone || email, { ip, reason: 'not_found' })
    return respond({ error: 'Utilisateur introuvable.' }, 404)
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(resolvedId, { password })
  if (updateError) {
    await logSecurityEvent(admin, 'admin_set_password_denied', resolvedId, {
      ip,
      reason: updateError.message,
    })
    return respond({ error: updateError.message }, 500)
  }

  await logSecurityEvent(admin, 'admin_set_password_ok', resolvedId, { ip })
  return respond({ ok: true, userId: resolvedId }, 200)
})
