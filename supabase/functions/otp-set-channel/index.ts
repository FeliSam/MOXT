import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { checkRateLimit, clientIp } from '../_shared/rateLimit.ts'

function json(body: Record<string, unknown>, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req || new Request('https://moxtapp.ru')),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    },
  })
}

function normalizePhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`
  if (digits.length === 10) return `+7${digits}`
  if (String(phone).trim().startsWith('+')) return `+${digits}`
  return `+${digits}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { ...corsHeadersFor(req), 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
    })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, req)

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ error: 'Service indisponible' }, 503, req)

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const ip = clientIp(req)
  const limited = await checkRateLimit(admin, `otp-ch:${ip}`, 40, 15 * 60)
  if (!limited) return json({ error: 'Trop de tentatives. Réessayez plus tard.' }, 429, req)

  let payload: { phone?: string; channel?: string } = {}
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'JSON invalide' }, 400, req)
  }

  const phone = normalizePhone(payload.phone || '')
  const raw = String(payload.channel || 'sms').toLowerCase()
  const channel = raw === 'telegram' || raw === 'flashcall' || raw === 'call' ? (raw === 'call' ? 'flashcall' : raw) : 'sms'
  if (!phone.startsWith('+7') || phone.length !== 12) {
    return json({ error: 'Numéro russe invalide' }, 400, req)
  }

  const { error } = await admin.from('otp_delivery').upsert({
    phone,
    channel,
    otp: null,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) {
    console.error('[otp-set-channel]', error.message)
    return json({ error: 'Enregistrement du canal impossible' }, 500, req)
  }
  return json({ ok: true, channel }, 200, req)
})
