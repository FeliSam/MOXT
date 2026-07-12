import { createSelector } from '@reduxjs/toolkit'
import {
  calculateBusinessCompletion,
  getBusinessCompletionStatus,
} from './businessCompletion'

export { calculateBusinessCompletion, getBusinessCompletionStatus }

export function belongsToBusiness(resource, business) {
  if (!resource || !business) return false
  return resource.businessId === business.id
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
