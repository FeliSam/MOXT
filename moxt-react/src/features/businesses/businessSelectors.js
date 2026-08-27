import { createSelector } from '@reduxjs/toolkit'
import { calculateAggregateRating } from '@moxt/shared/utils/reviewUtils.js'
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
  const { average, count } = calculateAggregateRating(reviews)
  return { average, count }
}
