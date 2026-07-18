export const STAFF_ROLES = ['moderator', 'admin', 'superadmin']

/** Admin/superadmin/moderator see unfiltered catalogs (no country/status restriction). */
export function isStaffRole(user) {
  return STAFF_ROLES.includes(user?.role)
}
