import { describe, expect, it } from 'vitest'
import { DEFAULT_DEV_MODULE_FLAGS, normalizeDevModuleFlags } from '../../config/devModules'
import { canAccessDevModule } from './devModuleAccess'

describe('devModuleAccess', () => {
  const admin = { id: 'a1', role: 'admin' }
  const user = { id: 'u1', role: 'user' }

  it('donne toujours accès aux admins', () => {
    expect(canAccessDevModule(admin, { stars: false, feed: false, videos: false }, 'stars')).toBe(true)
    expect(canAccessDevModule(admin, { stars: true, feed: true, videos: true }, 'feed')).toBe(true)
    expect(canAccessDevModule(admin, { events: false, jobs: false, parcels: false }, 'events')).toBe(
      true,
    )
  })

  it('respecte les flags pour les utilisateurs', () => {
    const flags = {
      stars: false,
      feed: true,
      videos: false,
      events: true,
      jobs: false,
      parcels: true,
    }
    expect(canAccessDevModule(user, flags, 'stars')).toBe(false)
    expect(canAccessDevModule(user, flags, 'feed')).toBe(true)
    expect(canAccessDevModule(user, flags, 'videos')).toBe(false)
    expect(canAccessDevModule(user, flags, 'events')).toBe(true)
    expect(canAccessDevModule(user, flags, 'jobs')).toBe(false)
    expect(canAccessDevModule(user, flags, 'parcels')).toBe(true)
  })

  it('applique les défauts quand le flag est absent', () => {
    expect(canAccessDevModule(user, {}, 'videos')).toBe(DEFAULT_DEV_MODULE_FLAGS.videos)
    expect(canAccessDevModule(user, {}, 'events')).toBe(DEFAULT_DEV_MODULE_FLAGS.events)
    expect(canAccessDevModule(user, {}, 'jobs')).toBe(DEFAULT_DEV_MODULE_FLAGS.jobs)
    expect(canAccessDevModule(user, {}, 'parcels')).toBe(DEFAULT_DEV_MODULE_FLAGS.parcels)
  })

  it('normalizeDevModuleFlags conserve les défauts ON pour events/jobs/parcels', () => {
    expect(normalizeDevModuleFlags({})).toMatchObject({
      stars: false,
      feed: false,
      videos: false,
      events: true,
      jobs: true,
      parcels: true,
    })
    expect(normalizeDevModuleFlags({ events: false, jobs: false })).toMatchObject({
      events: false,
      jobs: false,
      parcels: true,
    })
  })
})
