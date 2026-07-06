import { describe, expect, it } from 'vitest'
import reducer, { createReview, moderateReview } from './reviewSlice'

describe('reviews', () => {
  it('garde un avis par auteur et cible', () => {
    const first = reducer(
      { items: [] },
      createReview({
        targetType: 'business',
        targetId: 'b1',
        authorId: 'u1',
        authorName: 'Amina',
        rating: 4,
        comment: 'Service sérieux.',
      }),
    )
    const second = reducer(
      first,
      createReview({
        targetType: 'business',
        targetId: 'b1',
        authorId: 'u1',
        authorName: 'Amina',
        rating: 5,
        comment: 'Service excellent.',
      }),
    )
    expect(second.items).toHaveLength(1)
    expect(second.items[0].rating).toBe(5)
  })

  it('modère un avis', () => {
    const created = reducer(
      { items: [] },
      createReview({
        targetType: 'business',
        targetId: 'b1',
        authorId: 'u1',
        authorName: 'Amina',
        rating: 4,
        comment: 'Service sérieux.',
      }),
    )
    const state = reducer(
      created,
      moderateReview({ id: created.items[0].id, status: 'suspended', moderatedBy: 'admin' }),
    )
    expect(state.items[0].status).toBe('suspended')
  })
})
