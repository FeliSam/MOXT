import { describe, expect, it } from 'vitest'
import reducer, {
  contestReview,
  createReview,
  moderateReview,
  replyToReview,
} from './reviewSlice'

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

  it('permet au propriétaire de répondre', () => {
    const created = reducer(
      { items: [] },
      createReview({
        targetType: 'user_profile',
        targetId: 'u2',
        authorId: 'u1',
        authorName: 'Amina',
        rating: 4,
        comment: 'Bon vendeur.',
      }),
    )
    const state = reducer(
      created,
      replyToReview({
        id: created.items[0].id,
        replyText: 'Merci pour votre retour.',
        replyAt: '2026-07-08T00:00:00.000Z',
        replyBy: 'u2',
      }),
    )
    expect(state.items[0].replyText).toBe('Merci pour votre retour.')
  })

  it('permet de contester un avis', () => {
    const created = reducer(
      { items: [] },
      createReview({
        targetType: 'business',
        targetId: 'b1',
        authorId: 'u1',
        authorName: 'Amina',
        rating: 2,
        comment: 'Déçu.',
      }),
    )
    const state = reducer(
      created,
      contestReview({
        id: created.items[0].id,
        disputeReason: 'Cet avis ne correspond pas à une transaction réelle.',
        disputedAt: '2026-07-08T00:00:00.000Z',
      }),
    )
    expect(state.items[0].disputeStatus).toBe('pending')
  })
})
