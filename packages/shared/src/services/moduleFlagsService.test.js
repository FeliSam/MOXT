import { describe, expect, it } from 'vitest'
import { createFakeClient } from './testClient.js'
import { fetchAppModuleFlags, isStarsModuleEnabled } from './moduleFlagsService.js'
import { fetchNotificationInbox } from './notificationsService.js'
import { DEFAULT_DEV_MODULE_FLAGS } from '../config/moduleFlags.js'

const me = '11111111-1111-4111-8111-111111111111'

describe('moduleFlagsService', () => {
  it('lit app_module_flags id=1 comme le web et normalise', async () => {
    const client = createFakeClient({ app_module_flags: [{ config: { stars: true, feed: false, videos: true }, updated_at: '2026-09-01' }] })
    const result = await fetchAppModuleFlags(client)
    expect(result.source).toBe('remote')
    expect(result.flags.stars).toBe(true)
    // contrainte web : pas de vidéos sans fil
    expect(result.flags.videos).toBe(false)
    expect(client.calls[0].ops).toEqual([['select', 'config, updated_at'], ['eq', 'id', 1], ['maybeSingle']])
  })

  it('ligne absente → drapeaux par défaut (stars désactivé)', async () => {
    const result = await fetchAppModuleFlags(createFakeClient({}))
    expect(result.flags).toEqual({ ...DEFAULT_DEV_MODULE_FLAGS })
    expect(isStarsModuleEnabled(result.flags)).toBe(false)
    expect(isStarsModuleEnabled({ stars: true })).toBe(true)
  })

  it('module Stars off → notifications « stars » masquées comme le web', async () => {
    const client = createFakeClient({
      notifications: [
        { id: 'n1', user_id: me, type: 'stars', read: true, created_at: '2026-09-01' },
        { id: 'n2', user_id: me, type: 'system', read: false, created_at: '2026-09-02' },
      ],
    })
    const off = await fetchNotificationInbox(client, me, { starsEnabled: false })
    expect(off.visible.map((n) => n.id)).toEqual(['n2'])
    const on = await fetchNotificationInbox(client, me, { starsEnabled: true })
    expect(on.visible).toHaveLength(2)
  })
})
