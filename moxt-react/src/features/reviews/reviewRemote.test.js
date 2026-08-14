import { beforeEach, describe, expect, it, vi } from 'vitest'

const { reviewQuery, fromMock } = vi.hoisted(() => {
  const reviewQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    delete: vi.fn(),
    maybeSingle: vi.fn(),
  }
  return {
    reviewQuery,
    fromMock: vi.fn(() => reviewQuery),
  }
})

vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

vi.mock('../../services/remoteRowMapper', () => ({
  fromRow: (row) => ({
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    authorId: row.author_id,
    status: row.status,
  }),
}))

import { deleteReviewRemote, fetchReviewsForTargetScope } from './reviewRemote'

function chainableQuery(finalResult) {
  reviewQuery.select.mockReturnValue(reviewQuery)
  reviewQuery.eq.mockReturnValue(reviewQuery)
  reviewQuery.in.mockReturnValue(reviewQuery)
  reviewQuery.order.mockReturnValue(reviewQuery)
  reviewQuery.limit.mockResolvedValue(finalResult)
  reviewQuery.delete.mockReturnValue(reviewQuery)
  reviewQuery.maybeSingle.mockResolvedValue(finalResult)
  return reviewQuery
}

describe('reviewRemote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chainableQuery({
      data: [
        {
          id: 'REV-1',
          target_type: 'user_profile',
          target_id: 'u-target',
          author_id: 'u-author',
          status: 'published',
        },
      ],
      error: null,
    })
  })

  it('interroge le profil et les publications liées', async () => {
    const reviews = await fetchReviewsForTargetScope({
      profileTargetType: 'user_profile',
      profileTargetId: 'u-target',
      publicationIds: { listing: ['L1'] },
    })

    expect(reviews).toHaveLength(1)
    expect(reviews[0].targetId).toBe('u-target')
    expect(reviewQuery.in).toHaveBeenCalledWith('target_id', ['L1'])
  })

  it('supprime via l id distant résolu auteur+cible', async () => {
    reviewQuery.maybeSingle.mockResolvedValueOnce({
      data: { id: 'uuid-remote' },
      error: null,
    })
    reviewQuery.select.mockImplementation((columns) => {
      if (columns === 'id' && reviewQuery.delete.mock.calls.length) {
        return Promise.resolve({ data: [{ id: 'uuid-remote' }], error: null })
      }
      return reviewQuery
    })

    await deleteReviewRemote('REV-local', {
      authorId: 'u-author',
      targetType: 'listing',
      targetId: 'L1',
    })

    expect(reviewQuery.delete).toHaveBeenCalled()
  })

  it('ne lève pas si l avis est déjà absent côté serveur', async () => {
    let pendingDeleteSelect = false
    reviewQuery.delete.mockImplementation(() => {
      pendingDeleteSelect = true
      return reviewQuery
    })
    reviewQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    reviewQuery.select.mockImplementation(() => {
      if (pendingDeleteSelect) {
        pendingDeleteSelect = false
        return Promise.resolve({ data: [], error: null })
      }
      return reviewQuery
    })

    await expect(
      deleteReviewRemote('REV-missing', {
        authorId: 'u-author',
        targetType: 'listing',
        targetId: 'L-missing',
      }),
    ).resolves.toBeUndefined()
  })
})
