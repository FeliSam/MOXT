export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  PROFESSIONAL: 'professional',
  SUPERADMIN: 'superadmin',
  USER: 'user',
}

export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPERADMIN]
export const MODERATION_ROLES = [ROLES.MODERATOR, ROLES.ADMIN, ROLES.SUPERADMIN]

export function hasRole(user, roles) {
  return Boolean(user && (!roles?.length || roles.includes(user.role)))
}

export function ownsResource(user, resource) {
  return Boolean(user && resource && resource.ownerId === user.id)
}
