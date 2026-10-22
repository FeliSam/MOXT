import { describe, expect, it } from 'vitest'
import {
  collectUserPublicationsFromCatalogs,
  filterPublicationsByScope,
  filterPublicationsByTabs,
  isArchivedListing,
  preferredPublicationArchiveTab,
  publicProfileArchiveRequest,
  publicationArchiveCounts,
  publicationTypeCounts,
} from './publicationRules.js'

const uid = 'u1'
const publications = {
  listings: [
    { id: 'l1', status: 'active', ownerId: uid },
    { id: 'l2', status: 'sold', ownerId: uid },
    { id: 'l3', status: 'pending_review', ownerId: uid },
    { id: 'l4', status: 'active', ownerId: uid, businessId: 'b1' },
  ],
  parcels: [
    { id: 'p1', status: 'active', departureDate: '2000-01-01', ownerId: uid },
    { id: 'p2', status: 'active', departureDate: '2999-01-01', ownerId: uid },
  ],
  jobs: [{ id: 'j1', status: 'closed', ownerId: uid }],
  events: [{ id: 'e1', status: 'published', ownerId: uid }],
  videos: [{ id: 'v1', status: 'active', ownerId: uid, businessId: 'b1' }],
  posts: [
    { id: 'po1', status: 'published', authorId: uid },
    { id: 'po2', status: 'draft', authorId: uid },
  ],
  others: [
    { id: 'o1', status: 'active', ownerId: uid },
    { id: 'o2', status: 'closed', ownerId: uid },
  ],
}

describe('publicationRules', () => {
  it('reprend les statuts d’archive du web', () => {
    expect(isArchivedListing({ status: 'draft' })).toBe(true)
    expect(isArchivedListing({ status: 'pending_review' })).toBe(false)
  })

  it('portée personnelle : sans entreprise ni vidéos, catégorie Autres incluse', () => {
    const scoped = filterPublicationsByScope(publications, 'personal')
    expect(scoped.listings.map((item) => item.id)).toEqual(['l1', 'l2', 'l3'])
    expect(scoped.videos).toEqual([])
    expect(scoped.others).toHaveLength(2)
  })

  it('compte actives / archivées comme la page Mes publications (en attente = actif)', () => {
    const scoped = filterPublicationsByScope(publications, 'personal')
    expect(publicationArchiveCounts(scoped, { includePending: true })).toEqual({ active: 6, archived: 5 })
    expect(publicationArchiveCounts(scoped)).toEqual({ active: 5, archived: 5 })
    expect(publicationTypeCounts(scoped, 'archived', { includePending: true })).toEqual({
      listing: 1, parcel: 1, job: 1, event: 0, video: 0, post: 1, other: 1,
    })
  })

  it('filtre par onglet de type et bascule sur les archives si aucune active', () => {
    const visible = filterPublicationsByTabs(publications, { archiveTab: 'active', typeTab: 'other' })
    expect(visible.other.map((item) => item.id)).toEqual(['o1'])
    expect(visible.listing).toEqual([])
    const onlyArchived = { ...publications, listings: [{ status: 'sold' }], parcels: [], events: [], videos: [], posts: [], others: [] }
    expect(preferredPublicationArchiveTab(onlyArchived, 'active')).toBe('archived')
  })

  it('colle l’onglet archives après les annonces, comme le premier paint du web', () => {
    const pubs = {
      listings: [{ id: 'l', status: 'sold', ownerId: uid }],
      parcels: [],
      jobs: [],
      events: [{ id: 'e', status: 'published', ownerId: uid }],
      videos: [],
      posts: [],
      others: [],
    }
    expect(preferredPublicationArchiveTab(pubs, 'active')).toBe('active')
    expect(publicProfileArchiveRequest(pubs)).toBe('archived')
  })

  it('sélectionne par propriétaire dans les catalogues (posts par auteur)', () => {
    const picked = collectUserPublicationsFromCatalogs(
      { listings: [{ ownerId: uid }, { ownerId: 'x' }], posts: [{ authorId: uid }], others: [{ ownerId: 'x' }] },
      uid,
    )
    expect(picked.listings).toHaveLength(1)
    expect(picked.posts).toHaveLength(1)
    expect(picked.others).toHaveLength(0)
  })
})
