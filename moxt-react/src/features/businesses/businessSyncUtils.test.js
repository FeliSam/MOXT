import { describe, expect, it } from 'vitest'
import { filterByBusinessIds, reconcileBusinesses } from './businessSyncUtils'

describe('businessSyncUtils', () => {
  it('supprime les entreprises locales du compte absentes du serveur', () => {
    const local = [
      { id: 'BIZ-LOCAL', ownerId: 'user-1', name: 'Fantôme' },
      { id: 'BIZ-OTHER', ownerId: 'user-2', name: 'Autre' },
    ]
    const remote = [{ id: 'BIZ-REMOTE', ownerId: 'user-1', name: 'Serveur' }]

    const result = reconcileBusinesses(local, remote, 'user-1')

    expect(result).toEqual([{ id: 'BIZ-REMOTE', ownerId: 'user-1', name: 'Serveur' }])
  })

  it('conserve les entreprises du compte présentes localement et sur le serveur', () => {
    const local = [{ id: 'BIZ-1', ownerId: 'user-1', name: 'Local', phone: '111' }]
    const remote = [{ id: 'BIZ-1', ownerId: 'user-1', name: 'Serveur', status: 'verified' }]

    const result = reconcileBusinesses(local, remote, 'user-1')

    expect(result).toEqual([
      { id: 'BIZ-1', ownerId: 'user-1', name: 'Serveur', phone: '111', status: 'verified' },
    ])
  })

  it('filtre les enfants par identifiants entreprise', () => {
    const members = [
      { id: 'MEM-1', businessId: 'BIZ-1' },
      { id: 'MEM-2', businessId: 'BIZ-OLD' },
    ]

    expect(filterByBusinessIds(members, ['BIZ-1'])).toEqual([{ id: 'MEM-1', businessId: 'BIZ-1' }])
  })
})
