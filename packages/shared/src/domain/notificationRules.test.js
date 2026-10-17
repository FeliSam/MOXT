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
      badgeText: null, badgeColor: null, badgeIcon: null, displayMode: 'standard', actionLabel: null, metadata: {},
    })
  })

  it('mappe les attributs de diffusion et badge personnalisé', () => {
    const row = {
      id: 'b1',
      user_id: uid,
      title: 'Alerte',
      body: 'Message important',
      badge_text: 'PROMO',
      badge_color: 'amber',
      badge_icon: 'gift',
      display_mode: 'sheet',
      action_label: 'Voir l offre',
      metadata: { promoCode: 'MOXT2026' },
      created_at: '2026-10-17T12:00:00Z',
    }
    expect(notificationFromRemoteRow(row)).toEqual({
      id: 'b1',
      userId: uid,
      title: 'Alerte',
      message: 'Message important',
      type: 'system',
      link: null,
      priority: 'normal',
      read: false,
      archived: false,
      badgeText: 'PROMO',
      badgeColor: 'amber',
      badgeIcon: 'gift',
      displayMode: 'sheet',
      actionLabel: 'Voir l offre',
      metadata: { promoCode: 'MOXT2026' },
      createdAt: '2026-10-17T12:00:00Z',
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
