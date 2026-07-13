import { describe, expect, it } from 'vitest'
import {
  buildSubscriptionNetworkProfiles,
  filterSubscriptionNetworkProfiles,
} from './subscriptionProfileSearch'

describe('subscriptionProfileSearch', () => {
  it('inclut les abonnements dans les deux sens', () => {
    const profiles = buildSubscriptionNetworkProfiles(
      {
        account: {
          subscriptions: [
            {
              userId: 'me',
              publisherType: 'user',
              publisherId: 'alice',
              publisherName: 'Alice Martin',
            },
            {
              userId: 'bob',
              publisherType: 'user',
              publisherId: 'me',
            },
          ],
        },
        communications: { conversations: [] },
      },
      'me',
    )

    expect(profiles.map((item) => item.userId).sort()).toEqual(['alice', 'bob'])
    expect(profiles.find((item) => item.userId === 'alice')?.relation).toBe('following')
    expect(profiles.find((item) => item.userId === 'bob')?.relation).toBe('follower')
  })

  it('filtre à partir de 3 lettres sur le nom', () => {
    const profiles = buildSubscriptionNetworkProfiles(
      {
        account: {
          subscriptions: [
            {
              userId: 'me',
              publisherType: 'user',
              publisherId: 'alice',
              publisherName: 'Alice Martin',
            },
          ],
        },
        communications: { conversations: [] },
      },
      'me',
    )

    expect(filterSubscriptionNetworkProfiles(profiles, 'al')).toHaveLength(0)
    expect(filterSubscriptionNetworkProfiles(profiles, 'ali')).toHaveLength(1)
  })
})
