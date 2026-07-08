import { describe, expect, it } from 'vitest'
import {
  getAdminUserIds,
  resolveDisputePartyIds,
  resolvePublisherOwnerId,
  resolveReviewOwnerId,
  shouldSendNotification,
} from './notificationUtils.js'
import { REVIEW_TARGET_TYPES } from './reviewUtils.js'

describe('notificationUtils', () => {
  it('résout le propriétaire d un avis profil', () => {
    expect(
      resolveReviewOwnerId(
        {},
        { targetType: REVIEW_TARGET_TYPES.USER_PROFILE, targetId: 'u2' },
      ),
    ).toBe('u2')
  })

  it('résout le propriétaire entreprise', () => {
    const state = {
      businesses: { items: [{ id: 'b1', ownerId: 'u9' }] },
    }
    expect(
      resolveReviewOwnerId(state, {
        targetType: REVIEW_TARGET_TYPES.BUSINESS,
        targetId: 'b1',
      }),
    ).toBe('u9')
  })

  it('respecte la préférence abonnés', () => {
    const state = {
      account: {
        preferences: {
          u1: { notifNewSubscribers: false },
        },
      },
    }
    expect(shouldSendNotification(state, 'u1', 'notifNewSubscribers')).toBe(false)
    expect(shouldSendNotification(state, 'u2', 'notifNewSubscribers')).toBe(true)
  })

  it('résout les parties d un litige p2p', () => {
    const state = {
      p2p: {
        orders: [{ id: 'o1', buyerId: 'u1', sellerId: 'u2' }],
      },
    }
    expect(resolveDisputePartyIds(state, { relatedType: 'p2p_order', relatedId: 'o1' })).toEqual([
      'u1',
      'u2',
    ])
  })

  it('trouve les admins', () => {
    const state = {
      administration: {
        users: [
          { id: 'a1', role: 'admin' },
          { id: 'u1', role: 'user' },
        ],
      },
      auth: { user: { id: 'a2', role: 'superadmin' } },
    }
    expect(getAdminUserIds(state).sort()).toEqual(['a1', 'a2'])
  })

  it('résout le propriétaire d un abonnement entreprise', () => {
    const state = {
      businesses: { items: [{ id: 'b1', ownerId: 'u3' }] },
    }
    expect(resolvePublisherOwnerId(state, 'business', 'b1')).toBe('u3')
  })
})
