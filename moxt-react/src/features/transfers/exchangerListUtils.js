import {
  inferTransferAccountSlot,
  receivingCountryForDirection,
} from './transferAccountUtils'

export function resolveUserTransferCountry(user, originCountry = 'BJ') {
  if (user?.country === 'RU') return 'RU'
  return user?.originCountry || user?.country || originCountry
}

export function resolveExchangerCountry(business, originCountry = 'BJ') {
  if (!business) return 'RU'

  const declared = String(business.country || '').trim().toUpperCase()
  if (declared && declared !== 'BJ_RU') return declared

  const accounts = (business.transferAccounts || []).filter((account) => account.active !== false)
  if (!accounts.length) return declared || 'RU'

  const slots = accounts.map(
    (account) => account.slot || inferTransferAccountSlot(account.country, originCountry),
  )
  const hasRu = slots.includes('ru')
  const hasOrigin = slots.includes('origin')

  if (hasRu && !hasOrigin) return 'RU'
  if (hasOrigin && !hasRu) {
    const originAccount = accounts.find(
      (account) =>
        (account.slot || inferTransferAccountSlot(account.country, originCountry)) === 'origin',
    )
    return originAccount?.country || originCountry
  }

  return declared || 'RU'
}

export function isApprovedTransferBusiness(business) {
  return (
    ['approved', 'active', 'verified'].includes(business?.status) &&
    business?.services?.includes('Transfert')
  )
}

export function exchangerSupportsDirection(business, direction, originCountry = 'BJ') {
  const paymentCountry = receivingCountryForDirection(direction, originCountry)
  if (resolveExchangerCountry(business, originCountry) !== paymentCountry) return false

  const accounts = (business.transferAccounts || []).filter((account) => account.active !== false)
  if (!accounts.length) return true

  return accounts.some((account) => {
    const slot = account.slot || inferTransferAccountSlot(account.country, originCountry)
    const accountCountry = account.country || (slot === 'ru' ? 'RU' : originCountry)
    return accountCountry === paymentCountry
  })
}

export function businessToExchangerOption(business, originCountry = 'BJ') {
  return {
    id: business.id,
    ownerId: business.ownerId,
    name: business.name,
    rating: Number(business.rating) || 0,
    feePercent: Number(business.feePercent || 0),
    averageDelay: business.averageDelay || 'À confirmer',
    methods: business.exchangeMethods || business.paymentMethods || [],
    logoUrl: business.logoUrl || '',
    city: business.city || '',
    country: resolveExchangerCountry(business, originCountry),
  }
}

export function listExchangersForTransfer({
  businesses = [],
  user,
  originCountry = 'BJ',
  direction,
  excludeOwnerId,
}) {
  const userCountry = resolveUserTransferCountry(user, originCountry)

  const approved = businesses
    .filter(isApprovedTransferBusiness)
    .filter((business) => !excludeOwnerId || String(business.ownerId) !== String(excludeOwnerId))
    .filter((business) => resolveExchangerCountry(business, originCountry) === userCountry)
    .filter((business) => !direction || exchangerSupportsDirection(business, direction, originCountry))
    .map((business) => businessToExchangerOption(business, originCountry))

  return approved.sort((left, right) => {
    const leftOwn = left.country === userCountry ? 0 : 1
    const rightOwn = right.country === userCountry ? 0 : 1
    if (leftOwn !== rightOwn) return leftOwn - rightOwn
    if (right.rating !== left.rating) return right.rating - left.rating
    return left.name.localeCompare(right.name, 'fr')
  })
}
