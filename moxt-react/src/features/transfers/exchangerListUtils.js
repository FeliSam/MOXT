import {
  inferTransferAccountSlot,
  normalizeTransferCountryCode,
  receivingCountryForDirection,
} from './transferAccountUtils'

/** Default FR delay label when unknown; UI should prefer i18n via exchangers.toConfirm. */
export const EXCHANGER_DELAY_TO_CONFIRM = 'À confirmer'

export function resolveUserTransferCountry(user, originCountry = 'BJ') {
  if (user?.country === 'RU') return 'RU'
  return normalizeTransferCountryCode(user?.originCountry || user?.country || originCountry, 'BJ')
}

/** Pays d'origine pour lister les partenaires (Bénin, Togo, Cameroun…), jamais la résidence en Russie. */
export function resolveUserPartnerCountry(user, originCountry = 'BJ') {
  if (user?.originCountry) return normalizeTransferCountryCode(user.originCountry, 'BJ')
  if (user?.country && user.country !== 'RU') {
    return normalizeTransferCountryCode(user.country, 'BJ')
  }
  return normalizeTransferCountryCode(originCountry, 'BJ')
}

/** Pays partenaire à filtrer — toujours le pays d'origine du membre, quel que soit le sens. */
export function resolvePartnerCountryForTransfer(user, originCountry = 'BJ') {
  return resolveUserPartnerCountry(user, originCountry)
}

function activeTransferAccounts(business) {
  return (business?.transferAccounts || []).filter((account) => account.active !== false)
}

export function resolveExchangerOriginCountry(business, fallbackOriginCountry = 'BJ') {
  if (!business) return normalizeTransferCountryCode(fallbackOriginCountry, 'BJ')
  const fallback = normalizeTransferCountryCode(
    business.ownerOriginCountry || business.originCountry || fallbackOriginCountry,
    'BJ',
  )

  const accounts = activeTransferAccounts(business)
  const originAccounts = accounts.filter(
    (account) =>
      (account.slot || inferTransferAccountSlot(account.country)) === 'origin',
  )

  if (originAccounts.length) {
    const explicit = originAccounts
      .map((account) => String(account.country ?? '').trim().toUpperCase())
      .find((code) => code !== 'RU' && /^[A-Z]{2}$/.test(code))
    if (explicit) return explicit
  }

  return fallback
}

/**
 * Pays « partenaire » affiché (drapeau) : Russie pour les opérateurs RU,
 * sinon pays d'origine de l'échangeur (Bénin, Togo, Ghana…).
 */
export function resolveExchangerCountry(business, userCountry, fallbackOriginCountry = 'BJ') {
  if (!business) return userCountry === 'RU' ? 'RU' : fallbackOriginCountry

  const accounts = activeTransferAccounts(business)
  const slots = accounts.map(
    (account) => account.slot || inferTransferAccountSlot(account.country),
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
  const targetOrigin = normalizeTransferCountryCode(userCountry, fallbackOriginCountry)

  if (targetOrigin === 'RU' || userCountry === 'RU') {
    if (!accounts.length) return false
    return accounts.some(
      (account) => (account.slot || inferTransferAccountSlot(account.country)) === 'ru',
    )
  }

  const businessOrigin = resolveExchangerOriginCountry(business, fallbackOriginCountry)
  if (!accounts.length) {
    const declared = normalizeTransferCountryCode(
      business.ownerOriginCountry || business.originCountry,
      businessOrigin,
    )
    return declared === targetOrigin
  }

  return accounts.some((account) => {
    const slot = account.slot || inferTransferAccountSlot(account.country)
    if (slot !== 'origin') return false
    const accountCountry = normalizeTransferCountryCode(
      account.country,
      businessOrigin,
    )
    return accountCountry === targetOrigin
  })
}

export function isApprovedTransferBusiness(business) {
  return (
    ['approved', 'active', 'verified'].includes(business?.status) &&
    business?.services?.includes('Transfert') &&
    !business?.deletedByUserAt &&
    (business?.activityVisibility || 'public') === 'public'
  )
}

export function exchangerSupportsDirection(business, direction, originCountry = 'BJ') {
  const paymentCountry = receivingCountryForDirection(direction, originCountry)
  const accounts = activeTransferAccounts(business)
  if (!accounts.length) return false

  const businessOrigin = resolveExchangerOriginCountry(business, originCountry)

  return accounts.some((account) => {
    const slot = account.slot || inferTransferAccountSlot(account.country)
    const accountCountry = normalizeTransferCountryCode(
      account.country,
      slot === 'ru' ? 'RU' : businessOrigin,
    )
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
    return normalizeTransferCountryCode(
      business.ownerOriginCountry || business.originCountry || fallbackOriginCountry,
      'BJ',
    )
  }

  const slots = accounts.map(
    (account) => account.slot || inferTransferAccountSlot(account.country),
  )

  if (slots.includes('origin')) {
    return resolveExchangerOriginCountry(business, fallbackOriginCountry)
  }

  if (slots.includes('ru')) {
    return 'RU'
  }

  return resolveExchangerOriginCountry(business, fallbackOriginCountry)
}

export function businessToExchangerOption(
  business,
  partnerCountry,
  fallbackOriginCountry = 'BJ',
  { toConfirmLabel = EXCHANGER_DELAY_TO_CONFIRM } = {},
) {
  return {
    id: business.id,
    ownerId: business.ownerId,
    name: business.name,
    rating: Number(business.rating) || 0,
    pinnedAt: business.pinnedAt || null,
    feePercent: Number(business.feePercent || 0),
    rateReductionToRu: Math.min(15, Math.max(0, Number(business.rateReductionToRu) || 0)),
    rateReductionFromRu: Math.min(15, Math.max(0, Number(business.rateReductionFromRu) || 0)),
    averageDelay: business.averageDelay || toConfirmLabel,
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
  toConfirmLabel = EXCHANGER_DELAY_TO_CONFIRM,
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
    .map((business) =>
      businessToExchangerOption(business, partnerCountry, originCountry, { toConfirmLabel }),
    )
    .sort((left, right) => {
      // Épinglés par un admin d'abord (le plus récemment épinglé en tête),
      // puis le classement naturel par note.
      const pinDelta = Number(Boolean(right.pinnedAt)) - Number(Boolean(left.pinnedAt))
      if (pinDelta !== 0) return pinDelta
      if (left.pinnedAt && right.pinnedAt) {
        return String(right.pinnedAt).localeCompare(String(left.pinnedAt))
      }
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
  toConfirmLabel = EXCHANGER_DELAY_TO_CONFIRM,
}) {
  const partnerCountry = resolveUserPartnerCountry(user, originCountry)
  const business = businesses.find(
    (item) =>
      item.id === exchangerId &&
      item.services?.includes('Transfert') &&
      !item.deletedByUserAt &&
      (item.activityVisibility || 'public') === 'public',
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
      exchanger: businessToExchangerOption(business, partnerCountry, originCountry, {
        toConfirmLabel,
      }),
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
