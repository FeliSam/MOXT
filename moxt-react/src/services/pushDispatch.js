import { supabase } from '../services/supabaseClient'

export async function dispatchPushNotification(notificationId) {
  if (!notificationId) return { ok: false, reason: 'missing_id' }
  try {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: { notificationId },
    })
    if (error) {
      console.warn('[MOXT] dispatch push failed', error)
      return { ok: false, error }
    }
    return { ok: true, data }
  } catch (error) {
    console.warn('[MOXT] dispatch push unavailable', error)
    return { ok: false, error }
  }
}
