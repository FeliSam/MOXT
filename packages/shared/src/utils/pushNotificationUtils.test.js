import { describe, expect, it } from 'vitest'
import {
  buildWebPushPayload,
  resolveNotificationPreferenceKey,
  shouldDispatchWebPush,
} from './pushNotificationUtils.js'

describe('pushNotificationUtils', () => {
  it('mappe les types vers les préférences', () => {
    expect(resolveNotificationPreferenceKey('p2p')).toBe('notifTransfers')
    expect(resolveNotificationPreferenceKey('subscription')).toBe('notifNewSubscribers')
    expect(resolveNotificationPreferenceKey('review')).toBe('notifSysteme')
  })

  it('respecte le toggle push global et les catégories', () => {
    expect(
      shouldDispatchWebPush({ pushNotifications: false, notifTransfers: 'high' }, { type: 'p2p' }),
    ).toBe(false)
    expect(
      shouldDispatchWebPush({ pushNotifications: true, notifTransfers: 'off' }, { type: 'transfer' }),
    ).toBe(false)
    expect(
      shouldDispatchWebPush({ pushNotifications: true, notifTransfers: 'high' }, { type: 'transfer' }),
    ).toBe(true)
    expect(
      shouldDispatchWebPush(
        { pushNotifications: true, notifNewSubscribers: false },
        { type: 'subscription' },
      ),
    ).toBe(false)
  })

  it('construit un payload web push avec url relative', () => {
    expect(
      buildWebPushPayload({
        id: 'N1',
        title: 'Transfert',
        message: 'Nouveau statut',
        link: '/transfers/T1',
        type: 'transfer',
      }),
    ).toEqual({
      title: 'Transfert',
      body: 'Nouveau statut',
      data: {
        url: '/transfers/T1',
        path: '/transfers/T1',
        notificationId: 'N1',
        type: 'transfer',
      },
    })
  })
})
