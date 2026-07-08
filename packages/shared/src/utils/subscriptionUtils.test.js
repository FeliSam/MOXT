import { describe, expect, it } from 'vitest'
import {
  isItemFromSubscribedPublisher,
  isSubscriberBanned,
  shouldNotifySubscriber,
  sortBySubscriptionPriority,
} from './subscriptionUtils.js'

describe('subscriptionUtils', () => {
  const subscriptions = [
    {
      id: 'SUB-1',
      userId: 'user-a',
      publisherType: 'user',
      publisherId: 'pub-1',
      notifyPref: 'all',
    },
  ]

  it('detects subscribed publishers', () => {
    expect(
      isItemFromSubscribedPublisher(
        { ownerId: 'pub-1', title: 'Test' },
        subscriptions,
        'user-a',
      ),
    ).toBe(true)
    expect(
      isItemFromSubscribedPublisher(
        { ownerId: 'other', title: 'Test' },
        subscriptions,
        'user-a',
      ),
    ).toBe(false)
  })

  it('respects notification preferences', () => {
    expect(shouldNotifySubscriber('muted', 'listing')).toBe(false)
    expect(shouldNotifySubscriber('important', 'listing')).toBe(true)
    expect(shouldNotifySubscriber('important', 'job')).toBe(false)
    expect(shouldNotifySubscriber('all', 'parcel')).toBe(true)
  })

  it('prioritizes subscribed listings first', () => {
    const sorted = sortBySubscriptionPriority(
      [
        { id: '1', ownerId: 'other', createdAt: '2026-01-02' },
        { id: '2', ownerId: 'pub-1', createdAt: '2026-01-01' },
      ],
      subscriptions,
      'user-a',
      'listing',
    )
    expect(sorted[0].id).toBe('2')
  })

  it('detects subscriber bans', () => {
    const bans = [
      {
        id: 'B1',
        publisherType: 'user',
        publisherId: 'pub-1',
        subscriberId: 'user-a',
      },
    ]
    expect(isSubscriberBanned(bans, 'user-a', 'user', 'pub-1')).toBe(true)
    expect(isSubscriberBanned(bans, 'user-b', 'user', 'pub-1')).toBe(false)
  })
})
