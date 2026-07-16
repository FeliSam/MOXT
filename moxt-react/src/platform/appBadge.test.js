import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearAppBadge, countUnreadCommunications, syncAppBadge } from './appBadge'

describe('appBadge', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('setAppBadge quand le compteur > 0', () => {
    const setAppBadge = vi.fn()
    const clearAppBadgeFn = vi.fn()
    vi.stubGlobal('navigator', { setAppBadge, clearAppBadge: clearAppBadgeFn })

    syncAppBadge(3)
    expect(setAppBadge).toHaveBeenCalledWith(3)
    expect(clearAppBadgeFn).not.toHaveBeenCalled()
  })

  it('clearAppBadge quand le compteur est 0', () => {
    const setAppBadge = vi.fn()
    const clearAppBadgeFn = vi.fn()
    vi.stubGlobal('navigator', { setAppBadge, clearAppBadge: clearAppBadgeFn })

    syncAppBadge(0)
    expect(clearAppBadgeFn).toHaveBeenCalled()
    expect(setAppBadge).not.toHaveBeenCalled()
  })

  it('clearAppBadge exporté force 0', () => {
    const clearAppBadgeFn = vi.fn()
    vi.stubGlobal('navigator', { setAppBadge: vi.fn(), clearAppBadge: clearAppBadgeFn })

    clearAppBadge()
    expect(clearAppBadgeFn).toHaveBeenCalled()
  })

  it('countUnreadCommunications ignore les notifications lues et sans user', () => {
    const state = {
      communications: {
        notifications: [
          { id: '1', userId: 'u1', type: 'system', read: false, archived: false },
          { id: '2', userId: 'u1', type: 'system', read: true, archived: false },
          { id: '3', userId: 'u1', type: 'message', read: false, archived: false },
        ],
        conversations: [
          { participantIds: ['u1', 'u2'], unreadBy: { u1: 2 } },
        ],
      },
    }
    expect(countUnreadCommunications(state, null)).toBe(0)
    expect(countUnreadCommunications(state, 'u1')).toBe(3)
  })
})
