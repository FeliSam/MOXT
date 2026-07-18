import { describe, expect, it } from 'vitest'
import {
  badgeForModerationView,
  MODERATION_VIEW_IDS,
  moderationQueuesUrgent,
} from './moderationConfig'

describe('moderationConfig', () => {
  it('expose les vues attendues', () => {
    expect(MODERATION_VIEW_IDS).toEqual(['overview', 'content', 'publications', 'queues'])
  })

  it('calcule l’urgence des files de moderation', () => {
    expect(
      moderationQueuesUrgent({
        disputes: [{ id: 1 }],
        reports: [{ id: 2 }, { id: 3 }],
        contestedReviews: [],
        reviews: [{ id: 4 }],
      }),
    ).toBe(4)
  })

  it('renseigne les badges de navigation', () => {
    const metrics = {
      content: { pending: 3 },
      posts: { pending: 2 },
    }
    const queues = { reports: [1, 2], disputes: [1], contestedReviews: [], reviews: [] }
    expect(badgeForModerationView('content', metrics, queues)).toBe(3)
    expect(badgeForModerationView('publications', metrics, queues)).toBe(2)
    expect(badgeForModerationView('queues', metrics, queues)).toBe(3)
    expect(badgeForModerationView('overview', metrics, queues)).toBe(0)
  })
})
