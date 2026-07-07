import { describe, expect, it } from 'vitest'
import {
  buildListingFavoriteSnapshot,
  favoriteCategoryForType,
  groupFavoritesByCategory,
  resolveFavoriteItem,
} from './favoriteUtils'

describe('favoriteUtils', () => {
  it('classe les favoris par catégorie', () => {
    const grouped = groupFavoritesByCategory([
      { relatedType: 'listing', id: '1' },
      { relatedType: 'parcel', id: '2' },
      { relatedType: 'job', id: '3' },
      { relatedType: 'event', id: '4' },
    ])
    expect(grouped.map((group) => group.id)).toEqual(['listing', 'parcel', 'job', 'other'])
  })

  it('construit un snapshot annonce', () => {
    expect(
      buildListingFavoriteSnapshot({
        id: 'L1',
        title: 'iPhone',
        price: 120000,
        currency: 'XOF',
        city: 'Cotonou',
        images: ['https://img.test/1.jpg'],
        type: 'product',
        category: 'electronics',
      }),
    ).toMatchObject({
      title: 'iPhone',
      price: 120000,
      image: 'https://img.test/1.jpg',
    })
  })

  it('résout une annonce depuis le store', () => {
    const favorite = resolveFavoriteItem(
      {
        id: 'F1',
        relatedType: 'listing',
        relatedId: 'L1',
        title: 'iPhone',
        path: '/marketplace/L1',
        snapshot: { price: 120000, currency: 'XOF', city: 'Cotonou' },
      },
      {
        marketplace: { items: [{ id: 'L1', title: 'iPhone', images: ['https://img.test/1.jpg'] }] },
        jobs: { items: [] },
        parcels: { items: [] },
        businesses: { items: [] },
        events: { items: [] },
      },
    )
    expect(favorite.display.title).toBe('iPhone')
    expect(favorite.display.image).toBe('https://img.test/1.jpg')
    expect(favoriteCategoryForType('job')).toBe('job')
  })
})
