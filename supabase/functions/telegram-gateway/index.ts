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

function normalizeE164(phone = '') {
  const trimmed = String(phone).trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  if (hasPlus || trimmed.startsWith('+')) return `+${digits}`
  if (/^8\d{10}$/.test(digits)) return `+7${digits.slice(1)}`
  return `+${digits}`
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

    const admin = createClient(supabaseUrl, serviceRoleKey)

    async function assertPendingSignup() {
      if (!userId || !phone) {
        throw new Error('Paramètres manquants.')
      }
      const { data, error } = await admin.auth.admin.getUserById(userId)
      if (error || !data.user) {
        throw new Error('Compte introuvable.')
      }
      const userPhone = normalizeE164(data.user.phone || '')
      if (userPhone !== phone) {
        throw new Error('Ce numéro ne correspond pas au compte en cours de création.')
      }
      if (data.user.phone_confirmed_at) {
        throw new Error('Ce numéro est déjà confirmé.')
      }
      return data.user
    }

    if (action === 'send') {
      await assertPendingSignup()

      let gatewayRequestId = requestId || ''
      if (!gatewayRequestId) {
        const ability = await tgPost(token, 'checkSendAbility', { phone_number: phone })
        gatewayRequestId = String(ability?.request_id || '')
      }

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
      await assertPendingSignup()

      if (!requestId || !/^\d{4,8}$/.test(code)) {
        return json({ error: 'Code ou identifiant de requête invalide.' }, 400)
      }

      const statusResult = await tgPost(token, 'checkVerificationStatus', {
        request_id: requestId,
        code,
      })
      const verificationStatus = statusResult?.verification_status?.status
      if (verificationStatus !== 'code_valid') {
        return json(
          {
            error: 'Code Telegram invalide ou expiré.',
            status: verificationStatus || 'code_invalid',
          },
          400,
        )
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
