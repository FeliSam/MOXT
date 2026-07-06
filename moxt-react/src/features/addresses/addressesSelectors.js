import { createSelector } from '@reduxjs/toolkit'

export const selectRecipientAddressesByUser = createSelector(
  [(state) => state.recipientAddresses?.items ?? [], (_state, userId) => userId],
  (items, userId) => {
    if (!userId) return []
    return items.filter((item) => item.userId === userId)
  },
)

export const selectIdentityProfilesByUser = createSelector(
  [(state) => state.identity?.profiles ?? [], (_state, userId) => userId],
  (profiles, userId) => {
    if (!userId) return []
    return profiles.filter((profile) => profile.userId === userId)
  },
)
