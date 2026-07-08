import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TG_API = 'https://gatewayapi.telegram.org'

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

function phonesMatch(a: string, b: string) {
  const left = digitsOnly(a)
  const right = digitsOnly(b)
  if (!left || !right) return false
  if (left === right) return true
  // RU : 8XXXXXXXXXX vs 7XXXXXXXXXX
  if (left.length === 11 && right.length === 11) {
    return left.slice(1) === right.slice(1)
  }
  return false
}

async function tgPost(token: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) {
    const message =
      payload?.error ||
      payload?.description ||
      payload?.result?.error ||
      `Telegram Gateway (${response.status})`
    throw new Error(String(message))
  }
  return payload?.result ?? payload
}

function verificationStatusOf(result: Record<string, unknown> | null | undefined) {
  const status =
    (result?.verification_status as { status?: string } | undefined)?.status ||
    (result as { status?: string } | undefined)?.status ||
    ''
  return String(status)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const token = Deno.env.get('TELEGRAM_GATEWAY_TOKEN')
  if (!token) {
    return json({ error: 'TELEGRAM_GATEWAY_TOKEN non configuré sur le serveur.' }, 503)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Configuration Supabase incomplète.' }, 503)
  }

  try {
    const body = await req.json()
    const action = String(body?.action || '')
    const phone = normalizeE164(body?.phone)
    const userId = String(body?.userId || '')
    const requestId = String(body?.requestId || '')
    const code = String(body?.code || '').trim()
    const password = String(body?.password || '')
    const email = String(body?.email || '').trim().toLowerCase()
    const profileFields =
      body?.profileFields && typeof body.profileFields === 'object' ? body.profileFields : {}

    const admin = createClient(supabaseUrl, serviceRoleKey)

    async function assertPendingSignup(existingUserId: string, expectedPhone: string) {
      if (!existingUserId || !expectedPhone) {
        throw new Error('Paramètres manquants.')
      }
      const { data, error } = await admin.auth.admin.getUserById(existingUserId)
      if (error || !data.user) {
        throw new Error('Compte introuvable.')
      }
      const userPhone = normalizeE164(data.user.phone || '')
      if (!phonesMatch(userPhone, expectedPhone)) {
        throw new Error(
          `Ce numéro ne correspond pas au compte en cours de création (${userPhone || 'vide'}).`,
        )
      }
      if (data.user.phone_confirmed_at) {
        throw new Error('Ce numéro est déjà confirmé. Connectez-vous avec votre mot de passe.')
      }
      return data.user
    }

    if (action === 'register') {
      if (!phone || !password) {
        return json({ error: 'Numéro et mot de passe obligatoires.' }, 400)
      }
      if (password.length < 8) {
        return json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, 400)
      }

      const createPayload: Record<string, unknown> = {
        phone,
        password,
        phone_confirm: false,
        user_metadata: profileFields,
      }
      if (email) {
        createPayload.email = email
        // Requis pour pouvoir se connecter ensuite (Phone auth désactivé côté projet).
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
          return json({ error: 'ALREADY_REGISTERED' }, 409)
        }
        return json({ error: message || 'Création du compte impossible.' }, 400)
      }

      const createdUser = data.user
      if (!createdUser?.id) {
        return json({ error: 'Échec de création du compte.' }, 500)
      }

      const { error: profileError } = await admin.from('profiles').upsert(
        {
          id: createdUser.id,
          ...profileFields,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      if (profileError) {
        console.warn('[MOXT] Profil inscription Telegram:', profileError.message)
      }

      return json({
        ok: true,
        userId: createdUser.id,
        phone,
        email: email || null,
      })
    }

    if (action === 'send') {
      await assertPendingSignup(userId, phone)

      // Nouveau request_id à chaque envoi (renvoi inclus) — un request_id
      // déjà consommé par sendVerificationMessage ne peut pas être réutilisé.
      const ability = await tgPost(token, 'checkSendAbility', { phone_number: phone })
      const gatewayRequestId = String(ability?.request_id || '')

      const sendPayload: Record<string, unknown> = {
        phone_number: phone,
        code_length: 6,
        ttl: 300,
        payload: `moxt-signup:${userId}`,
      }
      if (gatewayRequestId) sendPayload.request_id = gatewayRequestId

      const sent = await tgPost(token, 'sendVerificationMessage', sendPayload)
      const finalRequestId = String(sent?.request_id || gatewayRequestId || '')
      if (!finalRequestId) {
        return json({ error: 'Impossible d’obtenir un identifiant de vérification Telegram.' }, 502)
      }

      return json({ ok: true, requestId: finalRequestId, delivery: 'telegram' })
    }

    if (action === 'verify') {
      await assertPendingSignup(userId, phone)

      if (!requestId || !/^\d{4,8}$/.test(code)) {
        return json({ error: 'Code ou identifiant de requête invalide.' }, 400)
      }

      const statusResult = await tgPost(token, 'checkVerificationStatus', {
        request_id: requestId,
        code,
      })
      const verificationStatus = verificationStatusOf(statusResult as Record<string, unknown>)
      if (verificationStatus !== 'code_valid') {
        const friendly =
          verificationStatus === 'code_invalid'
            ? 'Code Telegram incorrect. Vérifiez les chiffres ou renvoyez un nouveau code.'
            : verificationStatus === 'expired'
              ? 'Le code Telegram a expiré. Renvoyez un nouveau code.'
              : verificationStatus === 'code_max_attempts_exceeded'
                ? 'Trop de tentatives. Renvoyez un nouveau code Telegram.'
                : `Code Telegram invalide ou expiré${verificationStatus ? ` (${verificationStatus})` : ''}.`
        return json({ error: friendly, status: verificationStatus || 'code_invalid' }, 400)
      }

      const { error: confirmError } = await admin.auth.admin.updateUserById(userId, {
        phone_confirm: true,
      })
      if (confirmError) {
        return json({ error: confirmError.message }, 500)
      }

      return json({ ok: true, phoneConfirmed: true })
    }

    return json({ error: 'Action inconnue.' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur Telegram Gateway.'
    const status = message.includes('introuvable') ? 404 : message.includes('correspond') ? 403 : 400
    return json({ error: message }, status)
  }
})
