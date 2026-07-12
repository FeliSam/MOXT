import { isActiveListing, isArchivedListing } from '../marketplace/listingCatalogUtils'

export const PUBLICATION_TYPE_TABS = [
  { id: 'listing', label: 'Annonces' },
  { id: 'parcel', label: 'Colis' },
  { id: 'job', label: 'Jobs' },
  { id: 'event', label: 'Événements' },
  { id: 'post', label: 'Publication' },
  { id: 'other', label: 'Autres' },
]

export const archivedPublicationCardClass =
  'bg-[var(--app-surface-muted)]/75 ring-1 ring-[var(--app-border)]/70'

const todayIso = () => new Date().toISOString().slice(0, 10)

export function isActiveParcel(parcel) {
  if (!parcel) return false
  if (parcel.status !== 'active') return false
  if (parcel.departureDate && parcel.departureDate < todayIso()) return false
  return true
}

export function isArchivedParcel(parcel) {
  if (!parcel) return false
  return !isActiveParcel(parcel)
}

export function isActiveJob(job) {
  return job?.status === 'active'
}

export function isArchivedJob(job) {
  return job ? !isActiveJob(job) : false
}

export function isActiveEvent(event) {
  return event?.status === 'published'
}

export function isArchivedEvent(event) {
  return event ? !isActiveEvent(event) : false
}

export function isActivePost(post) {
  return post?.status === 'published'
}

export function isArchivedPost(post) {
  return post ? !isActivePost(post) : false
}

function isBusinessPublication(item) {
  return Boolean(item?.businessId)
}

export function filterPublicationsByScope(publications, scope = 'personal') {
  const pick = (items) =>
    scope === 'business'
      ? items.filter(isBusinessPublication)
      : items.filter((item) => !isBusinessPublication(item))

  return {
    listings: pick(publications.listings),
    parcels: pick(publications.parcels),
    jobs: pick(publications.jobs),
    events: pick(publications.events),
    posts: scope === 'business' ? [] : publications.posts.filter((item) => !isBusinessPublication(item)),
    others: pick(publications.others),
  }
}

export function collectBusinessPublications(state, businessId) {
  if (!businessId) {
    return { listings: [], parcels: [], jobs: [], events: [], posts: [], others: [] }
  }
  const match = (item) => item?.businessId === businessId
  return {
    listings: (state.marketplace?.items || []).filter(match),
    parcels: (state.parcels?.items || []).filter(match),
    jobs: (state.jobs?.items || []).filter(match),
    events: (state.events?.items || []).filter(match),
    posts: [],
    others: (state.p2p?.offers || []).filter(match),
  }
}

export function collectUserPublications(state, userId) {
  if (!userId) {
    return { listings: [], parcels: [], jobs: [], events: [], posts: [], others: [] }
  }

  const listings = (state.marketplace?.items || []).filter((item) => item.ownerId === userId)
  const parcels = (state.parcels?.items || []).filter((item) => item.ownerId === userId)
  const jobs = (state.jobs?.items || []).filter((item) => item.ownerId === userId)
  const events = (state.events?.items || []).filter((item) => item.ownerId === userId)
  const posts = (state.posts?.items || []).filter((item) => item.authorId === userId)

  return { listings, parcels, jobs, events, posts, others: [] }
}

export function publicationTotalCount(publications) {
  return (
    publications.listings.length +
    publications.parcels.length +
    publications.jobs.length +
    publications.events.length +
    publications.posts.length +
    publications.others.length
  )
}

export function buildUserPublicationProfile(userId, publications, options = {}) {
  const { displayName = 'Membre MOXT' } = options
  const archiveCounts = publicationArchiveCounts(publications)
  const sampleListing = publications.listings[0]
  const sampleEvent = publications.events[0]

  return {
    userId,
    name: displayName,
    city: sampleListing?.city || sampleEvent?.city || '',
    country:
      sampleListing?.country || publications.parcels[0]?.originCountry || sampleEvent?.country || 'RU',
    activeCount: archiveCounts.active,
    archivedCount: archiveCounts.archived,
    totalViews: publicationTotalViews(publications),
    totalCount: publicationTotalCount(publications),
  }
}

export function buildBusinessPublicationProfile(business, publications) {
  const archiveCounts = publicationArchiveCounts(publications)

  return {
    businessId: business?.id || '',
    name: business?.name || 'Entreprise',
    city: business?.city || '',
    country: business?.country || '',
    memberSince: business?.createdAt || null,
    activeCount: archiveCounts.active,
    archivedCount: archiveCounts.archived,
    totalViews: publicationTotalViews(publications),
    totalCount: publicationTotalCount(publications),
  }
}

function filterByArchive(items, isActiveFn, isArchivedFn, archiveTab) {
  return items.filter((item) =>
    archiveTab === 'active' ? isActiveFn(item) : isArchivedFn(item),
  )
}

export function filterPublicationsByTabs(publications, { archiveTab, typeTab }) {
  const map = {
    listing: filterByArchive(
      publications.listings,
      isActiveListing,
      isArchivedListing,
      archiveTab,
    ),
    parcel: filterByArchive(publications.parcels, isActiveParcel, isArchivedParcel, archiveTab),
    job: filterByArchive(publications.jobs, isActiveJob, isArchivedJob, archiveTab),
    event: filterByArchive(publications.events, isActiveEvent, isArchivedEvent, archiveTab),
    post: filterByArchive(publications.posts, isActivePost, isArchivedPost, archiveTab),
    other: filterByArchive(publications.others, () => true, () => true, archiveTab),
  }

  if (typeTab === 'all') {
    return map
  }

  return {
    listing: typeTab === 'listing' ? map.listing : [],
    parcel: typeTab === 'parcel' ? map.parcel : [],
    job: typeTab === 'job' ? map.job : [],
    event: typeTab === 'event' ? map.event : [],
    post: typeTab === 'post' ? map.post : [],
    other: typeTab === 'other' ? map.other : [],
  }
}

export function publicationTypeCounts(publications, archiveTab) {
  const filtered = filterPublicationsByTabs(publications, { archiveTab, typeTab: 'all' })
  return {
    listing: filtered.listing.length,
    parcel: filtered.parcel.length,
    job: filtered.job.length,
    event: filtered.event.length,
    post: filtered.post.length,
    other: filtered.other.length,
  }
}

export function publicationArchiveCounts(publications) {
  const active = filterPublicationsByTabs(publications, { archiveTab: 'active', typeTab: 'all' })
  const archived = filterPublicationsByTabs(publications, { archiveTab: 'archived', typeTab: 'all' })
  const countAll = (bucket) =>
    bucket.listing.length +
    bucket.parcel.length +
    bucket.job.length +
    bucket.event.length +
    bucket.post.length +
    bucket.other.length
  return {
    active: countAll(active),
    archived: countAll(archived),
  }
}

export function publicationTotalViews(publications) {
  return publications.listings.reduce((sum, item) => sum + (Number(item.views) || 0), 0)
}

export function visiblePublicationCount(visible) {
  return (
    visible.listing.length +
    visible.parcel.length +
    visible.job.length +
    visible.event.length +
    visible.post.length +
    visible.other.length
  )
}
