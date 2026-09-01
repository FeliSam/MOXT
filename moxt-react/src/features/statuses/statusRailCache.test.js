import { beforeEach, describe, expect, it } from 'vitest'
import {
  isStatusRailCacheFresh,
  readStatusRailCache,
  STATUS_RAIL_CACHE_STALE_MS,
  writeStatusRailCache,
} from './statusRailCache.js'

describe('statusRailCache', () => {
  beforeEach(() => {
    localStorage.removeItem('moxt-statuses-rail-v1')
  })

  it('lit et écrit via createLocalStorage (read/write, pas .get)', () => {
    const items = [
      {
        id: 'st-1',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    ]
    writeStatusRailCache('user-1', items)
    expect(readStatusRailCache('user-1')).toEqual(items)
  })

  it('retourne null si le cache est expiré', () => {
    localStorage.setItem(
      'moxt-statuses-rail-v1',
      JSON.stringify({
        'user-1': {
          savedAt: Date.now() - 10 * 60 * 1000,
          items: [{ id: 'st-1', expiresAt: new Date(Date.now() + 60_000).toISOString() }],
        },
      }),
    )
    expect(readStatusRailCache('user-1')).toBeNull()
  })

  it('allowStale sert le cache jusqu’à STATUS_RAIL_CACHE_STALE_MS', () => {
    const items = [{ id: 'st-1', expiresAt: new Date(Date.now() + 60_000).toISOString() }]
    localStorage.setItem(
      'moxt-statuses-rail-v1',
      JSON.stringify({
        'user-1': {
          savedAt: Date.now() - STATUS_RAIL_CACHE_STALE_MS + 60_000,
          items,
        },
      }),
    )
    expect(readStatusRailCache('user-1')).toBeNull()
    expect(readStatusRailCache('user-1', { allowStale: true })).toEqual(items)
  })

  it('isStatusRailCacheFresh distingue TTL réseau et stale UI', () => {
    writeStatusRailCache('user-1', [
      { id: 'st-1', expiresAt: new Date(Date.now() + 60_000).toISOString() },
    ])
    expect(isStatusRailCacheFresh('user-1')).toBe(true)

    const map = JSON.parse(localStorage.getItem('moxt-statuses-rail-v1'))
    map['user-1'].savedAt = Date.now() - 10 * 60 * 1000
    localStorage.setItem('moxt-statuses-rail-v1', JSON.stringify(map))
    expect(isStatusRailCacheFresh('user-1')).toBe(false)
    expect(readStatusRailCache('user-1', { allowStale: true })?.length).toBe(1)
  })
})
