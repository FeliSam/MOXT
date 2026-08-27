import { describe, expect, it } from 'vitest'
import reducer, {
  contestReview,
  createReview,
  deleteReview,
  moderateReview,
  receiveRemoteReview,
  reconcileTargetReviews,
  removeRemoteReview,
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

  it('applique un avis distant et retire un avis supprimé à distance', () => {
    const created = reducer(
      emptyState,
      createReview({
        id: 'REV-1',
        targetType: 'business',
        targetId: 'b1',
        authorId: 'u1',
        authorName: 'Amina',
        rating: 5,
        comment: 'Parfait.',
      }),
    )
    const hidden = reducer(
      created,
      receiveRemoteReview({ ...created.items[0], status: 'hidden' }),
    )
    expect(hidden.items[0].status).toBe('hidden')
    const removed = reducer(hidden, removeRemoteReview('REV-1'))
    expect(removed.items).toHaveLength(0)
  })

  it('remplace les avis d une cible par le jeu distant', () => {
    const local = reducer(
      emptyState,
      setAll({
        items: [
          {
            id: 'REV-keep',
            targetType: 'business',
            targetId: 'other',
            authorId: 'u2',
            status: 'published',
            createdAt: '2026-08-01T00:00:00.000Z',
          },
          {
            id: 'REV-stale',
            targetType: 'business',
            targetId: 'b1',
            authorId: 'u3',
            status: 'published',
            createdAt: '2026-08-01T00:00:00.000Z',
          },
        ],
      }),
    )
    const reconciled = reducer(
      local,
      reconcileTargetReviews({
        profileTargetType: 'business',
        profileTargetId: 'b1',
        publicationIds: { listing: [], parcel: [], job: [], event: [], post: [] },
        items: [
          {
            id: 'REV-fresh',
            targetType: 'business',
            targetId: 'b1',
            authorId: 'u4',
            status: 'published',
            createdAt: '2026-08-20T00:00:00.000Z',
          },
        ],
      }),
    )
    expect(reconciled.items.map((item) => item.id).sort()).toEqual(['REV-fresh', 'REV-keep'])
  })

  it('retire un avis récent absent du snapshot distant', () => {
    const local = reducer(
      emptyState,
      setAll({
        items: [
          {
            id: 'REV-stale',
            targetType: 'business',
            targetId: 'b1',
            createdAt: '2026-08-20T00:00:00.000Z',
            status: 'published',
          },
          {
            id: 'REV-old',
            targetType: 'business',
            targetId: 'b1',
            createdAt: '2026-01-01T00:00:00.000Z',
            status: 'published',
          },
        ],
      }),
    )
    const pruned = reducer(
      local,
      setAll({
        pruneRecentMissing: true,
        items: [
          {
            id: 'REV-live',
            targetType: 'business',
            targetId: 'b1',
            createdAt: '2026-08-10T00:00:00.000Z',
            status: 'published',
          },
        ],
      }),
    )
    expect(pruned.items.map((item) => item.id).sort()).toEqual(['REV-live', 'REV-old'])
  })
})
