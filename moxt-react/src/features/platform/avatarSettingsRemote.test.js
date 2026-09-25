import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_AVATAR_SETTINGS } from '../../config/avatarSettings'
import {
  adminUpdateAvatarSettings,
  fetchAvatarSettings,
  fetchAvatarStyleStats,
} from './avatarSettingsRemote'

const state = vi.hoisted(() => ({ select: null, rpc: {}, lastRpc: null }))

vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => state.select }),
      }),
    }),
    rpc: async (name, args) => {
      state.lastRpc = { name, args }
      return state.rpc[name] || { data: null, error: null }
    },
  },
}))

describe('avatarSettingsRemote', () => {
  beforeEach(() => {
    state.select = null
    state.rpc = {}
    state.lastRpc = null
  })

  it('table absente (migration non appliquée) : défauts, sans erreur', async () => {
    state.select = { data: null, error: { code: 'PGRST205', message: 'missing' } }
    await expect(fetchAvatarSettings()).resolves.toEqual({
      config: DEFAULT_AVATAR_SETTINGS,
      updatedAt: null,
      source: 'default',
    })
    state.select = { data: null, error: { code: '42P01', message: 'missing' } }
    expect((await fetchAvatarSettings()).source).toBe('default')
  })

  it('ligne absente : défauts ; ligne présente : normalisée', async () => {
    state.select = { data: null, error: null }
    expect((await fetchAvatarSettings()).config).toEqual(DEFAULT_AVATAR_SETTINGS)
    state.select = {
      data: {
        config: { promptMaxShows: 5, badgeEnabled: false },
        updated_at: '2026-09-25T09:00:00Z',
      },
      error: null,
    }
    const result = await fetchAvatarSettings()
    expect(result.config).toMatchObject({
      promptMaxShows: 5,
      badgeEnabled: false,
      promptIntervalHours: 12,
    })
    expect(result.updatedAt).toBe('2026-09-25T09:00:00Z')
  })

  it('autre erreur : propagée (le slice garde le cache)', async () => {
    state.select = { data: null, error: { code: '500', message: 'boom' } }
    await expect(fetchAvatarSettings()).rejects.toMatchObject({ message: 'boom' })
  })

  it('écriture admin : payload normalisé envoyé au RPC', async () => {
    state.rpc.admin_update_app_avatar_settings = {
      data: { promptMaxShows: 4 },
      error: null,
    }
    const next = await adminUpdateAvatarSettings({ promptMaxShows: 4, promptDelaySeconds: 99 })
    expect(state.lastRpc.name).toBe('admin_update_app_avatar_settings')
    expect(state.lastRpc.args.p_config.promptDelaySeconds).toBe(30)
    expect(next.promptMaxShows).toBe(4)
  })

  it('statistiques : null si RPC absent, compteurs sinon', async () => {
    state.rpc.admin_avatar_style_stats = { data: null, error: { code: 'PGRST202' } }
    expect(await fetchAvatarStyleStats()).toBeNull()
    state.rpc.admin_avatar_style_stats = {
      data: { portrait: 3, lorelei: 1, photo: '2', none: 4, total: 10 },
      error: null,
    }
    expect(await fetchAvatarStyleStats()).toEqual({
      portrait: 3,
      lorelei: 1,
      photo: 2,
      none: 4,
      total: 10,
    })
  })
})
