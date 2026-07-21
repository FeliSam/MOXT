import { supabase } from '../../services/supabaseClient'
import { updateUserRole } from '../administration/administrationSlice'
import { addToast } from '../ui/uiSlice'
import { adminText } from './adminI18n'

const PRIVILEGED_ROLES = new Set(['admin', 'superadmin'])

export function isPrivilegedRole(role) {
  return PRIVILEGED_ROLES.has(role)
}

export function promptAdminPromotePassword(t) {
  const value = window.prompt(adminText(t, 'admin.promote.passwordPrompt'))
  if (!value?.trim()) return null
  return value.trim()
}

/**
 * Promote / demote a user role.
 * Privileged roles (admin/superadmin) are written via edge function FIRST,
 * then Redux is updated — avoids “visible but not saved” optimistic UI.
 */
export async function dispatchUserRole(dispatch, { actorRole, id, role, t }) {
  if (isPrivilegedRole(role) && actorRole !== 'superadmin') {
    window.alert(adminText(t, 'admin.promote.superadminOnly'))
    return false
  }

  if (isPrivilegedRole(role)) {
    const promotePassword = promptAdminPromotePassword(t)
    if (!promotePassword) return false

    try {
      const { data, error } = await supabase.functions.invoke('admin-promote-role', {
        body: {
          userId: id,
          role,
          promotePassword,
        },
      })

      if (error) {
        let detail = error.message
        if (error.context && typeof error.context.json === 'function') {
          try {
            const body = await error.context.json()
            if (body?.error) detail = String(body.error)
          } catch {
            // ignore
          }
        } else if (error.context && typeof error.context.text === 'function') {
          try {
            const text = await error.context.text()
            if (text?.trim()) detail = text.trim().slice(0, 240)
          } catch {
            // ignore
          }
        }
        if (/failed to send a request to the edge function/i.test(detail)) {
          detail = adminText(
            t,
            'admin.promote.edgeUnreachable',
            'Impossible de joindre la fonction de promotion. Vérifiez la connexion puis réessayez.',
          )
        }
        throw new Error(detail)
      }
      if (data?.error) throw new Error(String(data.error))

      dispatch(updateUserRole({ id, role, remoteSynced: true }))
      dispatch(
        addToast({
          title: adminText(t, 'admin.promote.successTitle'),
          message: adminText(t, 'admin.promote.successBody', { role }),
          tone: 'success',
        }),
      )
      return true
    } catch (err) {
      dispatch(
        addToast({
          title: adminText(t, 'admin.promote.failedTitle'),
          message: err?.message || adminText(t, 'admin.promote.failedBody'),
          tone: 'error',
        }),
      )
      return false
    }
  }

  dispatch(updateUserRole({ id, role }))
  return true
}
