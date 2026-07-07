import { formatMoney, formatDate } from '../transfers/transferUtils'
import { normalizeConversation } from './communicationSlice'

function baseSnapshot({ type, id, title, path, subtitle, imageUrl, badge, details = [] }) {
  if (!type || !id) return null
  return {
    type,
    id,
    title: title || 'Annonce',
    path: path || `/${type}/${id}`,
    subtitle: subtitle || null,
    imageUrl: imageUrl || null,
    badge: badge || null,
    details: details.filter(Boolean),
  }
}

export function buildListingSnapshot(listing, path) {
  if (!listing) return null
  return baseSnapshot({
    type: 'listing',
    id: listing.id,
    title: listing.title,
    path: path || `/marketplace/${listing.id}`,
    subtitle: listing.price != null ? formatMoney(listing.price, listing.currency) : null,
    imageUrl: listing.images?.[0] || null,
    badge: listing.status === 'active' ? 'Disponible' : listing.status,
    details: [listing.city, listing.category].filter(Boolean),
  })
}

export function buildJobSnapshot(job, path) {
  if (!job) return null
  return baseSnapshot({
    type: 'job',
    id: job.id,
    title: job.title,
    path: path || `/jobs/${job.id}`,
    subtitle: job.sector || job.contractType || null,
    badge: job.status === 'active' ? 'Recrutement' : job.status,
    details: [job.location || job.city, job.salary].filter(Boolean),
  })
}

export function buildParcelSnapshot(parcel, path) {
  if (!parcel) return null
  return baseSnapshot({
    type: 'parcel',
    id: parcel.id,
    title: `${parcel.origin} → ${parcel.destination}`,
    path: path || `/parcels/${parcel.id}`,
    subtitle:
      parcel.pricePerKg != null
        ? `${formatMoney(parcel.pricePerKg, parcel.currency || 'EUR')}/kg`
        : null,
    badge: parcel.remainingKg != null ? `${parcel.remainingKg} kg restants` : null,
    details: [parcel.departureDate, parcel.arrivalDate].filter(Boolean),
  })
}

export function buildEventSnapshot(event, path) {
  if (!event) return null
  return baseSnapshot({
    type: 'event',
    id: event.id,
    title: event.title,
    path: path || `/events/${event.id}`,
    subtitle: event.freeEntry
      ? 'Entrée gratuite'
      : event.price != null
        ? formatMoney(event.price, event.currency)
        : null,
    imageUrl: event.imageUrl || event.coverUrl || null,
    badge: event.startAt ? formatDate(event.startAt) : null,
    details: [event.location || event.city, event.organizerName].filter(Boolean),
  })
}

export function buildBusinessSnapshot(business, path) {
  if (!business) return null
  return baseSnapshot({
    type: 'business',
    id: business.id,
    title: business.name,
    path: path || `/businesses/${business.id}`,
    subtitle: business.category || business.activity || null,
    imageUrl: business.logoUrl || business.imageUrl || null,
    badge: 'Entreprise',
    details: [business.city, business.country].filter(Boolean),
  })
}

export function buildTransferSnapshot(transfer, path) {
  if (!transfer) return null
  return baseSnapshot({
    type: 'transfer',
    id: transfer.id,
    title: `Transfert ${transfer.id}`,
    path: path || `/transfers/${transfer.id}`,
    subtitle:
      transfer.amount != null
        ? formatMoney(transfer.amount, transfer.sender?.currency || 'XOF')
        : null,
    badge: transfer.status,
    details: [transfer.direction, transfer.recipient?.name].filter(Boolean),
  })
}

export function buildP2PSnapshot(offer, path) {
  if (!offer) return null
  return baseSnapshot({
    type: 'p2p',
    id: offer.id,
    title: `${offer.fromCurrency} → ${offer.toCurrency}`,
    path: path || `/p2p/${offer.id}`,
    subtitle: offer.rate ? `Taux ${offer.rate}` : null,
    badge: offer.status,
    details: [offer.amount ? `Montant ${offer.amount}` : null, offer.paymentMethod].filter(Boolean),
  })
}

export function buildRelatedSnapshot(relatedType, entity, fallbacks = {}) {
  const path = fallbacks.path
  const builders = {
    listing: () => buildListingSnapshot(entity, path),
    job: () => buildJobSnapshot(entity, path),
    parcel: () => buildParcelSnapshot(entity, path),
    event: () => buildEventSnapshot(entity, path),
    business: () => buildBusinessSnapshot(entity, path),
    transfer: () => buildTransferSnapshot(entity, path),
    p2p: () => buildP2PSnapshot(entity, path),
  }
  const built = builders[relatedType]?.()
  if (built) return built
  if (!fallbacks.id && !entity?.id) return null
  return baseSnapshot({
    type: relatedType || 'general',
    id: fallbacks.id || entity?.id,
    title: fallbacks.title || entity?.title || entity?.name || 'Annonce',
    path: path || fallbacks.path,
    subtitle: fallbacks.subtitle || null,
    imageUrl: fallbacks.imageUrl || null,
  })
}

export function resolveRelatedSnapshot(state, conversation) {
  const normalized = normalizeConversation(conversation)
  if (normalized.relatedSnapshot?.title) return normalized.relatedSnapshot

  const { relatedType, relatedId, relatedPath, title } = normalized
  if (!relatedType || !relatedId) return null

  const fallbacks = { id: relatedId, title, path: relatedPath }
  switch (relatedType) {
    case 'listing': {
      const item = state.marketplace?.items?.find((entry) => entry.id === relatedId)
      return buildListingSnapshot(item, relatedPath) || buildRelatedSnapshot(relatedType, item, fallbacks)
    }
    case 'job': {
      const item = state.jobs?.items?.find((entry) => entry.id === relatedId)
      return buildJobSnapshot(item, relatedPath) || buildRelatedSnapshot(relatedType, item, fallbacks)
    }
    case 'parcel': {
      const item = state.parcels?.items?.find((entry) => entry.id === relatedId)
      return buildParcelSnapshot(item, relatedPath) || buildRelatedSnapshot(relatedType, item, fallbacks)
    }
    case 'event': {
      const item = state.events?.items?.find((entry) => entry.id === relatedId)
      return buildEventSnapshot(item, relatedPath) || buildRelatedSnapshot(relatedType, item, fallbacks)
    }
    case 'business': {
      const item = state.businesses?.items?.find((entry) => entry.id === relatedId)
      return buildBusinessSnapshot(item, relatedPath) || buildRelatedSnapshot(relatedType, item, fallbacks)
    }
    case 'transfer': {
      const item = state.transfers?.items?.find((entry) => entry.id === relatedId)
      return buildTransferSnapshot(item, relatedPath) || buildRelatedSnapshot(relatedType, item, fallbacks)
    }
    case 'p2p': {
      const item = state.p2p?.offers?.find((entry) => entry.id === relatedId)
      return buildP2PSnapshot(item, relatedPath) || buildRelatedSnapshot(relatedType, item, fallbacks)
    }
    default:
      return buildRelatedSnapshot(relatedType, null, fallbacks)
  }
}
