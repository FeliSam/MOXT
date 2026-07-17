import { formatMoney, formatDate } from '../transfers/transferUtils'
import { normalizeConversation } from './communicationSlice'
import { messagesText } from './messagesI18n'

function baseSnapshot({ type, id, title, path, subtitle, imageUrl, badge, details = [] }, t) {
  if (!type || !id) return null
  return {
    type,
    id,
    title: title || messagesText(t, 'communications.snapshot.defaultTitle'),
    path: path || `/${type}/${id}`,
    subtitle: subtitle || null,
    imageUrl: imageUrl || null,
    badge: badge || null,
    details: details.filter(Boolean),
  }
}

export function buildListingSnapshot(listing, path, t) {
  if (!listing) return null
  return baseSnapshot(
    {
      type: 'listing',
      id: listing.id,
      title: listing.title,
      path: path || `/marketplace/${listing.id}`,
      subtitle: listing.price != null ? formatMoney(listing.price, listing.currency) : null,
      imageUrl: listing.images?.[0] || null,
      badge:
        listing.status === 'active'
          ? messagesText(t, 'communications.snapshot.available')
          : listing.status,
      details: [listing.city, listing.category].filter(Boolean),
    },
    t,
  )
}

export function buildJobSnapshot(job, path, t) {
  if (!job) return null
  return baseSnapshot(
    {
      type: 'job',
      id: job.id,
      title: job.title,
      path: path || `/jobs/${job.id}`,
      subtitle: job.sector || job.contractType || null,
      badge:
        job.status === 'active'
          ? messagesText(t, 'communications.snapshot.recruiting')
          : job.status,
      details: [job.location || job.city, job.salary].filter(Boolean),
    },
    t,
  )
}

export function buildParcelSnapshot(parcel, path, extras = {}) {
  if (!parcel) return null
  const reservedKg = extras.reservedKg != null ? Number(extras.reservedKg) : null
  const t = typeof extras.t === 'function' ? extras.t : null
  const text = (key, vars, fallback) => (t ? t(key, vars) : fallback)
  return baseSnapshot(
    {
      type: 'parcel',
      id: parcel.id,
      title: `${parcel.origin} → ${parcel.destination}`,
      path: path || `/parcels/${parcel.id}`,
      subtitle:
        reservedKg != null
          ? text('parcels.snapshot.reservedKg', { kg: reservedKg }, `${reservedKg} kg réservés`)
          : parcel.pricePerKg != null
            ? `${formatMoney(parcel.pricePerKg, parcel.currency || 'EUR')}/kg`
            : null,
      badge:
        reservedKg != null
          ? text('parcels.snapshot.reservationAccepted', null, 'Réservation acceptée')
          : parcel.remainingKg != null
            ? text(
                'parcels.snapshot.remainingKg',
                { kg: parcel.remainingKg },
                `${parcel.remainingKg} kg restants`,
              )
            : null,
      details: [
        reservedKg != null
          ? text(
              'parcels.snapshot.reservedWeight',
              { kg: reservedKg },
              `Poids réservé : ${reservedKg} kg`,
            )
          : null,
        parcel.departureDate
          ? text(
              'parcels.snapshot.departure',
              { date: parcel.departureDate },
              `Départ ${parcel.departureDate}`,
            )
          : null,
        parcel.arrivalDate,
        extras.requesterName
          ? text(
              'parcels.snapshot.client',
              { name: extras.requesterName },
              `Client : ${extras.requesterName}`,
            )
          : null,
      ].filter(Boolean),
    },
    t,
  )
}

export function buildEventSnapshot(event, path, t) {
  if (!event) return null
  return baseSnapshot(
    {
      type: 'event',
      id: event.id,
      title: event.title,
      path: path || `/events/${event.id}`,
      subtitle: event.freeEntry
        ? messagesText(t, 'communications.snapshot.freeEntry')
        : event.price != null
          ? formatMoney(event.price, event.currency)
          : null,
      imageUrl: event.imageUrl || event.coverUrl || null,
      badge: event.startAt ? formatDate(event.startAt) : null,
      details: [event.location || event.city, event.organizerName].filter(Boolean),
    },
    t,
  )
}

export function buildBusinessSnapshot(business, path, t) {
  if (!business) return null
  return baseSnapshot(
    {
      type: 'business',
      id: business.id,
      title: business.name,
      path: path || `/businesses/${business.id}`,
      subtitle: business.category || business.activity || null,
      imageUrl: business.logoUrl || business.imageUrl || null,
      badge: messagesText(t, 'communications.snapshot.business'),
      details: [business.city, business.country].filter(Boolean),
    },
    t,
  )
}

