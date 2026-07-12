import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseSmscWebhookPayload, readSmscRequestBody } from '../_shared/parseSmscWebhook.ts'

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

function parseEventTime(value: string | null) {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  if (/^\d{10,13}$/.test(trimmed)) {
    const ms = trimmed.length > 10 ? Number(trimmed) : Number(trimmed) * 1000
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  const parsed = new Date(trimmed.replace(/\./g, '-'))
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function verifySecret(req: Request) {
  const expected = Deno.env.get('SMSC_WEBHOOK_SECRET')
  if (!expected) return false
  const url = new URL(req.url)
  return url.searchParams.get('secret') === expected
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  if (!verifySecret(req)) {
    return json({ error: 'Secret webhook invalide.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Configuration Supabase incomplète.' }, 503)
  }

  try {
    const payload = await readSmscRequestBody(req)
    const event = parseSmscWebhookPayload(payload)
    if (!event?.smscId) {
      console.warn('[smsc-webhook] payload ignoré', payload)
      return json({ ok: true, ignored: true })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const eventTime = parseEventTime(event.eventTime)
    const now = new Date().toISOString()

    if (event.kind === 'incoming') {
      const { error } = await admin.from('smsc_events').upsert(
        {
          smsc_id: event.smscId,
          event_type: 'incoming',
          from_phone: event.fromPhone,
          to_phone: event.toPhone,
          message: event.message,
          delivery_status: '',
          event_time: eventTime,
          payload: event.payload,
          updated_at: now,
        },
        { onConflict: 'smsc_id' },
      )
      if (error) throw new Error(error.message)
      console.log('[smsc-webhook] SMS entrant', event.smscId, event.fromPhone)
      return json({ ok: true, type: 'incoming', id: event.smscId })
    }

    const { error } = await admin.from('smsc_events').upsert(
      {
        smsc_id: event.smscId,
        event_type: 'status',
        from_phone: event.fromPhone,
        to_phone: event.toPhone,
        message: '',
        delivery_status: event.deliveryStatus,
        event_time: eventTime,
        payload: event.payload,
        updated_at: now,
      },
      { onConflict: 'smsc_id' },
    )
    if (error) throw new Error(error.message)
    console.log('[smsc-webhook] statut', event.smscId, event.deliveryStatus)
    return json({ ok: true, type: 'status', id: event.smscId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook SMSC en échec.'
    console.error('[smsc-webhook]', message)
    return json({ error: message }, 500)
  }
})
