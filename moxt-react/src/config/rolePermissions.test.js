import { describe, expect, it } from 'vitest'
import { PERMISSIONS, ROLE_PERMISSIONS, roleCan } from './rolePermissions'

describe('rolePermissions', () => {
  it('reference uniquement des permissions declarees et sans doublon', () => {
    const known = new Set(PERMISSIONS.map((item) => item.id))
    Object.values(ROLE_PERMISSIONS).forEach((permissions) => {
      expect(new Set(permissions).size).toBe(permissions.length)
      permissions.forEach((permission) => expect(known.has(permission)).toBe(true))
    })
  })

  it('reserve la gestion des roles au superadmin', () => {
    expect(roleCan('admin', 'roles.manage')).toBe(false)
    expect(roleCan('superadmin', 'roles.manage')).toBe(true)
  })

  it('autorise le moderateur a moderer sans gerer les utilisateurs', () => {
    expect(roleCan('moderator', 'moderation.manage')).toBe(true)
    expect(roleCan('moderator', 'catalog.read')).toBe(true)
    expect(roleCan('moderator', 'users.manage')).toBe(false)
    expect(roleCan('moderator', 'roles.manage')).toBe(false)
    expect(roleCan('moderator', 'system.audit')).toBe(false)
  })
})
