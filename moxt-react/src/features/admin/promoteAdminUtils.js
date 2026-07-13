import { updateUserRole } from '../administration/administrationSlice'

const PRIVILEGED_ROLES = new Set(['admin', 'superadmin'])

export function isPrivilegedRole(role) {
  return PRIVILEGED_ROLES.has(role)
}

export function promptAdminPromotePassword() {
  const value = window.prompt(
    'Mot de passe de promotion administrateur\n(configuré dans scripts/phase2.env → MOXT_ADMIN_PROMOTE_PASSWORD)',
  )
  if (!value?.trim()) return null
  return value.trim()
}

export function dispatchUserRole(dispatch, { actorRole, id, role }) {
  if (isPrivilegedRole(role) && actorRole !== 'superadmin') {
    window.alert('Seul un superadmin peut promouvoir un administrateur.')
    return false
  }

  let promotePassword
  if (isPrivilegedRole(role)) {
    promotePassword = promptAdminPromotePassword()
    if (!promotePassword) return false
  }

  dispatch(updateUserRole({ id, role, promotePassword }))
  return true
}
