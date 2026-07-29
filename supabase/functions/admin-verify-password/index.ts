import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import {
  checkRateLimit,
  clientIp,
  logSecurityEvent,
} from '../_shared/rateLimit.ts'

/**
 * Vérifie le mot de passe du compte actuellement connecté, sans jamais faire
 * atteindre la session résultante au navigateur (le signInWithPassword de
 * vérification est fait ici, côté fonction, avec persistSession: false).
 * Utilisé pour confirmer les actions sensibles côté admin (ex. changement de
 * rôle) — un simple `supabase.auth.signInWithPassword` côté client
 * déclencherait un évènement SIGNED_IN qui recharge toutes les données.
 */
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return respond({ error: 'Configuration Supabase incomplète.' }, 503)
  }

  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return respond({ error: 'Session expirée.' }, 401)
  }

  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return respond({ error: 'Corps JSON invalide.' }, 400)
  }

  const password = String(body.password || '')
  if (!password) {
    return respond({ error: 'Mot de passe requis.' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData?.user?.email) {
    return respond({ error: 'Session invalide.' }, 401)
  }

  const ip = clientIp(req)
  const userId = authData.user.id
  const ipOk = await checkRateLimit(admin, `admin-verify-password:ip:${ip}`, RATE_MAX, RATE_WINDOW_SEC)
  const userOk = await checkRateLimit(
    admin,
    `admin-verify-password:user:${userId}`,
    RATE_MAX,
    RATE_WINDOW_SEC,
  )
  if (!ipOk || !userOk) {
    await logSecurityEvent(admin, 'admin_verify_password_rate_limited', userId, { ip })
    return respond({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, 429)
  }

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (!callerProfile || !['admin', 'superadmin'].includes(callerProfile.role)) {
    await logSecurityEvent(admin, 'admin_verify_password_forbidden', userId, { ip })
    return respond({ error: 'Accès réservé aux administrateurs.' }, 403)
  }

  const verifier = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: authData.user.email,
    password,
  })

  if (verifyError) {
    await logSecurityEvent(admin, 'admin_verify_password_denied', userId, { ip })
    return respond({ error: 'Mot de passe incorrect.' }, 403)
  }

  return respond({ ok: true }, 200)
})
