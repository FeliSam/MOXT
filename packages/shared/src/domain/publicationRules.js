/**
 * Règles « Mes publications » partagées web + mobile (source unique).
 * Le web réexporte ces fonctions depuis features/publications/publicationCatalogUtils.js
 * (les onglets avec icônes react-icons restent côté web).
 */
import { todayIsoDate } from './parcelRules.js'

export const PUBLICATION_TYPE_IDS = ['listing', 'parcel', 'job', 'event', 'video', 'post', 'other']

export const PUBLICATION_TYPE_LABELS = {
  listing: 'Annonces',
  parcel: 'Colis',
  job: 'Jobs',
  event: 'Événements',
  video: 'Vidéos',
  post: 'Publication',
  other: 'Autres',
}

const ARCHIVED_LISTING_STATUSES = new Set(['archived', 'sold', 'expired', 'draft'])

export function isActiveListing(listing) {
  return listing?.status === 'active'
}

export function isArchivedListing(listing) {
  return ARCHIVED_LISTING_STATUSES.has(listing?.status)
}

export function isActiveVideo(video) {
  return video?.status === 'active'
}

export function isArchivedVideo(video) {
  return video ? !isActiveVideo(video) : false
}

export function isActiveParcel(parcel) {
  if (!parcel) return false
  if (parcel.status !== 'active') return false
  const departure = parcel.departureDate ?? parcel.departure_date
  if (departure && departure < todayIsoDate()) return false
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

export function isActiveP2POffer(offer) {
  return offer?.status === 'active'
}

export function isArchivedP2POffer(offer) {
  return offer ? !isActiveP2POffer(offer) : false
}

function isBusinessPublication(item) {
  return Boolean(item?.businessId ?? item?.business_id)
}

export function emptyPublications() {
  return { listings: [], parcels: [], jobs: [], events: [], videos: [], posts: [], others: [] }
}

export function filterPublicationsByScope(publications, scope = 'personal') {
  const pick = (items = []) =>
    scope === 'business'
      ? items.filter(isBusinessPublication)
      : items.filter((item) => !isBusinessPublication(item))

  return {
    listings: pick(publications.listings),
    parcels: pick(publications.parcels),
    jobs: pick(publications.jobs),
    events: pick(publications.events),
    // Vidéos toujours business-scoped
    videos: scope === 'business' ? publications.videos || [] : [],
    posts:
      scope === 'business' ? [] : (publications.posts || []).filter((item) => !isBusinessPublication(item)),
    others: pick(publications.others),
  }
}

/** Sélection par propriétaire dans des catalogues déjà chargés (même règle que le web). */
export function collectUserPublicationsFromCatalogs(catalogs = {}, userId) {
  if (!userId) return emptyPublications()
  const own = (items = []) => items.filter((item) => item?.ownerId === userId)
  return {
    listings: own(catalogs.listings),
    parcels: own(catalogs.parcels),
    jobs: own(catalogs.jobs),
    events: own(catalogs.events),
    videos: own(catalogs.videos),
    posts: (catalogs.posts || []).filter((item) => item?.authorId === userId),
    others: own(catalogs.others),
  }
}

export function collectBusinessPublicationsFromCatalogs(catalogs = {}, businessId) {
  if (!businessId) return emptyPublications()
  const match = (items = []) => items.filter((item) => item?.businessId === businessId)
  return {
    listings: match(catalogs.listings),
    parcels: match(catalogs.parcels),
    jobs: match(catalogs.jobs),
    events: match(catalogs.events),
    videos: match(catalogs.videos),
    posts: [],
    others: match(catalogs.others),
  }
}

export function publicationTotalCount(publications) {
  return (
    (publications.listings?.length || 0) +
    (publications.parcels?.length || 0) +
    (publications.jobs?.length || 0) +
    (publications.events?.length || 0) +
    (publications.videos?.length || 0) +
    (publications.posts?.length || 0) +
    (publications.others?.length || 0)
  )
}

function isPendingReview(item) {
  return item?.status === 'pending_review'
}

function filterByArchive(items = [], isActiveFn, isArchivedFn, archiveTab, includePending = false) {
  return items.filter((item) => {
    if (archiveTab === 'active') {
      return isActiveFn(item) || (includePending && isPendingReview(item))
    }
    if (includePending && isPendingReview(item)) return false
    return isArchivedFn(item)
  })
}

export function filterPublicationsByTabs(publications, { archiveTab, typeTab, includePending = false }) {
  const map = {
    listing: filterByArchive(publications.listings, isActiveListing, isArchivedListing, archiveTab, includePending),
    parcel: filterByArchive(publications.parcels, isActiveParcel, isArchivedParcel, archiveTab, includePending),
    job: filterByArchive(publications.jobs, isActiveJob, isArchivedJob, archiveTab, includePending),
    event: filterByArchive(publications.events, isActiveEvent, isArchivedEvent, archiveTab, includePending),
    video: filterByArchive(publications.videos || [], isActiveVideo, isArchivedVideo, archiveTab, includePending),
    post: filterByArchive(publications.posts, isActivePost, isArchivedPost, archiveTab, includePending),
    other: filterByArchive(publications.others, isActiveP2POffer, isArchivedP2POffer, archiveTab, includePending),
  }

  if (typeTab === 'all') return map

  return Object.fromEntries(PUBLICATION_TYPE_IDS.map((id) => [id, typeTab === id ? map[id] : []]))
}

export function publicationTypeCounts(publications, archiveTab, { includePending = false } = {}) {
  const filtered = filterPublicationsByTabs(publications, { archiveTab, typeTab: 'all', includePending })
  return Object.fromEntries(PUBLICATION_TYPE_IDS.map((id) => [id, filtered[id].length]))
}

export function visiblePublicationCount(visible) {
  return PUBLICATION_TYPE_IDS.reduce((sum, id) => sum + (visible[id]?.length || 0), 0)
}

export function publicationArchiveCounts(publications, { includePending = false, typeTab = 'all' } = {}) {
  const active = filterPublicationsByTabs(publications, { archiveTab: 'active', typeTab, includePending })
  const archived = filterPublicationsByTabs(publications, { archiveTab: 'archived', typeTab, includePending })
  return {
    active: visiblePublicationCount(active),
    archived: visiblePublicationCount(archived),
  }
}

/**
 * S’il n’y a plus d’actifs mais des archives, on affiche les archives.
 * L’inverse : onglet archives vide → revenir aux actives.
 */
export function preferredPublicationArchiveTab(publications, requestedTab = 'active', { includePending = false } = {}) {
  const counts = publicationArchiveCounts(publications, { includePending, typeTab: 'all' })
  if (requestedTab === 'archived' && counts.archived === 0) return 'active'
  if (requestedTab !== 'archived' && counts.active === 0 && counts.archived > 0) return 'archived'
  return requestedTab === 'archived' ? 'archived' : 'active'
}

export function publicationTotalViews(publications) {
  const listingViews = (publications.listings || []).reduce((sum, item) => sum + (Number(item.views) || 0), 0)
  const videoViews = (publications.videos || []).reduce((sum, item) => sum + (Number(item.viewCount) || 0), 0)
  return listingViews + videoViews
}
