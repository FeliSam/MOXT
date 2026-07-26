import { supabase } from '../../services/supabaseClient'
import { updateUserPhoneVerified } from '../administration/administrationSlice'
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

/** Valide manuellement le numéro de téléphone d'un utilisateur (RPC admin, cf. moxt_admin_verify_phone). */
export async function verifyUserPhoneManually(dispatch, { id, t }) {
  try {
    const { error } = await supabase.rpc('moxt_admin_verify_phone', { p_user_id: id })
    if (error) throw new Error(error.message)

    dispatch(updateUserPhoneVerified({ id, phoneVerified: true }))
    dispatch(
      addToast({
        title: adminText(t, 'admin.actions.verifyPhoneSuccessTitle'),
        message: adminText(t, 'admin.actions.verifyPhoneSuccessBody'),
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

/** Valide manuellement l'e-mail d'un utilisateur (edge function admin-verify-email, service role requis). */
export async function verifyUserEmailManually(dispatch, { id, t }) {
  try {
    const { data, error } = await supabase.functions.invoke('admin-verify-email', {
      body: { userId: id },
    })
    if (error) throw new Error(await edgeFunctionErrorDetail(error))
    if (data?.error) throw new Error(String(data.error))

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
