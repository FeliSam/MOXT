export const STAFF_ROLES = ['moderator', 'admin', 'superadmin']

export const ADMIN_ROLES = ['admin', 'superadmin']

/** Admin/superadmin/moderator see unfiltered catalogs (no country/status restriction). */
export function isStaffRole(user) {
  return STAFF_ROLES.includes(user?.role)
}

/** Admin ou superadmin (hors modérateur). */
export function isAdminRole(user) {
  return ADMIN_ROLES.includes(user?.role)
}
