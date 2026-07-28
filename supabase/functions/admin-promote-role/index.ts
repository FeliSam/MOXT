import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'

const ALLOW_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-supabase-api-version'

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

const PRIVILEGED_ROLES = new Set(['admin', 'superadmin'])

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
    return respond(
      {
        error:
          'MOXT_ADMIN_PROMOTE_PASSWORD manquant. Définissez-le dans scripts/phase2.env puis npm run setup:admin-promote.',
      },
      503,
    )
  }

  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return respond({ error: 'Session expirée.' }, 401)
  }

  let body: { userId?: string; role?: string; promotePassword?: string }
  try {
    body = await req.json()
  } catch {
    return respond({ error: 'Corps JSON invalide.' }, 400)
  }

  const userId = String(body.userId || '').trim()
  const role = String(body.role || '').trim()
  const promotePassword = String(body.promotePassword || '')

  if (!userId || !PRIVILEGED_ROLES.has(role)) {
    return respond({ error: 'Promotion admin invalide.' }, 400)
  }

  if (!promotePassword || promotePassword !== promoteSecret) {
    return respond({ error: 'Mot de passe de promotion administrateur incorrect.' }, 403)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData?.user) {
    return respond({ error: 'Session invalide.' }, 401)
  }

  const callerId = authData.user.id
  const { data: callerProfile, error: callerError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .maybeSingle()

  if (callerError) {
    return respond({ error: callerError.message }, 500)
  }

  if (callerProfile?.role !== 'superadmin') {
    return respond({ error: 'Seul un superadmin peut créer un administrateur.' }, 403)
  }

  if (role === 'superadmin' && callerProfile.role !== 'superadmin') {
    return respond({ error: 'Promotion superadmin refusée.' }, 403)
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    return respond({ error: updateError.message }, 500)
  }

  return respond({ ok: true, userId, role }, 200)
})
