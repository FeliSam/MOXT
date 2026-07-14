import { fromRow } from '../../services/remoteRowMapper'

function parseJson(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return fallback
}

export function p2pOrderFromRemoteRow(row) {
  if (!row) return null
  const base = fromRow(row)
  return {
    ...base,
    proofs: parseJson(row.proofs ?? base.proofs, []),
    ratings: parseJson(row.ratings ?? base.ratings, []),
    timeline: parseJson(row.timeline ?? base.timeline, []),
  }
}

export function p2pOrderToRemoteRow(order) {
  return {
    id: order.id,
    offer_id: order.offerId,
    buyer_id: order.buyerId,
    buyer_name: order.buyerName || '',
    seller_id: order.sellerId,
    seller_name: order.sellerName || '',
    amount: Number(order.amount) || 0,
    from_currency: order.fromCurrency || 'RUB',
    to_currency: order.toCurrency || 'XOF',
    rate: Number(order.rate) || 0,
    fee: Number(order.fee) || 0,
    status: order.status || 'created',
    proofs: order.proofs || [],
    ratings: order.ratings || [],
    timeline: order.timeline || [],
    created_at: order.createdAt || new Date().toISOString(),
  }
}

export function p2pOfferToRemoteRow(offer) {
  return {
    id: offer.id,
    owner_id: offer.ownerId,
    owner_name: offer.ownerName || '',
    amount: Number(offer.amount) || 0,
    from_currency: offer.fromCurrency || 'RUB',
    to_currency: offer.toCurrency || 'XOF',
    rate: Number(offer.rate) || 0,
    status: offer.status || 'active',
    payload: offer,
    created_at: offer.createdAt || new Date().toISOString(),
  }
}

export function reportToRemoteRow(report, foreignKey) {
  const row = {
    id: report.id,
    reporter_id: report.reporterId,
    reason: report.reason || '',
    status: report.status || 'new',
    evidence_url: report.evidenceUrl || null,
    created_at: report.createdAt || new Date().toISOString(),
  }
  if (foreignKey === 'listing_id') row.listing_id = report.listingId
  if (foreignKey === 'job_id') row.job_id = report.jobId
  if (foreignKey === 'event_id') row.event_id = report.eventId
  return row
}

export function subscriberBanToRemoteRow(ban) {
  return {
    id: ban.id,
    publisher_type: ban.publisherType,
    publisher_id: ban.publisherId,
    subscriber_id: ban.subscriberId,
    reason: ban.reason || '',
    banned_by: ban.bannedBy,
    created_at: ban.createdAt || new Date().toISOString(),
  }
}

export function subscriberReportToRemoteRow(report) {
  return {
    id: report.id,
    publisher_type: report.publisherType,
    publisher_id: report.publisherId,
    subscriber_id: report.subscriberId,
    reporter_id: report.reporterId,
    reason: report.reason || '',
    status: report.status || 'new',
    created_at: report.createdAt || new Date().toISOString(),
  }
}

export function reportFromRemoteRow(row, foreignKey, camelKey) {
  if (!row) return null
  const base = fromRow(row)
  return {
    ...base,
    [camelKey]: base[camelKey] || row[foreignKey],
  }
}
