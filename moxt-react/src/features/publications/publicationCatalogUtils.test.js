import { describe, expect, it } from 'vitest'
import {
  collectUserPublications,
  filterPublicationsByScope,
} from './publicationCatalogUtils'

describe('publicationCatalogUtils', () => {
  const state = {
    marketplace: {
      items: [
        { id: 'L1', ownerId: 'u1', businessId: null, title: 'Perso' },
        { id: 'L2', ownerId: 'u1', businessId: 'BIZ-1', title: 'Entreprise' },
        { id: 'L3', ownerId: 'u2', businessId: 'BIZ-2', title: 'Autre' },
      ],
    },
    parcels: { items: [{ id: 'P1', ownerId: 'u1', businessId: 'BIZ-1' }] },
    jobs: { items: [] },
    events: { items: [] },
    posts: { items: [{ id: 'POST-1', authorId: 'u1' }] },
  }

  it('inclut les publications personnelles et entreprise du membre', () => {
    const publications = collectUserPublications(state, 'u1')
    expect(publications.listings).toHaveLength(2)
    expect(publications.parcels).toHaveLength(1)
    expect(publications.posts).toHaveLength(1)
  })

  it('filtre les publications entreprise', () => {
    const publications = collectUserPublications(state, 'u1')
    const businessOnly = filterPublicationsByScope(publications, 'business')
    expect(businessOnly.listings).toHaveLength(1)
    expect(businessOnly.listings[0].id).toBe('L2')
    expect(businessOnly.parcels).toHaveLength(1)
    expect(businessOnly.posts).toHaveLength(0)
  })
})
