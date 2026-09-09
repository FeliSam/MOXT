import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { checkRateLimit, clientIp } from '../_shared/rateLimit.ts'
import { flashcallDigits } from '../_shared/sigmaSms.ts'

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
  const limited = await checkRateLimit(admin, `otp-fc:${ip}`, 25, 15 * 60)
  if (!limited) return json({ error: 'Trop de tentatives. Réessayez plus tard.' }, 429, req)

  let payload: { phone?: string; digits?: string } = {}
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'JSON invalide' }, 400, req)
  }

  const phone = normalizePhone(payload.phone || '')
  const digits = String(payload.digits || '').replace(/\D/g, '')
  if (!phone || digits.length < 4) {
    return json({ error: 'Saisissez les 4 derniers chiffres du numéro qui appelle.' }, 400, req)
  }

  const { data: row, error: readError } = await admin
    .from('otp_delivery')
    .select('otp, channel, expires_at')
    .eq('phone', phone)
    .maybeSingle()

  if (readError || !row?.otp || row.channel !== 'flashcall') {
    return json({ error: 'Aucun appel en cours. Renvoyez le code.' }, 400, req)
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return json({ error: 'L’appel a expiré. Renvoyez le code.' }, 400, req)
  }
  if (flashcallDigits(String(row.otp)) !== digits.slice(-4)) {
    return json({ error: 'Ces chiffres ne correspondent pas au numéro qui a appelé.' }, 400, req)
  }

  const { data, error } = await admin.auth.verifyOtp({
    phone,
    token: String(row.otp),
    type: 'sms',
  })
  if (error || !data?.session) {
    const retry = await admin.auth.verifyOtp({
      phone,
      token: String(row.otp),
      type: 'phone_change',
    })
    if (retry.error || !retry.data?.session) {
      return json({ error: error?.message || retry.error?.message || 'Code invalide' }, 400, req)
    }
    await admin.from('otp_delivery').delete().eq('phone', phone)
    const session = retry.data.session
    return json({
      ok: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      token_type: session.token_type,
    }, 200, req)
  }

  await admin.from('otp_delivery').delete().eq('phone', phone)
  const session = data.session
  return json({
    ok: true,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    token_type: session.token_type,
  }, 200, req)
})
