import { describe, expect, it } from 'vitest'
import reducer, {
  contestReview,
  createReview,
  deleteReview,
  moderateReview,
  replyToReview,
  restoreReviewDeleted,
  setAll,
} from './reviewSlice'

const emptyState = { items: [], deletedIds: [], deletedKeys: [] }

describe('reviews', () => {
  it('garde un avis par auteur et cible', () => {
    const first = reducer(
      emptyState,
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
      emptyState,
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
      emptyState,
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
      emptyState,
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

  it('supprime un avis et mémorise la suppression', () => {
    const created = reducer(
      emptyState,
      createReview({
        targetType: 'business',
        targetId: 'b1',
        authorId: 'u1',
        authorName: 'Amina',
        rating: 2,
        comment: 'Déçu.',
      }),
    )
    const state = reducer(created, deleteReview(created.items[0].id))
    expect(state.items).toHaveLength(0)
    expect(state.deletedIds).toContain(created.items[0].id)
    expect(state.deletedKeys).toContain('u1:business:b1')
  })

  it('ignore un avis supprimé lors d une resynchronisation', () => {
    const created = reducer(
      emptyState,
      createReview({
        id: 'REV-local',
        targetType: 'business',
        targetId: 'b1',
        authorId: 'u1',
        authorName: 'Amina',
        rating: 2,
        comment: 'Déçu.',
      }),
    )
    const deleted = reducer(created, deleteReview('REV-local'))
    const synced = reducer(
      deleted,
      setAll({
        items: [
          {
            id: 'REV-remote',
            targetType: 'business',
            targetId: 'b1',
            authorId: 'u1',
            authorName: 'Amina',
            rating: 2,
            comment: 'Déçu.',
            status: 'published',
            createdAt: '2026-07-08T00:00:00.000Z',
            updatedAt: '2026-07-08T00:00:00.000Z',
          },
        ],
      }),
    )
    expect(synced.items).toHaveLength(0)
    expect(synced.deletedKeys).toContain('u1:business:b1')
  })

  it('restaure un avis si la suppression distante échoue', () => {
    const created = reducer(
      emptyState,
      createReview({
        targetType: 'business',
        targetId: 'b1',
        authorId: 'u1',
        authorName: 'Amina',
        rating: 2,
        comment: 'Déçu.',
      }),
    )
    const deleted = reducer(created, deleteReview(created.items[0].id))
    const restored = reducer(
      deleted,
      restoreReviewDeleted({ review: created.items[0] }),
    )
    expect(restored.items).toHaveLength(1)
    expect(restored.deletedIds).toHaveLength(0)
    expect(restored.deletedKeys).toHaveLength(0)
  })

  it('réconcilie un id local avec l id distant après conflit auteur+cible', () => {
    const created = reducer(
      emptyState,
      createReview({
        id: 'REV-local',
        targetType: 'business',
        targetId: 'b1',
        authorId: 'u1',
        authorName: 'Amina',
        rating: 4,
        comment: 'Service sérieux.',
      }),
    )
    const state = reducer(created, {
      type: 'reviews/reconcileReviewId',
      payload: { localId: 'REV-local', remoteId: 'REV-remote' },
    })
    expect(state.items).toHaveLength(1)
    expect(state.items[0].id).toBe('REV-remote')
  })
})
