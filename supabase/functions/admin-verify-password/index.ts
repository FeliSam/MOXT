import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Vérifie le mot de passe du compte actuellement connecté, sans jamais faire
 * atteindre la session résultante au navigateur (le signInWithPassword de
 * vérification est fait ici, côté fonction, avec persistSession: false).
 * Utilisé pour confirmer les actions sensibles côté admin (ex. changement de
 * rôle) — un simple `supabase.auth.signInWithPassword` côté client
 * déclencherait un évènement SIGNED_IN qui recharge toutes les données.
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Configuration Supabase incomplète.' }, 503)
  }

  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return json({ error: 'Session expirée.' }, 401)
  }

  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Corps JSON invalide.' }, 400)
  }

  const password = String(body.password || '')
  if (!password) {
    return json({ error: 'Mot de passe requis.' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData?.user?.email) {
    return json({ error: 'Session invalide.' }, 401)
  }

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (!callerProfile || !['admin', 'superadmin'].includes(callerProfile.role)) {
    return json({ error: 'Accès réservé aux administrateurs.' }, 403)
  }

  const verifier = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: authData.user.email,
    password,
  })

  if (verifyError) {
    return json({ error: 'Mot de passe incorrect.' }, 403)
  }

  return json({ ok: true }, 200)
})
