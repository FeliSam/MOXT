import { updateUserRole } from '../administration/administrationSlice'
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

export function dispatchUserRole(dispatch, { actorRole, id, role, t }) {
  if (isPrivilegedRole(role) && actorRole !== 'superadmin') {
    window.alert(adminText(t, 'admin.promote.superadminOnly'))
    return false
  }

  let promotePassword
  if (isPrivilegedRole(role)) {
    promotePassword = promptAdminPromotePassword(t)
    if (!promotePassword) return false
  }

  dispatch(updateUserRole({ id, role, promotePassword }))
  return true
}
