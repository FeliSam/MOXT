import { beforeEach, describe, expect, it } from 'vitest'
import { migrateLegacyStorage } from './legacyMigration'

describe('legacy storage migration', () => {
  beforeEach(() => localStorage.clear())

  it('migrates and normalizes legacy collections without deleting their source', () => {
    localStorage.setItem(
      'moxt_sales_v238',
      JSON.stringify([{ id: 'sale-1', name: 'Téléphone', price: '45000', userId: 'user-1' }]),
    )
    localStorage.setItem(
      'fx_business_profiles',
      JSON.stringify([{ id: 'biz-1', businessName: 'MOXT Express', userId: 'user-1' }]),
    )

    const result = migrateLegacyStorage()

    expect(result.migrated).toBe(2)
    expect(JSON.parse(localStorage.getItem('moxt-listings-v1'))[0]).toMatchObject({
      id: 'sale-1',
      title: 'Téléphone',
      price: 45000,
      favorites: [],
    })
    expect(JSON.parse(localStorage.getItem('moxt-businesses-v1'))[0]).toMatchObject({
      id: 'biz-1',
      name: 'MOXT Express',
      ownerId: 'user-1',
    })
    expect(localStorage.getItem('moxt_sales_v238')).not.toBeNull()
    expect(JSON.parse(localStorage.getItem('moxt-legacy-migration-v1'))).toMatchObject({
      version: 2,
      schemaVersion: 2,
    })
    expect(JSON.parse(localStorage.getItem('moxt-storage-manifest-v2'))).toMatchObject({
      schemaVersion: 2,
      migrationVersion: 2,
    })
  })

  it('keeps current React data when it already exists', () => {
    localStorage.setItem('moxt-listings-v1', JSON.stringify([{ id: 'current' }]))
    localStorage.setItem('moxt_sales', JSON.stringify([{ id: 'legacy' }]))

    migrateLegacyStorage()

    expect(JSON.parse(localStorage.getItem('moxt-listings-v1'))).toEqual([{ id: 'current' }])
  })

  it('migrates a legacy current user to the session format', () => {
    localStorage.setItem('currentUser', JSON.stringify({ id: 'user-1', email: 'user@moxt.test' }))

    const result = migrateLegacyStorage()

    expect(result.session).toBe(true)
    expect(JSON.parse(localStorage.getItem('moxt-session-v1'))).toMatchObject({
      user: { id: 'user-1', email: 'user@moxt.test' },
    })
  })

  it('reste idempotente après plusieurs démarrages', () => {
    localStorage.setItem('moxt_sales', JSON.stringify([{ id: 'legacy' }]))

    migrateLegacyStorage()
    migrateLegacyStorage()

    expect(JSON.parse(localStorage.getItem('moxt-listings-v1'))).toHaveLength(1)
  })
})
