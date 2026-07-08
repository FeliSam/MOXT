import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const body = await req.json()
    const phone = normalizeE164(body?.phone)
    const password = String(body?.password || '')
    if (!phone || !password) {
      return json({ error: 'Numéro et mot de passe obligatoires.' }, 400)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const variants = phoneVariants(phone)

    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id, email, phone')
      .in('phone', variants)
      .limit(5)

    if (profileError) {
      return json({ error: profileError.message }, 500)
    }

    let profile = profiles?.[0] || null
    if (!profile) {
      // Recherche souple sur les 10 derniers chiffres (numéros RU)
      const tail = digitsOnly(phone).slice(-10)
      if (tail.length === 10) {
        const { data: loose } = await admin
          .from('profiles')
          .select('id, email, phone')
          .ilike('phone', `%${tail}`)
          .limit(5)
        profile = loose?.find((row) => digitsOnly(row.phone).endsWith(tail)) || null
      }
    }

    if (!profile?.id) {
      return json({ error: 'Identifiants incorrects. Vérifiez votre numéro et mot de passe.' }, 401)
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id)
    if (userError || !userData.user) {
      return json({ error: 'Compte introuvable.' }, 404)
    }

    const email = (userData.user.email || profile.email || '').trim().toLowerCase()
    if (!email) {
      return json(
        {
          error:
            'Ce compte n’a pas d’e-mail associé. Activez Phone dans Supabase Auth, ou connectez-vous avec votre e-mail.',
        },
        400,
      )
    }

    // Connexion via e-mail (fonctionne même si le provider Phone est désactivé).
    const authClient = createClient(supabaseUrl, anonKey)
    const { data, error } = await authClient.auth.signInWithPassword({ email, password })
    if (error) {
      return json(
        { error: 'Identifiants incorrects. Vérifiez votre numéro et mot de passe.' },
        401,
      )
    }
    if (!data.session || !data.user) {
      return json({ error: 'Connexion impossible.' }, 500)
    }

    return json({
      ok: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
      user: data.user,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de connexion.'
    return json({ error: message }, 400)
  }
})
