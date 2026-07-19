import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiEdit3,
  FiEye,
  FiFileText,
  FiHeadphones,
  FiPackage,
  FiRepeat,
  FiShoppingBag,
  FiStar,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { REVIEW_DISPUTE_STATUS } from '@moxt/shared/utils/reviewUtils.js'
import { adminDetailLink, normalizeAdminKind } from './adminLinkUtils'
import { formatDate, formatMoney } from '../transfers/transferUtils'
import { adminText } from './adminI18n'

export function buildQueues(state) {
  const accountDeletions = (state.account.deletionRequests || [])
    .filter((item) => item.status === 'requested')
    .map((item) => {
      const user = state.administration.users.find((entry) => entry.id === item.userId)
      const userName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        : item.userId
      return {
        ...item,
        userName,
        userEmail: user?.email || '',
      }
    })

  const verifications = state.account.verificationRequests
    .filter((i) => ['pending_review', 'pending'].includes(i.status))
    .map((item) => {
      const user = state.administration.users.find((entry) => entry.id === item.userId)
      const userName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        : item.userId
      return {
        ...item,
        userName,
        userEmail: user?.email || '',
      }
    })

  const businessDocuments = (state.businesses.documents || [])
    .filter((i) => ['pending_review', 'pending'].includes(i.status))
    .map((item) => {
      const business = state.businesses.items.find((entry) => entry.id === item.businessId)
      const owner = state.administration.users.find((entry) => entry.id === item.ownerId)
      const ownerName = owner
        ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email
        : item.ownerId
      return {
        ...item,
        businessName: business?.name || item.businessId,
        ownerName,
        ownerEmail: owner?.email || '',
        userName: business?.name || ownerName || item.name,
      }
    })

  const parcelProofs = state.parcels.items
    .filter((item) => {
      const proof = item.proofStatus || (item.travelProofUrl ? 'pending_review' : 'missing')
      return proof === 'pending_review' || (item.travelProofUrl && proof !== 'verified' && proof !== 'rejected')
    })
    .map((item) => ({
      ...item,
      userName: item.ownerName || `${item.origin} → ${item.destination}`,
      proofStatus: item.proofStatus || 'pending_review',
    }))

  return {
    accountDeletions,
    verifications,
    businessDocuments,
    parcelProofs,
    support: state.communications.support.filter((item) => item.status === 'waiting_agent'),
    disputes: state.disputes.items.filter((i) => ['new', 'open'].includes(i.status)),
    reviews: state.reviews.items.filter((i) => i.status === 'pending'),
    contestedReviews: state.reviews.items.filter(
      (i) => i.disputeStatus === REVIEW_DISPUTE_STATUS.PENDING,
    ),
    reports: [
      ...state.marketplace.reports.filter((i) => ['pending', 'new'].includes(i.status)).map((i) => ({ ...i, reportType: 'listing', relatedId: i.listingId })),
      ...state.jobs.reports.filter((i) => ['pending', 'new'].includes(i.status)).map((i) => ({ ...i, reportType: 'job', relatedId: i.jobId })),
      ...state.events.reports.filter((i) => ['pending', 'new'].includes(i.status)).map((i) => ({ ...i, reportType: 'event', relatedId: i.eventId })),
      ...(state.account.subscriberReports || [])
        .filter((i) => ['pending', 'new'].includes(i.status))
        .map((i) => ({
          ...i,
          reportType: 'subscriber',
          relatedId: i.subscriberId,
        })),
    ],
    get urgent() {
      return (
        this.accountDeletions.length +
        this.verifications.length +
        this.businessDocuments.length +
        this.parcelProofs.length +
        this.support.length +
        this.disputes.length +
        this.reports.length +
        this.contestedReviews.length
      )
    },
  }
}

