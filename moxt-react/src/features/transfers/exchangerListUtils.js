import {
  inferTransferAccountSlot,
  receivingCountryForDirection,
} from './transferAccountUtils'

export function resolveUserTransferCountry(user, originCountry = 'BJ') {
  if (user?.country === 'RU') return 'RU'
  return user?.originCountry || user?.country || originCountry
}

/** Pays d'origine pour lister les partenaires (Bénin, Togo, Ghana…), pas la résidence en Russie. */
export function resolveUserPartnerCountry(user, originCountry = 'BJ') {
  if (user?.originCountry) return user.originCountry
  if (user?.country === 'RU') return 'RU'
  return user?.country || originCountry
}

function activeTransferAccounts(business) {
  return (business?.transferAccounts || []).filter((account) => account.active !== false)
}

export function resolveExchangerOriginCountry(business, fallbackOriginCountry = 'BJ') {
  if (!business) return fallbackOriginCountry

  const accounts = activeTransferAccounts(business)
  const originAccounts = accounts.filter(
    (account) =>
      (account.slot || inferTransferAccountSlot(account.country, fallbackOriginCountry)) === 'origin',
  )

  if (originAccounts.length) {
    const explicit = originAccounts.map((account) => account.country).find(Boolean)
    if (explicit) return explicit
  }

  return business.ownerOriginCountry || business.originCountry || fallbackOriginCountry
}

/**
 * Pays « partenaire » affiché (drapeau) : Russie pour les opérateurs RU,
 * sinon pays d'origine de l'échangeur (Bénin, Togo, Ghana…).
 */
export function resolveExchangerCountry(business, userCountry, fallbackOriginCountry = 'BJ') {
  if (!business) return userCountry === 'RU' ? 'RU' : fallbackOriginCountry

  const accounts = activeTransferAccounts(business)
  const slots = accounts.map(
    (account) => account.slot || inferTransferAccountSlot(account.country, fallbackOriginCountry),
  )
  const hasRu = slots.includes('ru')
  const hasOrigin = slots.includes('origin')

  if (userCountry === 'RU' && hasRu) return 'RU'
  if (hasRu && !hasOrigin) return 'RU'

  return resolveExchangerOriginCountry(business, fallbackOriginCountry)
}

export function exchangerMatchesUserCountry(business, userCountry, fallbackOriginCountry = 'BJ') {
  if (!business) return false

  const accounts = activeTransferAccounts(business)

  if (userCountry === 'RU') {
    if (!accounts.length) return false
    return accounts.some(
      (account) =>
        (account.slot || inferTransferAccountSlot(account.country, fallbackOriginCountry)) === 'ru',
    )
  }

  const targetOrigin = userCountry
  if (!accounts.length) {
    const declared = business.ownerOriginCountry || business.originCountry
    return declared === targetOrigin
  }

  return accounts.some((account) => {
    const slot = account.slot || inferTransferAccountSlot(account.country, fallbackOriginCountry)
    if (slot !== 'origin') return false
    const accountCountry = account.country || fallbackOriginCountry
    return accountCountry === targetOrigin
  })
}

export function isApprovedTransferBusiness(business) {
  return (
    ['approved', 'active', 'verified'].includes(business?.status) &&
    business?.services?.includes('Transfert')
  )
}

export function exchangerSupportsDirection(business, direction, originCountry = 'BJ') {
  const paymentCountry = receivingCountryForDirection(direction, originCountry)
  const accounts = activeTransferAccounts(business)
  if (!accounts.length) return true

  return accounts.some((account) => {
    const slot = account.slot || inferTransferAccountSlot(account.country, originCountry)
    const accountCountry = account.country || (slot === 'ru' ? 'RU' : originCountry)
    return accountCountry === paymentCountry
  })
}

/**
 * Drapeau affiché sur les cartes partenaire : pays d'origine prioritaire
 * (Bénin, Togo, Ghana…) plutôt que la Russie quand les deux comptes existent.
 */
export function resolveExchangerDisplayCountry(business, fallbackOriginCountry = 'BJ') {
  const accounts = activeTransferAccounts(business)
  if (!accounts.length) {
    return business.ownerOriginCountry || business.originCountry || fallbackOriginCountry
  }

  const slots = accounts.map(
    (account) => account.slot || inferTransferAccountSlot(account.country, fallbackOriginCountry),
  )

  if (slots.includes('origin')) {
    return resolveExchangerOriginCountry(business, fallbackOriginCountry)
  }

  if (slots.includes('ru')) {
    return 'RU'
  }

  return resolveExchangerOriginCountry(business, fallbackOriginCountry)
}

export function businessToExchangerOption(business, partnerCountry, fallbackOriginCountry = 'BJ') {
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
    country: resolveExchangerDisplayCountry(business, fallbackOriginCountry),
    partnerCountry,
    status: business.status,
  }
}

export function listExchangersForTransfer({
  businesses = [],
  user,
  originCountry = 'BJ',
  direction,
  excludeOwnerId,
  includeAllCountries = false,
}) {
  const partnerCountry = resolveUserPartnerCountry(user, originCountry)

  return businesses
    .filter(isApprovedTransferBusiness)
    .filter((business) => !excludeOwnerId || String(business.ownerId) !== String(excludeOwnerId))
    .filter((business) => {
      if (direction) {
        return exchangerSupportsDirection(business, direction, originCountry)
      }
      if (includeAllCountries) return true
      return exchangerMatchesUserCountry(business, partnerCountry, originCountry)
    })
    .map((business) => businessToExchangerOption(business, partnerCountry, originCountry))
    .sort((left, right) => {
      if (right.rating !== left.rating) return right.rating - left.rating
      return left.name.localeCompare(right.name, 'fr')
    })
}
