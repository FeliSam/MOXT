import { createSelector } from '@reduxjs/toolkit'

export function belongsToBusiness(resource, business) {
  if (!resource || !business) return false
  return (
    resource.businessId === business.id ||
    (!resource.businessId && resource.ownerId === business.ownerId)
  )
}

export const selectBusinessById = (state, businessId) =>
  state.businesses.items.find((item) => item.id === businessId)

export const selectBusinessContent = createSelector(
  [
    (state) => state.marketplace.items,
    (state) => state.jobs.items,
    (state) => state.events.items,
    (state) => state.parcels.items,
    (state) => state.p2p.offers,
    (_, business) => business,
  ],
  (listings, jobs, events, parcels, offers, business) => ({
    listings: listings.filter((item) => belongsToBusiness(item, business)),
    jobs: jobs.filter((item) => belongsToBusiness(item, business)),
    events: events.filter((item) => belongsToBusiness(item, business)),
    parcels: parcels.filter((item) => belongsToBusiness(item, business)),
    offers: offers.filter((item) => belongsToBusiness(item, business)),
  }),
)

export function calculateBusinessCompletion(business, documents = []) {
  if (!business) return 0
  const checks = [
    business.name,
    business.sector,
    business.country,
    business.city,
    business.phone,
    business.description,
    business.averageDelay,
    business.services?.length,
    documents.length,
    business.status === 'verified',
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function calculateBusinessRating(reviews = []) {
  const published = reviews.filter((item) => item.status === 'published')
  if (!published.length) return { average: 0, count: 0 }
  return {
    average: Number(
      (published.reduce((total, review) => total + review.rating, 0) / published.length).toFixed(1),
    ),
    count: published.length,
  }
}