export function buildAdminMetrics(state) {
  const transfers = state.transfers.items
  const businesses = state.businesses.items
  const listings = state.marketplace.items
  const jobs = state.jobs.items
  const events = state.events.items
  const parcels = state.parcels.items
  const posts = state.posts.items
  const reports =
    state.marketplace.reports.length +
    state.jobs.reports.length +
    state.events.reports.length +
    (state.account.subscriberReports || []).length
  const queues = buildQueues(state)

  return {
    transfers: {
      total: transfers.length,
      pending: transfers.filter((i) => !['completed', 'cancelled', 'expired'].includes(i.status)).length,
    },
    content: {
      total: businesses.length + listings.length + jobs.length + events.length + parcels.length + posts.length,
      pending:
        businesses.filter((i) => i.status === 'pending_review').length +
        listings.filter((i) => ['draft', 'pending_review'].includes(i.status)).length +
        jobs.filter((i) => ['draft', 'pending_review'].includes(i.status)).length +
        events.filter((i) => ['draft', 'pending_review'].includes(i.status)).length +
        parcels.filter((i) => ['draft', 'pending_review'].includes(i.status)).length +
        posts.filter((i) => i.status === 'pending_review').length +
        reports,
    },
    users: {
      total: state.administration.users.length,
      suspended: state.administration.users.filter((i) => i.status === 'suspended').length,
    },
    queues: {
      total:
        queues.accountDeletions.length +
        queues.verifications.length +
        queues.businessDocuments.length +
        queues.support.length +
        queues.disputes.length +
        queues.reviews.length +
        queues.reports.length,
      urgent: queues.urgent,
    },
    audit: { total: state.audit.items.length },
    posts: {
      total: posts.length,
      pending: posts.filter((i) => i.status === 'pending_review').length,
    },
  }
}

export function buildContentCollections(state) {
  const reports = [
    ...state.marketplace.reports.map((i) => ({ ...i, reportType: 'annonce', relatedId: i.listingId })),
    ...state.jobs.reports.map((i) => ({ ...i, reportType: 'emploi', relatedId: i.jobId })),
    ...state.events.reports.map((i) => ({ ...i, reportType: 'evenement', relatedId: i.eventId })),
    ...(state.account.subscriberReports || []).map((i) => ({
      ...i,
      reportType: 'abonne',
      relatedId: i.subscriberId,
    })),
  ]
  return {
    businesses: state.businesses.items,
    listings: state.marketplace.items,
    jobs: state.jobs.items,
    events: state.events.items,
    parcels: state.parcels.items,
    posts: state.posts.items,
    reports,
  }
}

export function badgeForView(view, metrics, queues) {
  if (view === 'transfers') return metrics.transfers.pending
  if (view === 'content') return metrics.content.pending
  if (view === 'publications') return metrics.posts.pending
  if (view === 'users') return metrics.users.suspended
  if (view === 'verifications') return queues.verifications.length
  if (view === 'documents') return queues.businessDocuments.length
  if (view === 'support') return queues.support.length
  if (view === 'queues') return queues.urgent
  return 0
}

export function detailLinkFor(kind, item) {
  return adminDetailLink(kind, item)
}

const DETAIL_ICONS = {
  transfer: FiRepeat,
  support: FiHeadphones,
  user: FiUsers,
  verification: FiUserCheck,
  businessDocument: FiFileText,
  dispute: FiAlertCircle,
  review: FiStar,
  report: FiAlertCircle,
  businesses: HiOutlineBuildingOffice2,
  listings: FiShoppingBag,
  jobs: FiTrendingUp,
  events: FiCalendar,
  parcels: FiPackage,
  posts: FiEdit3,
  audit: FiActivity,
}

export function detailIconFor(kind) {
  return DETAIL_ICONS[normalizeAdminKind(kind)] || FiEye
}

const DETAIL_KIND_KEYS = {
  transfer: 'admin.detail.kind.transfer',
  support: 'admin.detail.kind.support',
  user: 'admin.detail.kind.user',
  verification: 'admin.detail.kind.verification',
  businessDocument: 'admin.detail.kind.businessDocument',
  dispute: 'admin.detail.kind.dispute',
  review: 'admin.detail.kind.review',
  report: 'admin.detail.kind.report',
  businesses: 'admin.detail.kind.businesses',
  listings: 'admin.detail.kind.listings',
  jobs: 'admin.detail.kind.jobs',
  events: 'admin.detail.kind.events',
  parcels: 'admin.detail.kind.parcels',
  posts: 'admin.detail.kind.posts',
  audit: 'admin.detail.kind.audit',
}

export function detailLabelFor(kind, t) {
  const key = DETAIL_KIND_KEYS[normalizeAdminKind(kind)] || 'admin.detail.kind.default'
  return adminText(t, key)
}

export function detailDescriptionFor(kind, item, t) {
  switch (kind) {
    case 'transfer':
      return adminText(t, 'admin.detail.desc.transfer', {
        partner: item.exchanger?.name || adminText(t, 'admin.common.partnerFallback'),
        status: item.status,
      })
    case 'support':
      return adminText(t, 'admin.detail.desc.support', {
        name: item.userName,
        priority: item.priority,
        status: item.status,
      })
    case 'user':
      return adminText(t, 'admin.detail.desc.user', {
        email: item.email,
        role: item.role,
      })
    case 'verification':
      return adminText(t, 'admin.detail.desc.verification', {
        name: item.userName || item.userId,
        level: item.level,
        status: item.status,
      })
    case 'businessDocument':
      return adminText(t, 'admin.detail.desc.businessDocument', {
        business: item.businessName || item.businessId,
        status: item.status,
      })
    case 'businesses':
      return adminText(t, 'admin.detail.desc.businesses', {
        city: item.city,
        services: item.services?.join(', ') || adminText(t, 'admin.common.servicesFallback'),
      })
    case 'audit':
      return adminText(t, 'admin.detail.desc.audit', {
        role: item.actorRole || 'system',
        target: item.targetId || adminText(t, 'admin.audit.globalFallback'),
      })
    case 'posts':
      return item.message?.slice(0, 160) || item.id
    default:
      return item.description || item.reason || item.comment || item.action || item.id
  }
}

