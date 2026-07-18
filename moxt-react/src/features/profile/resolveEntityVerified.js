import { useSelector } from 'react-redux'
import { isBusinessPublishReady } from '../businesses/businessPublishUtils'
import { isProfileVerified } from './userProfileUtils'

function findBusiness(state, businessId) {
  if (!businessId) return null
  const id = String(businessId)
  return (state.businesses?.items || []).find((item) => String(item.id) === id) || null
}

function findProfile(state, userId) {
  if (!userId) return null
  const id = String(userId)
  const authUser = state.auth?.user
  if (authUser && String(authUser.id) === id) return authUser

  const directory = state.profileDirectory?.byId?.[id]
  if (directory) return directory

  return (state.administration?.users || []).find((item) => String(item.id) === id) || null
}

/**
 * Resolve whether a displayed entity name should show the MOXT verification icon.
 * Prefer businessId when the name is a business; otherwise userId for a person.
 */
export function resolveEntityVerified(state, { userId, businessId, verified } = {}) {
  if (typeof verified === 'boolean') return verified

  if (businessId) {
    const business = findBusiness(state, businessId)
    if (business) return isBusinessPublishReady(business)
  }

  if (userId) {
    return isProfileVerified(findProfile(state, userId))
  }

  return false
}

export function useEntityVerified({ userId, businessId, verified } = {}) {
  return useSelector((state) => resolveEntityVerified(state, { userId, businessId, verified }))
}
