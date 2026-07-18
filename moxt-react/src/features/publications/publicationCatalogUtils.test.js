import { describe, expect, it } from 'vitest'
import {
  buildBusinessPublicationProfile,
  collectUserPublications,
  filterPublicationsByScope,
  filterPublicationsByTabs,
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
    p2p: {
      offers: [
        { id: 'O1', ownerId: 'u1', businessId: null, status: 'active' },
        { id: 'O2', ownerId: 'u1', businessId: 'BIZ-1', status: 'archived' },
        { id: 'O3', ownerId: 'u2', businessId: null, status: 'active' },
      ],
    },
  }

  it('inclut les publications personnelles et entreprise du membre', () => {
    const publications = collectUserPublications(state, 'u1')
    expect(publications.listings).toHaveLength(2)
    expect(publications.parcels).toHaveLength(1)
    expect(publications.posts).toHaveLength(1)
    expect(publications.others).toHaveLength(2)
  })

  it('filtre les publications entreprise', () => {
    const publications = collectUserPublications(state, 'u1')
    const businessOnly = filterPublicationsByScope(publications, 'business')
    expect(businessOnly.listings).toHaveLength(1)
    expect(businessOnly.listings[0].id).toBe('L2')
    expect(businessOnly.parcels).toHaveLength(1)
    expect(businessOnly.posts).toHaveLength(0)
    expect(businessOnly.others.map((item) => item.id)).toEqual(['O2'])
  })

  it('filtre les publications personnelles', () => {
    const publications = collectUserPublications(state, 'u1')
    const personalOnly = filterPublicationsByScope(publications, 'personal')
    expect(personalOnly.listings).toHaveLength(1)
    expect(personalOnly.listings[0].id).toBe('L1')
    expect(personalOnly.parcels).toHaveLength(0)
    expect(personalOnly.posts).toHaveLength(1)
    expect(personalOnly.others.map((item) => item.id)).toEqual(['O1'])
  })

  it('sépare les offres P2P actives et archivées', () => {
    const publications = collectUserPublications(state, 'u1')
    const active = filterPublicationsByTabs(publications, {
      archiveTab: 'active',
      typeTab: 'other',
    })
    const archived = filterPublicationsByTabs(publications, {
      archiveTab: 'archived',
      typeTab: 'other',
    })

    expect(active.other.map((item) => item.id)).toEqual(['O1'])
    expect(archived.other.map((item) => item.id)).toEqual(['O2'])
  })

  it('construit le profil entreprise depuis les données actuelles', () => {
    const business = {
      id: 'BIZ-1',
      name: 'MOXT Pro',
      city: 'Moscou',
      country: 'RU',
      createdAt: '2026-01-15T10:00:00.000Z',
    }
    const publications = {
      listings: [{ id: 'L1', views: 12 }],
      parcels: [],
      jobs: [],
      events: [],
      posts: [],
      others: [],
    }

    const profile = buildBusinessPublicationProfile(business, publications)
    expect(profile.name).toBe('MOXT Pro')
    expect(profile.city).toBe('Moscou')
    expect(profile.country).toBe('RU')
    expect(profile.memberSince).toBe('2026-01-15T10:00:00.000Z')
    expect(profile.totalCount).toBe(1)
    expect(profile.totalViews).toBe(12)
  })
})