export function buildDetailFacts(kind, item, t) {
  const f = (key) => adminText(t, key)
  switch (normalizeAdminKind(kind)) {
    case 'transfer':
      return [
        [f('admin.facts.status'), item.status],
        [f('admin.facts.sent'), formatMoney(item.amountSent, item.currencyFrom)],
        [f('admin.facts.received'), formatMoney(item.amountReceived, item.currencyTo)],
        [f('admin.facts.partner'), item.exchanger?.name || '—'],
        [f('admin.facts.date'), formatDate(item.createdAt)],
      ]
    case 'support':
      return [
        [f('admin.facts.priority'), item.priority],
        [f('admin.facts.status'), item.status],
        [f('admin.facts.requester'), item.userName],
        [f('admin.facts.messages'), item.messages?.length || 0],
        [f('admin.facts.updatedAt'), formatDate(item.updatedAt || item.createdAt)],
      ]
    case 'user':
      return [
        [f('admin.facts.role'), item.role],
        [f('admin.facts.status'), item.status],
        [f('admin.facts.city'), item.city || '—'],
        [f('admin.facts.originCountry'), item.originCountry || '—'],
        [f('admin.facts.phone'), item.phone || '—'],
        [f('admin.facts.createdAt'), formatDate(item.createdAt)],
      ]
    case 'businesses':
      return [
        [f('admin.facts.status'), item.status],
        [f('admin.facts.city'), item.city],
        [f('admin.facts.phone'), item.phone],
        [f('admin.facts.services'), item.services?.join(', ') || '—'],
        [f('admin.facts.updatedAt'), formatDate(item.updatedAt || item.createdAt)],
      ]
    case 'listings':
      return [
        [f('admin.facts.price'), item.price ? formatMoney(item.price, item.currency) : '—'],
        [f('admin.facts.city'), item.city || '—'],
        [f('admin.facts.category'), item.category || '—'],
        [f('admin.facts.condition'), item.condition || '—'],
        [f('admin.facts.status'), item.status],
      ]
    case 'jobs':
      return [
        [f('admin.facts.salary'), item.salary || '—'],
        [f('admin.facts.location'), item.location || '—'],
        [f('admin.facts.sector'), item.sector || '—'],
        [f('admin.facts.contract'), item.contractType || '—'],
        [f('admin.facts.status'), item.status],
      ]
    case 'events':
      return [
        [f('admin.facts.date'), formatDate(item.startAt)],
        [f('admin.facts.location'), `${item.venue || ''} ${item.city || ''}`.trim()],
        [f('admin.facts.capacity'), item.capacity || '—'],
        [f('admin.facts.price'), item.price ? formatMoney(item.price, item.currency) : f('admin.facts.free')],
        [f('admin.facts.status'), item.status],
      ]
    case 'parcels':
      return [
        [f('admin.facts.route'), `${item.origin} -> ${item.destination}`],
        [f('admin.facts.departure'), item.departureDate || '—'],
        [f('admin.facts.capacity'), `${item.capacityKg || 0} kg`],
        [f('admin.facts.pricePerKg'), formatMoney(item.pricePerKg, item.currency)],
        [f('admin.facts.status'), item.effectiveStatus || item.status],
        [f('admin.facts.distribution'), item.distributionDate || '—'],
        [
          f('admin.facts.proofStatus'),
          item.proofStatus || (item.travelProofUrl ? 'pending_review' : f('admin.facts.proofMissing')),
        ],
        [
          f('admin.facts.proofFile'),
          item.travelProofName || (item.travelProofUrl ? f('admin.facts.yes') : f('admin.facts.no')),
        ],
      ]
    case 'verification':
      return [
        [f('admin.facts.level'), item.level],
        [f('admin.facts.status'), item.status],
        [f('admin.facts.user'), item.userName || item.userId],
        [f('admin.facts.email'), item.userEmail || '—'],
        [f('admin.facts.documents'), item.documentIds?.length || 0],
        [f('admin.facts.note'), item.note || '—'],
        [f('admin.facts.reviewReason'), item.reviewNote || '—'],
        [f('admin.facts.createdAt'), formatDate(item.createdAt)],
        [f('admin.facts.reviewedAt'), item.reviewedAt ? formatDate(item.reviewedAt) : '—'],
      ]
    case 'businessDocument':
      return [
        [f('admin.facts.status'), item.status],
        [f('admin.facts.category'), item.category || '—'],
        [f('admin.facts.business'), item.businessName || item.businessId || '—'],
        [f('admin.facts.user'), item.ownerName || item.ownerId || '—'],
        [f('admin.facts.email'), item.ownerEmail || '—'],
        [f('admin.facts.file'), item.name || '—'],
        [f('admin.facts.reviewReason'), item.reviewNote || '—'],
        [f('admin.facts.createdAt'), formatDate(item.createdAt)],
        [f('admin.facts.reviewedAt'), item.reviewedAt ? formatDate(item.reviewedAt) : '—'],
      ]
    case 'dispute':
      return [
        [f('admin.facts.status'), item.status],
        [f('admin.facts.type'), item.relatedType],
        [f('admin.facts.reference'), item.relatedId],
        [f('admin.facts.evidence'), item.evidence?.length || 0],
        [f('admin.facts.createdAt'), formatDate(item.createdAt)],
      ]
    case 'review':
      return [
        [f('admin.facts.note'), `${item.rating || '—'}/5`],
        [f('admin.facts.target'), `${item.targetType || '—'}`],
        [f('admin.facts.author'), item.authorName || item.authorId || '—'],
        [f('admin.facts.status'), item.status],
        [f('admin.facts.createdAt'), formatDate(item.createdAt)],
      ]
    case 'report':
      return [
        [f('admin.facts.type'), item.reportType],
        [f('admin.facts.reference'), item.relatedId],
        [f('admin.facts.status'), item.status],
        [f('admin.facts.note'), item.reason || '—'],
        [f('admin.facts.evidence'), item.evidenceUrl ? f('admin.facts.yes') : f('admin.facts.no')],
        [f('admin.facts.reporter'), item.reporterId || '—'],
        [f('admin.facts.createdAt'), formatDate(item.createdAt)],
      ]
    case 'audit':
      return [
        [f('admin.facts.action'), item.action || '—'],
        [f('admin.facts.role'), item.actorRole || '—'],
        [f('admin.facts.actor'), item.actorId || '—'],
        [f('admin.facts.reference'), item.targetId || f('admin.audit.globalFallback')],
        [f('admin.facts.createdAt'), formatDate(item.createdAt)],
      ]
    case 'posts':
      return [
        [f('admin.facts.author'), item.authorName || item.authorId || '—'],
        [f('admin.facts.type'), item.sourceType || 'free'],
        [f('admin.facts.status'), item.status || '—'],
        [f('admin.facts.messages'), item.comments?.length || 0],
        [f('admin.facts.date'), formatDate(item.createdAt)],
      ]
    default:
      return [
        [f('admin.facts.id'), item.id],
        [f('admin.facts.status'), item.status || '—'],
      ]
  }
}

