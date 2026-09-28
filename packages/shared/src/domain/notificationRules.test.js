import { describe, expect, it } from 'vitest'
import {
  countUnreadNotifications,
  filterLoadedNotifications,
  notificationFromRemoteRow,
  selectVisibleNotificationList,
  upsertNotification,
} from './notificationRules.js'

const uid = 'u1'

describe('notificationRules', () => {
  it('mappe une ligne Supabase avec les défauts du web', () => {
    expect(notificationFromRemoteRow({ id: 'n1', user_id: uid, title: 'T', message: 'M', created_at: 'x' })).toMatchObject({
      userId: uid, message: 'M', priority: 'normal', read: false, archived: false, createdAt: 'x',
    })
  })

  it('exclut les messages et les étoiles si le module est coupé', () => {
    const items = [{ type: 'message' }, { type: 'stars' }, { type: 'system' }]
    expect(filterLoadedNotifications(items)).toHaveLength(2)
    expect(filterLoadedNotifications(items, { starsEnabled: false })).toHaveLength(1)
  })

  it('liste visible triée + compteur non lues (badge cloche)', () => {
    const items = [
      { id: 'a', userId: uid, createdAt: '2026-01-01', read: false },
      { id: 'b', userId: uid, createdAt: '2026-02-01', read: true },
      { id: 'c', userId: uid, createdAt: '2026-03-01', read: false, archived: true },
      { id: 'd', userId: 'other', createdAt: '2026-03-01', read: false },
    ]
    expect(selectVisibleNotificationList(items, uid).map((item) => item.id)).toEqual(['b', 'a'])
    expect(countUnreadNotifications(items, uid)).toBe(1)
  })

  it('fusion temps réel par id', () => {
    const items = [{ id: 'a', read: false }]
    expect(upsertNotification(items, { id: 'a', read: true })[0].read).toBe(true)
    expect(upsertNotification(items, { id: 'b' }).map((item) => item.id)).toEqual(['b', 'a'])
  })
})
