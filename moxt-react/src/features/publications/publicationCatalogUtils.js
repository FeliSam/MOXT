import {
  FiBriefcase,
  FiCalendar,
  FiFileText,
  FiPackage,
  FiPlay,
  FiRepeat,
  FiShoppingBag,
} from 'react-icons/fi'
import {
  collectBusinessPublicationsFromCatalogs,
  collectUserPublicationsFromCatalogs,
  emptyPublications,
  publicationArchiveCounts,
  publicationTotalCount,
  publicationTotalViews,
} from '@moxt/shared/domain/publicationRules.js'

// Règles « Mes publications » : source unique partagée web + mobile.
export {
  filterPublicationsByScope,
  filterPublicationsByTabs,
  isActiveEvent,
  isActiveJob,
  isActiveP2POffer,
  isActiveParcel,
  isActivePost,
  isActiveVideo,
  isArchivedEvent,
  isArchivedJob,
  isArchivedP2POffer,
  isArchivedParcel,
  isArchivedPost,
  isArchivedVideo,
  preferredPublicationArchiveTab,
  publicationArchiveCounts,
  publicationTotalCount,
  publicationTotalViews,
  publicationTypeCounts,
  visiblePublicationCount,
} from '@moxt/shared/domain/publicationRules.js'

export const PUBLICATION_TYPE_TABS = [
  { id: 'listing', label: 'Annonces', icon: FiShoppingBag, color: 'from-cyan-500 to-blue-600' },
  { id: 'parcel', label: 'Colis', icon: FiPackage, color: 'from-sky-500 to-blue-600' },
  { id: 'job', label: 'Jobs', icon: FiBriefcase, color: 'from-violet-500 to-purple-600' },
  { id: 'event', label: 'Événements', icon: FiCalendar, color: 'from-amber-500 to-orange-600' },
  { id: 'video', label: 'Vidéos', icon: FiPlay, color: 'from-rose-500 to-red-600' },
  { id: 'post', label: 'Publication', icon: FiFileText, color: 'from-slate-500 to-slate-700' },
  { id: 'other', label: 'Autres', icon: FiRepeat, color: 'from-emerald-500 to-teal-600' },
]

/** Types visibles sur un profil entreprise (pas de posts personnels). */
export const BUSINESS_PUBLICATION_TYPE_TABS = PUBLICATION_TYPE_TABS.filter((tab) => tab.id !== 'post')

export function visiblePublicationTypeTabs(tabs, typeCounts) {
  return tabs.filter((tab) => (typeCounts[tab.id] ?? 0) > 0)
}

export const archivedPublicationCardClass =
  'bg-[var(--app-surface-muted)]/75 ring-1 ring-[var(--app-border)]/70'

function catalogsFromState(state) {
  return {
    listings: state.marketplace?.items || [],
    parcels: state.parcels?.items || [],
    jobs: state.jobs?.items || [],
    events: state.events?.items || [],
    videos: state.videos?.items || [],
    posts: state.posts?.items || [],
    others: state.p2p?.offers || [],
  }
}

export function collectBusinessPublications(state, businessId) {
  if (!businessId) return emptyPublications()
  return collectBusinessPublicationsFromCatalogs(catalogsFromState(state), businessId)
}

export function collectUserPublications(state, userId) {
  if (!userId) return emptyPublications()
  return collectUserPublicationsFromCatalogs(catalogsFromState(state), userId)
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
      sampleListing?.country ||
      publications.parcels[0]?.originCountry ||
      sampleEvent?.country ||
      'RU',
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
