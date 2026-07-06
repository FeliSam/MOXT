import { beforeEach, describe, expect, it } from 'vitest'
import {
  exportLocalData,
  inspectLocalData,
  resetLocalDataDomains,
  STORAGE_SCHEMA_VERSION,
  writeStorageManifest,
} from './storageRegistry'

describe('storage registry', () => {
  beforeEach(() => localStorage.clear())

  it('détecte les données valides et corrompues', () => {
    localStorage.setItem('moxt-account-v1', JSON.stringify({ favorites: [] }))
    localStorage.setItem('moxt-businesses-v1', '{invalid')

    const report = inspectLocalData()

    expect(report.available).toBe(true)
    expect(report.invalidKeys).toContain('moxt-businesses-v1')
    expect(report.totalBytes).toBeGreaterThan(0)
  })

  it('exporte et réinitialise uniquement les domaines choisis', () => {
    localStorage.setItem('moxt-account-v1', '{}')
    localStorage.setItem('moxt-businesses-v1', '[]')

    expect(exportLocalData().data).toHaveProperty('moxt-account-v1')
    resetLocalDataDomains(['account'])

    expect(localStorage.getItem('moxt-account-v1')).toBeNull()
    expect(localStorage.getItem('moxt-businesses-v1')).toBe('[]')
  })

  it('écrit la version actuelle du schéma', () => {
    const manifest = writeStorageManifest({ migrationVersion: 2 })
    expect(manifest.schemaVersion).toBe(STORAGE_SCHEMA_VERSION)
    expect(JSON.parse(localStorage.getItem('moxt-storage-manifest-v2'))).toMatchObject({
      migrationVersion: 2,
    })
  })
})
