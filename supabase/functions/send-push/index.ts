import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'
import {
  buildWebPushPayload,
  isAuthorizedDispatch,
  isRecentNotification,
  parseJsonField,
  shouldDispatchWebPush,
} from '../_shared/pushDispatch.ts'
import { isStaleFcmError, sendFcmToDevice } from '../_shared/fcmPush.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-moxt-push-secret',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Supabase service role indisponible.')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function claimDispatch(supabase: ReturnType<typeof createServiceClient>, notificationId: string) {
  const { error } = await supabase.from('push_dispatch_log').insert({
    notification_id: notificationId,
    success: false,
    delivered_count: 0,
  })
  if (error?.code === '23505') {
    return false
  }
  if (error) throw error
  return true
}

async function finalizeDispatch(
  supabase: ReturnType<typeof createServiceClient>,
  notificationId: string,
  {
    deliveredCount,
    error,
    webDelivered = 0,
    nativeDelivered = 0,
  }: { deliveredCount: number; error?: string; webDelivered?: number; nativeDelivered?: number },
) {
  await supabase
    .from('push_dispatch_log')
    .update({
      success: !error,
      delivered_count: deliveredCount,
      error: error || null,
      dispatched_at: new Date().toISOString(),
    })
    .eq('notification_id', notificationId)

  if (webDelivered || nativeDelivered) {
    console.log('[send-push]', { notificationId, webDelivered, nativeDelivered })
  }
}

async function dispatchWebPush(
  subscriptions: Array<{
    id: string
    endpoint: string
    p256dh?: string | null
    auth_key?: string | null
    subscription_json?: unknown
  }>,
  payload: ReturnType<typeof buildWebPushPayload>,
) {
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') || Deno.env.get('VITE_VAPID_PUBLIC_KEY')
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@moxtapp.ru'

  if (!vapidPublic || !vapidPrivate || !subscriptions.length) {
    return { delivered: 0, staleIds: [] as string[] }
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
  const body = JSON.stringify(payload)
  let delivered = 0
  const staleIds: string[] = []

  for (const subscription of subscriptions) {
    const pushSubscription =
      subscription.subscription_json ||
      ({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth_key,
        },
      } as webpush.PushSubscription)

    try {
      await webpush.sendNotification(pushSubscription as webpush.PushSubscription, body)
      delivered += 1
    } catch (error) {
      const statusCode = (error as { statusCode?: number })?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        staleIds.push(subscription.id)
      }
      console.error('[send-push/web]', subscription.endpoint, error)
    }
  }

  return { delivered, staleIds }
}

async function dispatchNativePush(
  subscriptions: Array<{ id: string; endpoint: string; platform?: string | null }>,
  payload: ReturnType<typeof buildWebPushPayload>,
) {
  const fcmJson = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON') || ''
  if (!fcmJson.trim() || !subscriptions.length) {
    return { delivered: 0, staleIds: [] as string[] }
  }

  let delivered = 0
  const staleIds: string[] = []

  for (const subscription of subscriptions) {
    try {
      await sendFcmToDevice(fcmJson, subscription.endpoint, {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      })
      delivered += 1
    } catch (error) {
      if (isStaleFcmError(error)) {
        staleIds.push(subscription.id)
      }
      console.error('[send-push/fcm]', subscription.platform, subscription.endpoint, error)
    }
  }

  return { delivered, staleIds }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const dispatchSecret = Deno.env.get('PUSH_DISPATCH_SECRET') || ''
  const hasSecretAuth = isAuthorizedDispatch(req, dispatchSecret)

  let body: { notificationId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'JSON invalide.' }, 400)
  }

  const notificationId = body.notificationId?.trim()
  if (!notificationId) {
    return json({ error: 'notificationId requis.' }, 400)
  }

  const supabase = createServiceClient()

  const { data: notificationPreview } = await supabase
    .from('notifications')
    .select('created_at')
    .eq('id', notificationId)
    .maybeSingle()

  if (!hasSecretAuth && !isRecentNotification(notificationPreview?.created_at)) {
    return json({ error: 'Unauthorized' }, 401)
  }
  const claimed = await claimDispatch(supabase, notificationId)
  if (!claimed) {
    return json({ ok: true, skipped: 'already_dispatched' })
  }

  const { data: notification, error: notificationError } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, type, link, priority')
    .eq('id', notificationId)
    .maybeSingle()

  if (notificationError) {
    await finalizeDispatch(supabase, notificationId, { deliveredCount: 0, error: notificationError.message })
    return json({ error: notificationError.message }, 500)
  }

  if (!notification) {
    await finalizeDispatch(supabase, notificationId, { deliveredCount: 0, error: 'notification_not_found' })
    return json({ error: 'Notification introuvable.' }, 404)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', notification.user_id)
    .maybeSingle()

  const preferences = parseJsonField(profile?.preferences, {})
  if (!shouldDispatchWebPush(preferences, notification)) {
    await finalizeDispatch(supabase, notificationId, { deliveredCount: 0 })
    return json({ ok: true, skipped: 'preferences' })
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('device_subscriptions')
    .select('id, endpoint, p256dh, auth_key, subscription_json, platform')
    .eq('user_id', notification.user_id)
    .eq('enabled', true)

  if (subscriptionsError) {
    await finalizeDispatch(supabase, notificationId, { deliveredCount: 0, error: subscriptionsError.message })
    return json({ error: subscriptionsError.message }, 500)
  }

  if (!subscriptions?.length) {
    await finalizeDispatch(supabase, notificationId, { deliveredCount: 0 })
    return json({ ok: true, delivered: 0, skipped: 'no_subscriptions' })
  }

  const payload = buildWebPushPayload(notification)
  const webSubs = subscriptions.filter((s) => s.platform === 'web')
  const nativeSubs = subscriptions.filter((s) => s.platform === 'android' || s.platform === 'ios')

  const [webResult, nativeResult] = await Promise.all([
    dispatchWebPush(webSubs, payload),
    dispatchNativePush(nativeSubs, payload),
  ])

  const staleIds = [...webResult.staleIds, ...nativeResult.staleIds]
  if (staleIds.length) {
    await supabase.from('device_subscriptions').delete().in('id', staleIds)
  }

  const deliveredCount = webResult.delivered + nativeResult.delivered
  await finalizeDispatch(supabase, notificationId, {
    deliveredCount,
    webDelivered: webResult.delivered,
    nativeDelivered: nativeResult.delivered,
  })

  return json({
    ok: true,
    delivered: deliveredCount,
    web: webResult.delivered,
    native: nativeResult.delivered,
    staleRemoved: staleIds.length,
  })
})
