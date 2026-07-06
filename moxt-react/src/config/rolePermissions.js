export const PERMISSIONS = [
  { id: 'catalog.read', label: 'Consulter les catalogues' },
  { id: 'content.publish', label: 'Publier du contenu' },
  { id: 'business.manage', label: 'Gérer une entreprise' },
  { id: 'requests.manage', label: 'Traiter les demandes métier' },
  { id: 'moderation.manage', label: 'Modérer la plateforme' },
  { id: 'users.manage', label: 'Gérer les utilisateurs' },
  { id: 'system.audit', label: 'Consulter et exporter l’audit' },
  { id: 'roles.manage', label: 'Modifier les rôles sensibles' },
]

export const ROLE_PERMISSIONS = {
  user: ['catalog.read', 'content.publish'],
  professional: ['catalog.read', 'content.publish', 'business.manage', 'requests.manage'],
  admin: [
    'catalog.read',
    'content.publish',
    'business.manage',
    'requests.manage',
    'moderation.manage',
    'users.manage',
    'system.audit',
  ],
  superadmin: PERMISSIONS.map((permission) => permission.id),
}

export function roleCan(role, permission) {
  return Boolean(ROLE_PERMISSIONS[role]?.includes(permission))
}
