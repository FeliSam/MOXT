import {
  inferTransferAccountSlot,
  receivingCountryForDirection,
} from './transferAccountUtils'
import { DIRECTIONS } from './transferConfig'

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

/**
 * Pays partenaire à filtrer selon le sens du transfert.
 * Afrique → Russie : échangeurs du pays d'origine du membre (CM, BJ, TG…).
 * Russie → Afrique : échangeurs avec compte Russie.
 */
export function resolvePartnerCountryForTransfer(user, originCountry = 'BJ', direction) {
  if (direction === DIRECTIONS.RU_TO_BJ) return 'RU'
  return resolveUserPartnerCountry(user, originCountry)
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
  const businessOrigin = resolveExchangerOriginCountry(business, fallbackOriginCountry)
  if (!accounts.length) {
    const declared = business.ownerOriginCountry || business.originCountry
    return declared === targetOrigin
  }

  return accounts.some((account) => {
    const slot = account.slot || inferTransferAccountSlot(account.country, fallbackOriginCountry)
    if (slot !== 'origin') return false
    const accountCountry = account.country || businessOrigin
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
  if (!accounts.length) return false

  const businessOrigin = resolveExchangerOriginCountry(business, originCountry)

  return accounts.some((account) => {
    const slot = account.slot || inferTransferAccountSlot(account.country, originCountry)
    const accountCountry =
      account.country || (slot === 'ru' ? 'RU' : businessOrigin)
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
  const partnerCountry = resolvePartnerCountryForTransfer(user, originCountry, direction)

  return businesses
    .filter(isApprovedTransferBusiness)
    .filter((business) => !excludeOwnerId || String(business.ownerId) !== String(excludeOwnerId))
    .filter((business) => {
      const matchesCountry =
        includeAllCountries ||
        exchangerMatchesUserCountry(business, partnerCountry, originCountry)
      if (!matchesCountry) return false
      if (direction) {
        return exchangerSupportsDirection(business, direction, originCountry)
      }
      return true
    })
    .map((business) => businessToExchangerOption(business, partnerCountry, originCountry))
    .sort((left, right) => {
      if (right.rating !== left.rating) return right.rating - left.rating
      return left.name.localeCompare(right.name, 'fr')
    })
}

/**
 * Résout un échangeur pour la fiche détail.
 * Quand allowAllCountries est vrai (liste « Tous les échangeurs »), on n'applique pas le filtre pays.
 */
export function resolveExchangerForDetail({
  businesses = [],
  exchangerId,
  user,
  originCountry = 'BJ',
  allowAllCountries = false,
  fallbackExchangers = [],
}) {
  const partnerCountry = resolveUserPartnerCountry(user, originCountry)
  const business = businesses.find(
    (item) => item.id === exchangerId && item.services?.includes('Transfert'),
  )

  if (business && isApprovedTransferBusiness(business)) {
    if (
      !allowAllCountries &&
      !exchangerMatchesUserCountry(business, partnerCountry, originCountry)
    ) {
      return null
    }
    return {
      business,
      exchanger: businessToExchangerOption(business, partnerCountry, originCountry),
    }
  }

  const fallback = fallbackExchangers.find((item) => item.id === exchangerId) || null
  if (!fallback) return null
  if (
    !allowAllCountries &&
    partnerCountry !== 'RU' &&
    fallback.country &&
    fallback.country !== partnerCountry
  ) {
    return null
  }

  return { business: null, exchanger: fallback }
}
