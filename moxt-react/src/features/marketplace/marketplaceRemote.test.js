import { describe, expect, it } from 'vitest'
import { listingFromRemoteRow, listingQuestionFromRemoteRow, mergeListingQuestions } from './marketplaceRemote'

describe('marketplaceRemote questions', () => {
  it('fusionne les questions distantes dans les annonces', () => {
    const listings = [{ id: 'ANN-1', title: 'Velo', questions: [] }]
    const merged = mergeListingQuestions(listings, [
      {
        id: 'QUE-1',
        listing_id: 'ANN-1',
        author_id: 'u1',
        author_name: 'Marie',
        text: 'Disponible ?',
        answer: '',
        created_at: '2026-07-08T10:00:00.000Z',
      },
    ])

    expect(merged[0].questions).toHaveLength(1)
    expect(listingQuestionFromRemoteRow(merged[0].questions[0]).text).toBe('Disponible ?')
  })

  it('prend les likes et commentaires colonnes plutôt que le payload', () => {
    const listing = listingFromRemoteRow({
      id: 'ANN-1',
      owner_id: 'owner',
      title: 'Velo',
      likes: ['u2'],
      comments: [
        {
          id: 'CMT-1',
          authorId: 'u2',
          authorName: 'Marie',
          text: 'Super',
          createdAt: '2026-08-28T10:00:00.000Z',
        },
      ],
      payload: {
        id: 'ANN-1',
        likes: ['stale'],
        comments: [],
      },
    })

    expect(listing.likes).toEqual(['u2'])
    expect(listing.comments).toHaveLength(1)
    expect(listing.comments[0].text).toBe('Super')
  })

  it('conserve les images du payload quand la colonne images est vide', () => {
    const listing = listingFromRemoteRow({
      id: 'ANN-IMG',
      owner_id: 'owner',
      title: 'Photo test',
      images: [],
      payload: {
        images: ['https://example.test/photo.webp'],
      },
    })

    expect(listing.images).toEqual(['https://example.test/photo.webp'])
  })
})
