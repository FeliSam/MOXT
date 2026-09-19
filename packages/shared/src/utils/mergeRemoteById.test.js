import { describe, expect, it } from 'vitest'
import {
  LOCAL_ONLY_GRACE_MS,
  mergeRemoteById,
  mergeRemoteByIdPruningWindow,
} from './mergeRemoteById.js'

describe('mergeRemoteByIdPruningWindow', () => {
  it('met à jour le statut distant et retire un item récent absent du pull', () => {
    const local = [
      { id: 'a', status: 'active', createdAt: '2026-09-09T10:00:00.000Z' },
      { id: 'gone', status: 'active', createdAt: '2026-09-09T11:00:00.000Z' },
      { id: 'old', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
    ]
    const remote = [
      { id: 'a', status: 'archived', createdAt: '2026-09-09T10:00:00.000Z' },
      { id: 'b', status: 'active', createdAt: '2026-09-09T09:00:00.000Z' },
    ]
    const next = mergeRemoteByIdPruningWindow(local, remote, 'createdAt', Date.parse('2026-09-19T12:00:00.000Z'))
    expect(next.find((item) => item.id === 'a')?.status).toBe('archived')
    expect(next.some((item) => item.id === 'gone')).toBe(false)
    expect(next.some((item) => item.id === 'old')).toBe(true)
  })

  it('conserve une publication optimiste encore absente du pull', () => {
    const now = Date.parse('2026-09-19T12:00:00.000Z')
    const local = [
      { id: 'fresh', status: 'active', createdAt: new Date(now - 5_000).toISOString() },
      { id: 'a', status: 'active', createdAt: '2026-09-09T10:00:00.000Z' },
    ]
    const remote = [
      { id: 'a', status: 'active', createdAt: '2026-09-09T10:00:00.000Z' },
      { id: 'b', status: 'active', createdAt: '2026-09-09T09:00:00.000Z' },
    ]
    const next = mergeRemoteByIdPruningWindow(local, remote, 'createdAt', now)
    expect(next.some((item) => item.id === 'fresh')).toBe(true)
    expect(LOCAL_ONLY_GRACE_MS).toBeGreaterThan(5_000)
  })
})
