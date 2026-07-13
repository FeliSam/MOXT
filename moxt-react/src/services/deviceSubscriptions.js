import { supabase } from './supabaseClient'

function toRow(userId, payload) {
  return {
    user_id: userId,
    platform: payload.platform,
    endpoint: payload.endpoint,
    p256dh: payload.p256dh || null,
    auth_key: payload.authKey || null,
    subscription_json: payload.subscriptionJson || null,
    user_agent: payload.userAgent || navigator.userAgent || '',
    enabled: payload.enabled !== false,
    updated_at: new Date().toISOString(),
  }
}

export async function upsertDeviceSubscription(userId, payload) {
  if (!userId || !payload?.endpoint) {
    return { ok: false, reason: 'invalid_payload' }
  }

  const { data, error } = await supabase
    .from('device_subscriptions')
    .upsert(toRow(userId, payload), { onConflict: 'user_id,endpoint' })
    .select('id')
    .maybeSingle()

  if (error) throw error
  return { ok: true, id: data?.id || null }
}

export async function disableDeviceSubscription(userId, endpoint) {
  if (!userId || !endpoint) return { ok: false }
  const { error } = await supabase
    .from('device_subscriptions')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
  if (error) throw error
  return { ok: true }
}

export async function removeDeviceSubscription(userId, endpoint) {
  if (!userId || !endpoint) return { ok: false }
  const { error } = await supabase
    .from('device_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
  if (error) throw error
  return { ok: true }
}

export async function disableAllWebSubscriptions(userId) {
  if (!userId) return { ok: false }
  const { error } = await supabase
    .from('device_subscriptions')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('platform', 'web')
  if (error) throw error
  return { ok: true }
}

export async function syncNativeTokenToSupabase(userId, { token, platform }) {
  if (!userId || !token) return { ok: false, reason: 'missing_token' }
  return upsertDeviceSubscription(userId, {
    platform: platform === 'ios' ? 'ios' : 'android',
    endpoint: token,
    enabled: true,
  })
}
