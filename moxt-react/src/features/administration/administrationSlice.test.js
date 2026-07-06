import { beforeEach, describe, expect, it } from 'vitest'
import reducer, { updateUserRole, updateUserStatus } from './administrationSlice'

describe('administrationSlice', () => {
  beforeEach(() => localStorage.clear())

  it('gère rôle et suspension avec des valeurs autorisées', () => {
    const initial = { users: [{ id: 'u1', role: 'user', status: 'active' }] }
    const promoted = reducer(initial, updateUserRole({ id: 'u1', role: 'professional' }))
    const suspended = reducer(promoted, updateUserStatus({ id: 'u1', status: 'suspended' }))
    const invalid = reducer(suspended, updateUserRole({ id: 'u1', role: 'root' }))
    expect(invalid.users[0]).toMatchObject({ role: 'professional', status: 'suspended' })
  })
})