export function contentSubtitle(contentView, item, t) {
  const russia = adminText(t, 'admin.common.russiaFallback')
  switch (contentView) {
    case 'businesses':
      return adminText(t, 'admin.contentSubtitle.businesses', {
        city: item.city || russia,
        status: item.status,
      })
    case 'listings':
      return adminText(t, 'admin.contentSubtitle.listings', {
        city: item.city || russia,
        price: item.price ? formatMoney(item.price, item.currency) : '—',
      })
    case 'jobs':
      return adminText(t, 'admin.contentSubtitle.jobs', {
        location: item.location || russia,
        salary: item.salary || '—',
      })
    case 'events':
      return adminText(t, 'admin.contentSubtitle.events', {
        city: item.city || russia,
        date: formatDate(item.startAt),
      })
    case 'parcels':
      return adminText(t, 'admin.contentSubtitle.parcels', {
        origin: item.origin,
        destination: item.destination,
        status: item.effectiveStatus || item.status || '—',
      })
    case 'reports':
      return adminText(t, 'admin.contentSubtitle.reports', {
        type: item.reportType,
        status: item.status,
      })
    case 'posts':
      return adminText(t, 'admin.contentSubtitle.posts', {
        author: item.authorName || item.authorId || '—',
        type: item.sourceType || 'free',
      })
    default:
      return adminText(t, 'admin.contentSubtitle.default', { status: item.status || '—' })
  }
}

export function exportSnapshot(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `moxt-admin-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