export function buildTransferSnapshot(transfer, path, t) {
  if (!transfer) return null
  return baseSnapshot(
    {
      type: 'transfer',
      id: transfer.id,
      title: messagesText(t, 'communications.snapshot.transferTitle', { id: transfer.id }),
      path: path || `/transfers/${transfer.id}`,
      subtitle:
        transfer.amount != null
          ? formatMoney(transfer.amount, transfer.sender?.currency || 'XOF')
          : null,
      badge: transfer.status,
      details: [transfer.direction, transfer.recipient?.name].filter(Boolean),
    },
    t,
  )
}

export function buildP2PSnapshot(offer, path, t) {
  if (!offer) return null
  return baseSnapshot(
    {
      type: 'p2p',
      id: offer.id,
      title: `${offer.fromCurrency} → ${offer.toCurrency}`,
      path: path || `/p2p/${offer.id}`,
      subtitle: offer.rate
        ? messagesText(t, 'communications.snapshot.rate', { rate: offer.rate })
        : null,
      badge: offer.status,
      details: [
        offer.amount
          ? messagesText(t, 'communications.snapshot.amount', { amount: offer.amount })
          : null,
        offer.paymentMethod,
      ].filter(Boolean),
    },
    t,
  )
}

export function buildRelatedSnapshot(relatedType, entity, fallbacks = {}) {
  const path = fallbacks.path
  const t = typeof fallbacks.t === 'function' ? fallbacks.t : null
  const parcelExtras = {
    reservedKg: fallbacks.reservedKg,
    requesterName: fallbacks.requesterName,
    t,
  }
  const builders = {
    listing: () => buildListingSnapshot(entity, path, t),
    job: () => buildJobSnapshot(entity, path, t),
    parcel: () => buildParcelSnapshot(entity, path, parcelExtras),
    event: () => buildEventSnapshot(entity, path, t),
    business: () => buildBusinessSnapshot(entity, path, t),
    transfer: () => buildTransferSnapshot(entity, path, t),
    p2p: () => buildP2PSnapshot(entity, path, t),
  }
  const built = builders[relatedType]?.()
  if (built) return built
  if (!fallbacks.id && !entity?.id) return null
  return baseSnapshot(
    {
      type: relatedType || 'general',
      id: fallbacks.id || entity?.id,
      title:
        fallbacks.title ||
        entity?.title ||
        entity?.name ||
        messagesText(t, 'communications.snapshot.defaultTitle'),
      path: path || fallbacks.path,
      subtitle: fallbacks.subtitle || null,
      imageUrl: fallbacks.imageUrl || null,
    },
    t,
  )
}

export function resolveRelatedSnapshot(state, conversation, t) {
  const normalized = normalizeConversation(conversation)
  if (normalized.relatedSnapshot?.title) return normalized.relatedSnapshot

  const { relatedType, relatedId, relatedPath, title } = normalized
  if (!relatedType || !relatedId) return null

  const fallbacks = { id: relatedId, title, path: relatedPath, t }
  switch (relatedType) {
    case 'listing': {
      const item = state.marketplace?.items?.find((entry) => entry.id === relatedId)
      return (
        buildListingSnapshot(item, relatedPath, t) ||
        buildRelatedSnapshot(relatedType, item, fallbacks)
      )
    }
    case 'job': {
      const item = state.jobs?.items?.find((entry) => entry.id === relatedId)
      return buildJobSnapshot(item, relatedPath, t) || buildRelatedSnapshot(relatedType, item, fallbacks)
    }
    case 'parcel': {
      const item = state.parcels?.items?.find((entry) => entry.id === relatedId)
      return (
        buildParcelSnapshot(item, relatedPath, { t }) ||
        buildRelatedSnapshot(relatedType, item, fallbacks)
      )
    }
    case 'event': {
      const item = state.events?.items?.find((entry) => entry.id === relatedId)
      return (
        buildEventSnapshot(item, relatedPath, t) || buildRelatedSnapshot(relatedType, item, fallbacks)
      )
    }
    case 'business': {
      const item = state.businesses?.items?.find((entry) => entry.id === relatedId)
      return (
        buildBusinessSnapshot(item, relatedPath, t) ||
        buildRelatedSnapshot(relatedType, item, fallbacks)
      )
    }
    case 'transfer': {
      const item = state.transfers?.items?.find((entry) => entry.id === relatedId)
      return (
        buildTransferSnapshot(item, relatedPath, t) ||
        buildRelatedSnapshot(relatedType, item, fallbacks)
      )
    }
    case 'p2p': {
      const item = state.p2p?.offers?.find((entry) => entry.id === relatedId)
      return buildP2PSnapshot(item, relatedPath, t) || buildRelatedSnapshot(relatedType, item, fallbacks)
    }
    default:
      return buildRelatedSnapshot(relatedType, null, fallbacks)
  }
}
