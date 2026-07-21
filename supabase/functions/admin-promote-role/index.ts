import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/** CORS permissif pour supabase.functions.invoke (navigateur) — auth réelle via JWT + mot de passe. */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const PRIVILEGED_ROLES = new Set(['admin', 'superadmin'])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const promoteSecret = Deno.env.get('MOXT_ADMIN_PROMOTE_PASSWORD')

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Configuration Supabase incomplète.' }, 503)
  }

  if (!promoteSecret) {
    return json(
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
    return json({ error: 'Session expirée.' }, 401)
  }

  let body: { userId?: string; role?: string; promotePassword?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Corps JSON invalide.' }, 400)
  }

  const userId = String(body.userId || '').trim()
  const role = String(body.role || '').trim()
  const promotePassword = String(body.promotePassword || '')

  if (!userId || !PRIVILEGED_ROLES.has(role)) {
    return json({ error: 'Promotion admin invalide.' }, 400)
  }

  if (!promotePassword || promotePassword !== promoteSecret) {
    return json({ error: 'Mot de passe de promotion administrateur incorrect.' }, 403)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData?.user) {
    return json({ error: 'Session invalide.' }, 401)
  }

  const callerId = authData.user.id
  const { data: callerProfile, error: callerError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .maybeSingle()

  if (callerError) {
    return json({ error: callerError.message }, 500)
  }

  if (callerProfile?.role !== 'superadmin') {
    return json({ error: 'Seul un superadmin peut créer un administrateur.' }, 403)
  }

  if (role === 'superadmin' && callerProfile.role !== 'superadmin') {
    return json({ error: 'Promotion superadmin refusée.' }, 403)
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    return json({ error: updateError.message }, 500)
  }

  return json({ ok: true, userId, role }, 200)
})
