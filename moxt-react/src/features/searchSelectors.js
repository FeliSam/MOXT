import { createSelector } from '@reduxjs/toolkit'
import { searchablePages } from '../config/searchablePages'
import { sharedText } from '../i18n/sharedI18n'
import {
  buildSubscriptionNetworkProfiles,
  filterSubscriptionNetworkProfiles,
  subscriptionProfilesToSearchResults,
} from './search/subscriptionProfileSearch'

function resolvePageTitle(page) {
  return page.titleKey ? sharedText(null, page.titleKey) : page.title
}

function resolvePageSubtitle(page) {
  return page.subtitleKey ? sharedText(null, page.subtitleKey) : page.subtitle
}

export const selectSearchIndex = createSelector(
  [
    (state) => state.businesses.items,
    (state) => state.marketplace.items,
    (state) => state.jobs.items,
    (state) => state.events.items,
    (state) => state.parcels.items,
    (state) => state.auth.user?.role,
  ],
  (businesses, listings, jobs, events, parcels, role) => [
    ...businesses
      .filter((item) => ['verified', 'active'].includes(item.status))
      .map((item) => ({
        id: item.id,
        type: 'business',
        typeLabel: 'Entreprise',
        title: item.name,
        subtitle: `${item.sector} · ${item.city}`,
        path: `/businesses/${item.id}`,
        publicPath: `/discover?type=business&q=${encodeURIComponent(item.name)}`,
      })),
    ...listings
      .filter((item) => ['active', 'published'].includes(item.status))
      .map((item) => ({
        id: item.id,
        type: 'listing',
        typeLabel: 'Marketplace',
        title: item.title,
        subtitle: `${item.city || 'MOXT'} · ${item.price || 0} ${item.currency || ''}`,
        path: `/marketplace/${item.id}`,
        publicPath: `/discover?type=listing&q=${encodeURIComponent(item.title)}`,
      })),
    ...jobs
      .filter((item) => ['active', 'published'].includes(item.status))
      .map((item) => ({
        id: item.id,
        type: 'job',
        typeLabel: 'Job',
        title: item.title,
        subtitle: item.location || item.publisherName,
        path: `/jobs/${item.id}`,
        publicPath: `/discover?type=job&q=${encodeURIComponent(item.title)}`,
      })),
    ...events
      .filter((item) => ['active', 'published'].includes(item.status))
      .map((item) => ({
        id: item.id,
        type: 'event',
        typeLabel: 'Événement',
        title: item.title,
        subtitle: `${item.city || ''} · ${item.venue || ''}`,
        path: `/events/${item.id}`,
        publicPath: `/discover?type=event&q=${encodeURIComponent(item.title)}`,
      })),
    ...parcels
      .filter((item) => item.status === 'active')
      .map((item) => ({
        id: item.id,
        type: 'parcel',
        typeLabel: 'Colis',
        title: `${item.origin} vers ${item.destination}`,
        subtitle: `${item.remainingKg} kg disponibles`,
        path: `/parcels/${item.id}`,
        publicPath: `/discover?type=parcel&q=${encodeURIComponent(item.origin)}`,
      })),
    ...searchablePages
      .filter((page) => !page.roles || page.roles.includes(role))
      .map((page) => ({
        id: page.id,
        type: 'page',
        typeLabel: sharedText(null, 'shared.page'),
        title: resolvePageTitle(page),
        subtitle: resolvePageSubtitle(page),
        path: page.path,
        publicPath: page.path,
        keywords: page.keywords,
      })),
  ],
)

export const selectSubscriptionNetworkProfiles = createSelector(
  [(state) => state, (state) => state.auth.user?.id],
  (state, userId) => buildSubscriptionNetworkProfiles(state, userId),
)

export function filterSearchIndex(index, query, type = 'all') {
  const normalized = query.trim().toLocaleLowerCase('fr')
  return index.filter((item) => {
    const matchesType = type === 'all' || item.type === type
    const matchesQuery =
      !normalized ||
      `${item.title} ${item.subtitle} ${item.typeLabel} ${item.keywords || ''}`
        .toLocaleLowerCase('fr')
        .includes(normalized)
    return matchesType && matchesQuery
  })
}

export function searchGlobalResults(contentIndex, networkProfiles, query) {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const content = filterSearchIndex(contentIndex, trimmed)
  const profileResults =
    trimmed.length >= 3
      ? subscriptionProfilesToSearchResults(
          filterSubscriptionNetworkProfiles(networkProfiles, trimmed),
        )
      : []

  return [...profileResults, ...content].slice(0, 10)
}
