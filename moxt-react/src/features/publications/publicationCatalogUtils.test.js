import { describe, expect, it } from 'vitest'
import {
  buildBusinessPublicationProfile,
  collectUserPublications,
  filterPublicationsByScope,
  filterPublicationsByTabs,
  publicationArchiveCounts,
  preferredPublicationArchiveTab,
  PUBLICATION_TYPE_TABS,
  visiblePublicationTypeTabs,
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
    videos: {
      items: [
        { id: 'V1', ownerId: 'u1', businessId: 'BIZ-1', status: 'active', title: 'Reel' },
        { id: 'V2', ownerId: 'u1', businessId: 'BIZ-1', status: 'archived', title: 'Old' },
      ],
    },
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
    expect(publications.videos).toHaveLength(2)
    expect(publications.others).toHaveLength(2)
  })

  it('filtre les publications entreprise', () => {
    const publications = collectUserPublications(state, 'u1')
    const businessOnly = filterPublicationsByScope(publications, 'business')
    expect(businessOnly.listings).toHaveLength(1)
    expect(businessOnly.listings[0].id).toBe('L2')
    expect(businessOnly.parcels).toHaveLength(1)
    expect(businessOnly.posts).toHaveLength(0)
    expect(businessOnly.videos).toHaveLength(2)
    expect(businessOnly.others.map((item) => item.id)).toEqual(['O2'])
  })

  it('filtre les publications personnelles', () => {
    const publications = collectUserPublications(state, 'u1')
    const personalOnly = filterPublicationsByScope(publications, 'personal')
    expect(personalOnly.listings).toHaveLength(1)
    expect(personalOnly.listings[0].id).toBe('L1')
    expect(personalOnly.parcels).toHaveLength(0)
    expect(personalOnly.posts).toHaveLength(1)
    expect(personalOnly.videos).toHaveLength(0)
    expect(personalOnly.others.map((item) => item.id)).toEqual(['O1'])
  })

  it('sépare les vidéos actives et archivées', () => {
    const publications = collectUserPublications(state, 'u1')
    const active = filterPublicationsByTabs(publications, {
      archiveTab: 'active',
      typeTab: 'video',
    })
    const archived = filterPublicationsByTabs(publications, {
      archiveTab: 'archived',
      typeTab: 'video',
    })
    expect(active.video.map((item) => item.id)).toEqual(['V1'])
    expect(archived.video.map((item) => item.id)).toEqual(['V2'])
  })

  it('expose l’onglet video dans PUBLICATION_TYPE_TABS', () => {
    expect(PUBLICATION_TYPE_TABS.some((tab) => tab.id === 'video')).toBe(true)
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

  it('compte les archives du type sélectionné seulement', () => {
    const publications = collectUserPublications(state, 'u1')
    const all = publicationArchiveCounts(publications)
    const others = publicationArchiveCounts(publications, { typeTab: 'other' })
    const posts = publicationArchiveCounts(publications, { typeTab: 'post' })

    expect(all.archived).toBeGreaterThanOrEqual(others.archived)
    expect(others.active).toBe(1)
    expect(others.archived).toBe(1)
    expect(posts.active + posts.archived).toBe(1)
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

  it('masque les onglets de type dont le compteur est à zéro', () => {
    const visible = visiblePublicationTypeTabs(PUBLICATION_TYPE_TABS, {
      listing: 2,
      parcel: 0,
      job: 0,
      event: 1,
      video: 0,
      post: 0,
      other: 1,
    })
    expect(visible.map((tab) => tab.id)).toEqual(['listing', 'event', 'other'])
  })

  it('affiche les archives quand il n’y a plus d’éléments actifs', () => {
    const onlyArchived = {
      listings: [{ id: 'L1', status: 'archived' }],
      parcels: [],
      jobs: [],
      events: [],
      videos: [],
      posts: [],
      others: [],
    }
    expect(preferredPublicationArchiveTab(onlyArchived, 'active')).toBe('archived')
    expect(preferredPublicationArchiveTab(onlyArchived, 'archived')).toBe('archived')

    const onlyActive = {
      listings: [{ id: 'L1', status: 'active' }],
      parcels: [],
      jobs: [],
      events: [],
      videos: [],
      posts: [],
      others: [],
    }
    expect(preferredPublicationArchiveTab(onlyActive, 'active')).toBe('active')
    expect(preferredPublicationArchiveTab(onlyActive, 'archived')).toBe('active')
  })
})
