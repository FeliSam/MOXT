import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Valide manuellement l'e-mail d'un utilisateur (auth.users.email_confirmed_at).
 * Réservé aux admins/superadmins — cas support : la personne ne reçoit jamais
 * l'e-mail de confirmation mais son adresse est confirmée fonctionnelle par
 * un autre canal. Nécessite le service role (auth.admin.*), donc une edge
 * function plutôt qu'une RPC SQL classique.
 */
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Configuration Supabase incomplète.' }, 503)
  }

  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return json({ error: 'Session expirée.' }, 401)
  }

  let body: { userId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Corps JSON invalide.' }, 400)
  }

  const userId = String(body.userId || '').trim()
  if (!userId) {
    return json({ error: 'Utilisateur manquant.' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData?.user) {
    return json({ error: 'Session invalide.' }, 401)
  }

  const { data: callerProfile, error: callerError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (callerError) {
    return json({ error: callerError.message }, 500)
  }

  if (!callerProfile || !['admin', 'superadmin'].includes(callerProfile.role)) {
    return json({ error: 'Réservé aux administrateurs.' }, 403)
  }

  const { data: targetUser, error: getUserError } = await admin.auth.admin.getUserById(userId)
  if (getUserError || !targetUser?.user) {
    return json({ error: 'Utilisateur introuvable.' }, 404)
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })
  if (updateError) {
    return json({ error: updateError.message }, 500)
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ email: targetUser.user.email, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (profileError) {
    return json({ error: profileError.message }, 500)
  }

  return json({ ok: true, userId }, 200)
})
