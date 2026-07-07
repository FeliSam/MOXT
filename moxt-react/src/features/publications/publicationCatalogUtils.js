import { isActiveListing, isArchivedListing } from '../marketplace/listingCatalogUtils'

export const PUBLICATION_TYPE_TABS = [
  { id: 'listing', label: 'Annonces' },
  { id: 'parcel', label: 'Colis' },
  { id: 'job', label: 'Jobs' },
  { id: 'other', label: 'Autres' },
]

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

function isPersonal(item) {
  return !item?.businessId
}

export function collectUserPublications(state, userId) {
  if (!userId) {
    return { listings: [], parcels: [], jobs: [], others: [] }
  }

  const listings = (state.marketplace?.items || []).filter(
    (item) => item.ownerId === userId && isPersonal(item),
  )
  const parcels = (state.parcels?.items || []).filter(
    (item) => item.ownerId === userId && isPersonal(item),
  )
  const jobs = (state.jobs?.items || []).filter(
    (item) => item.ownerId === userId && isPersonal(item),
  )
  const events = (state.events?.items || []).filter(
    (item) => item.ownerId === userId && isPersonal(item),
  )
  const posts = (state.posts?.items || []).filter((item) => item.authorId === userId)

  const others = [
    ...events.map((item) => ({ kind: 'event', item })),
    ...posts.map((item) => ({ kind: 'post', item })),
  ]

  return { listings, parcels, jobs, others }
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
    other: publications.others.filter(({ kind, item }) => {
      if (kind === 'event') {
        return archiveTab === 'active' ? isActiveEvent(item) : isArchivedEvent(item)
      }
      return archiveTab === 'active' ? isActivePost(item) : isArchivedPost(item)
    }),
  }

  if (typeTab === 'all') {
    return map
  }

  return {
    listing: typeTab === 'listing' ? map.listing : [],
    parcel: typeTab === 'parcel' ? map.parcel : [],
    job: typeTab === 'job' ? map.job : [],
    other: typeTab === 'other' ? map.other : [],
  }
}

export function publicationTypeCounts(publications, archiveTab) {
  const filtered = filterPublicationsByTabs(publications, { archiveTab, typeTab: 'all' })
  return {
    listing: filtered.listing.length,
    parcel: filtered.parcel.length,
    job: filtered.job.length,
    other: filtered.other.length,
  }
}

export function publicationArchiveCounts(publications) {
  const active = filterPublicationsByTabs(publications, { archiveTab: 'active', typeTab: 'all' })
  const archived = filterPublicationsByTabs(publications, { archiveTab: 'archived', typeTab: 'all' })
  const countAll = (bucket) =>
    bucket.listing.length + bucket.parcel.length + bucket.job.length + bucket.other.length
  return {
    active: countAll(active),
    archived: countAll(archived),
  }
}

export function publicationTotalViews(publications) {
  return publications.listings.reduce((sum, item) => sum + (Number(item.views) || 0), 0)
}
