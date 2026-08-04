import { supabase } from '../../services/supabaseClient'
import { updateUserEmailVerified, updateUserPhoneVerified } from '../administration/administrationSlice'
import { addToast } from '../ui/uiSlice'
import { adminText } from './adminI18n'

function edgeFunctionErrorDetail(error) {
  let detail = error.message
  if (error.context && typeof error.context.json === 'function') {
    return error.context
      .json()
      .then((body) => (body?.error ? String(body.error) : detail))
      .catch(() => detail)
  }
  return Promise.resolve(detail)
}

async function notifyContactVerified(userId, { title, message, link = '/security' }) {
  if (!userId) return
  const id = `NOT-CV-${String(userId).replace(/-/g, '').slice(0, 12)}-${Date.now()}`
  try {
    await supabase.rpc('moxt_create_notification', {
      p_id: id,
      p_user_id: userId,
      p_title: title,
      p_message: message,
      p_type: 'security',
      p_link: link,
      p_priority: 'high',
    })
  } catch (err) {
    console.warn('[admin] notify contact verified:', err?.message || err)
  }
}

/**
 * Valide manuellement le numéro (Auth phone_confirm + profiles.phone_verified).
 * @param {{ id: string, t: Function, phone?: string, notifyUser?: boolean }} opts
 * notifyUser=false quand la file phone_assist notifie déjà via trigger SQL.
 */
export async function verifyUserPhoneManually(dispatch, { id, t, phone, notifyUser = true } = {}) {
  try {
    const nextPhone = String(phone || '').trim()
    const { data, error } = await supabase.functions.invoke('admin-verify-phone', {
      body: { userId: id, phone: nextPhone || undefined },
    })
    if (error) throw new Error(await edgeFunctionErrorDetail(error))
    if (data?.error) throw new Error(String(data.error))

    dispatch(updateUserPhoneVerified({ id, phoneVerified: true }))
    if (notifyUser) {
      await notifyContactVerified(id, {
        title: adminText(t, 'admin.actions.verifyPhoneSuccessTitle'),
        message: adminText(t, 'admin.actions.verifyPhoneUserNotify', {
          phone: data?.phone || nextPhone || '',
        }),
      })
    }
    dispatch(
      addToast({
        title: adminText(t, 'admin.actions.verifyPhoneSuccessTitle'),
        message: adminText(t, 'admin.actions.verifyPhoneSuccessBody'),
        tone: 'success',
      }),
    )
    return true
  } catch (err) {
    // Filet RPC si l’edge n’est pas encore déployée
    try {
      const nextPhone = String(phone || '').trim()
      if (nextPhone) {
        const { error: phoneError } = await supabase
          .from('profiles')
          .update({ phone: nextPhone, updated_at: new Date().toISOString() })
          .eq('id', id)
        if (phoneError) throw new Error(phoneError.message, { cause: err })
      }
      const { error } = nextPhone
        ? await supabase.rpc('moxt_admin_verify_phone', { p_user_id: id, p_phone: nextPhone })
        : await supabase.rpc('moxt_admin_verify_phone', { p_user_id: id })
      if (error) throw new Error(error.message, { cause: err })

      dispatch(updateUserPhoneVerified({ id, phoneVerified: true }))
      if (notifyUser) {
        await notifyContactVerified(id, {
          title: adminText(t, 'admin.actions.verifyPhoneSuccessTitle'),
          message: adminText(t, 'admin.actions.verifyPhoneUserNotify', { phone: nextPhone || '' }),
        })
      }
      dispatch(
        addToast({
          title: adminText(t, 'admin.actions.verifyPhoneSuccessTitle'),
          message: adminText(t, 'admin.actions.verifyPhoneSuccessBody'),
          tone: 'success',
        }),
      )
      return true
    } catch (fallbackErr) {
      dispatch(
        addToast({
          title: adminText(t, 'admin.actions.verifyFailedTitle'),
          message: fallbackErr?.message || err?.message || adminText(t, 'admin.actions.verifyFailedBody'),
          tone: 'error',
        }),
      )
      return false
    }
  }
}

/** Valide manuellement l'e-mail d'un utilisateur (edge function admin-verify-email, service role requis). */
export async function verifyUserEmailManually(dispatch, { id, t, notifyUser = true } = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('admin-verify-email', {
      body: { userId: id },
    })
    if (error) throw new Error(await edgeFunctionErrorDetail(error))
    if (data?.error) throw new Error(String(data.error))

    dispatch(updateUserEmailVerified({ id, emailVerified: true }))
    if (notifyUser) {
      await notifyContactVerified(id, {
        title: adminText(t, 'admin.actions.verifyEmailSuccessTitle'),
        message: adminText(t, 'admin.actions.verifyEmailUserNotify'),
      })
    }
    dispatch(
      addToast({
        title: adminText(t, 'admin.actions.verifyEmailSuccessTitle'),
        message: adminText(t, 'admin.actions.verifyEmailSuccessBody'),
        tone: 'success',
      }),
    )
    return true
  } catch (err) {
    dispatch(
      addToast({
        title: adminText(t, 'admin.actions.verifyFailedTitle'),
        message: err?.message || adminText(t, 'admin.actions.verifyFailedBody'),
        tone: 'error',
      }),
    )
    return false
  }
}
