import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, corsPreflight } from '../_shared/cors.ts'
import { checkRateLimit, clientIp, logSecurityEvent } from '../_shared/rateLimit.ts'
import { createPayment, parseWebhook, type StarsPaymentProvider } from '../_shared/starsPayment.ts'

const ALLOW_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-moxt-stars-provider'

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

function providerFromEnv(): StarsPaymentProvider {
  const name = (Deno.env.get('MOXT_STARS_PAYMENT_PROVIDER') || 'stub').trim()
  return { name }
}

Deno.serve(async (req) => {
  const respond = (body: Record<string, unknown>, status = 200) => json(body, status, req)
  if (req.method === 'OPTIONS') return corsPreflight(req, ALLOW_HEADERS)
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return respond({ error: 'Server misconfigured' }, 500)

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'create'
  const provider = providerFromEnv()

  if (action === 'webhook') {
    const parsed = await parseWebhook(provider, req)
    if (!parsed.ok) {
      await logSecurityEvent(admin, 'stars_webhook_invalid', parsed.reason || '', {})
      return respond({ error: parsed.reason || 'invalid webhook' }, 401)
    }
    if (parsed.purchaseId && parsed.status === 'paid') {
      const { error } = await admin.rpc('stars_fulfill_purchase', {
        p_purchase_id: parsed.purchaseId,
      })
      if (error) return respond({ error: error.message }, 400)
    }
    if (parsed.purchaseId && parsed.status === 'failed') {
      await admin.rpc('stars_fail_purchase', { p_purchase_id: parsed.purchaseId })
    }
    return respond({ ok: true })
  }

  const allowed = await checkRateLimit(admin, `stars-purchase:${clientIp(req)}`, 20, 15 * 60)
  if (!allowed) return respond({ error: 'rate_limited' }, 429)

  const authHeader = req.headers.get('authorization') || ''
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) return respond({ error: 'unauthorized' }, 401)

  let body: { packageId?: string; idempotencyKey?: string; ownerType?: string; ownerId?: string }
  try {
    body = await req.json()
  } catch {
    return respond({ error: 'invalid json' }, 400)
  }

  const { data, error } = await userClient.rpc('stars_create_purchase', {
    p_package_id: body.packageId,
    p_idempotency_key: body.idempotencyKey,
    p_owner_type: body.ownerType || 'user',
    p_owner_id: body.ownerId || user.id,
  })
  if (error) return respond({ error: error.message }, 400)

  const checkout = await createPayment(provider, {
    purchaseId: data?.purchaseId,
    amountRub: data?.priceRub,
    stars: data?.stars,
    userId: user.id,
  })

  return respond({ ...data, checkout })
})
