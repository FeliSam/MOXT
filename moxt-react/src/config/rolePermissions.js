export const PERMISSIONS = [
  { id: 'catalog.read', label: 'Consulter les catalogues', labelKey: 'admin.permissions.catalogRead' },
  { id: 'content.publish', label: 'Publier du contenu', labelKey: 'admin.permissions.contentPublish' },
  { id: 'business.manage', label: 'Gérer une entreprise', labelKey: 'admin.permissions.businessManage' },
  { id: 'requests.manage', label: 'Traiter les demandes métier', labelKey: 'admin.permissions.requestsManage' },
  { id: 'moderation.manage', label: 'Modérer la plateforme', labelKey: 'admin.permissions.moderationManage' },
  { id: 'users.manage', label: 'Gérer les utilisateurs', labelKey: 'admin.permissions.usersManage' },
  { id: 'system.audit', label: 'Consulter et exporter l’audit', labelKey: 'admin.permissions.systemAudit' },
  { id: 'roles.manage', label: 'Modifier les rôles sensibles', labelKey: 'admin.permissions.rolesManage' },
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
