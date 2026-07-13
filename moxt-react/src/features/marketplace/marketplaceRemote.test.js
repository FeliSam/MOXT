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
