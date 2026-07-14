import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiEye,
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

  return {
    accountDeletions,
    verifications,
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
      total: businesses.length + listings.length + jobs.length + events.length + parcels.length,
      pending:
        businesses.filter((i) => i.status === 'pending_review').length +
        listings.filter((i) => ['draft', 'pending_review'].includes(i.status)).length +
        jobs.filter((i) => ['draft', 'pending_review'].includes(i.status)).length +
        events.filter((i) => ['draft', 'pending_review'].includes(i.status)).length +
        parcels.filter((i) => ['draft', 'pending_review'].includes(i.status)).length +
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
        queues.disputes.length +
        queues.reviews.length +
        queues.reports.length,
      urgent: queues.urgent,
    },
    audit: { total: state.audit.items.length },
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
    reports,
  }
}

export function badgeForView(view, metrics, queues) {
  if (view === 'transfers') return metrics.transfers.pending
  if (view === 'content') return metrics.content.pending
  if (view === 'users') return metrics.users.suspended
  if (view === 'verifications') return queues.verifications.length
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
  dispute: FiAlertCircle,
  review: FiStar,
  report: FiAlertCircle,
  businesses: HiOutlineBuildingOffice2,
  listings: FiShoppingBag,
  jobs: FiTrendingUp,
  events: FiCalendar,
  parcels: FiPackage,
  audit: FiActivity,
}

export function detailIconFor(kind) {
  return DETAIL_ICONS[normalizeAdminKind(kind)] || FiEye
}

export function detailLabelFor(kind) {
  return {
    transfer: 'Transfert',
    support: 'Ticket support',
    user: 'Utilisateur',
    verification: 'Verification',
    dispute: 'Litige',
    review: 'Avis',
    report: 'Signalement',
    businesses: 'Entreprise',
    listings: 'Annonce',
    jobs: 'Job',
    events: 'Evenement',
    parcels: 'Colis',
    audit: 'Log audit',
  }[normalizeAdminKind(kind)] || 'Detail'
}

export function detailDescriptionFor(kind, item) {
  switch (kind) {
    case 'transfer':
      return `${item.exchanger?.name || 'Partenaire'} · ${item.status}`
    case 'support':
      return `${item.userName} · priorite ${item.priority} · ${item.status}`
    case 'user':
      return `${item.email} · ${item.role}`
    case 'verification':
      return `${item.userName || item.userId} · niveau ${item.level} · ${item.status}`
    case 'businesses':
      return `${item.city} · ${item.services?.join(', ') || 'Services a confirmer'}`
    default:
      return item.description || item.reason || item.comment || item.action || item.id
  }
}

export function buildDetailFacts(kind, item) {
  switch (normalizeAdminKind(kind)) {
    case 'transfer':
      return [['Statut', item.status], ['Envoye', formatMoney(item.amountSent, item.currencyFrom)], ['Recu', formatMoney(item.amountReceived, item.currencyTo)], ['Partenaire', item.exchanger?.name || '—'], ['Date', formatDate(item.createdAt)]]
    case 'support':
      return [['Priorite', item.priority], ['Statut', item.status], ['Demandeur', item.userName], ['Messages', item.messages?.length || 0], ['Mis a jour', formatDate(item.updatedAt || item.createdAt)]]
    case 'user':
      return [['Role', item.role], ['Statut', item.status], ['Ville', item.city || '—'], ['Tel', item.phone || '—'], ['Cree le', formatDate(item.createdAt)]]
    case 'businesses':
      return [['Statut', item.status], ['Ville', item.city], ['Tel', item.phone], ['Services', item.services?.join(', ') || '—'], ['Mis a jour', formatDate(item.updatedAt || item.createdAt)]]
    case 'listings':
      return [['Prix', item.price ? formatMoney(item.price, item.currency) : '—'], ['Ville', item.city || '—'], ['Categorie', item.category || '—'], ['Etat', item.condition || '—'], ['Statut', item.status]]
    case 'jobs':
      return [['Salaire', item.salary || '—'], ['Lieu', item.location || '—'], ['Secteur', item.sector || '—'], ['Contrat', item.contractType || '—'], ['Statut', item.status]]
    case 'events':
      return [['Date', formatDate(item.startAt)], ['Lieu', `${item.venue || ''} ${item.city || ''}`.trim()], ['Capacite', item.capacity || '—'], ['Prix', item.price ? formatMoney(item.price, item.currency) : 'Gratuit'], ['Statut', item.status]]
    case 'parcels':
      return [['Trajet', `${item.origin} -> ${item.destination}`], ['Depart', item.departureDate || '—'], ['Capacite', `${item.capacityKg || 0} kg`], ['Prix/kg', formatMoney(item.pricePerKg, item.currency)], ['Statut', item.effectiveStatus || item.status], ['Distribution', item.distributionDate || '—']]
    case 'verification':
      return [
        ['Niveau', item.level],
        ['Statut', item.status],
        ['Utilisateur', item.userName || item.userId],
        ['Email', item.userEmail || '—'],
        ['Documents', item.documentIds?.length || 0],
        ['Note', item.note || '—'],
        ['Motif review', item.reviewNote || '—'],
        ['Cree le', formatDate(item.createdAt)],
        ['Revu le', item.reviewedAt ? formatDate(item.reviewedAt) : '—'],
      ]
    case 'dispute':
      return [['Statut', item.status], ['Type', item.relatedType], ['Reference', item.relatedId], ['Preuves', item.evidence?.length || 0], ['Cree le', formatDate(item.createdAt)]]
    case 'review':
      return [['Note', `${item.rating || '—'}/5`], ['Cible', `${item.targetType || '—'}`], ['Auteur', item.authorName || item.authorId || '—'], ['Statut', item.status], ['Cree le', formatDate(item.createdAt)]]
    case 'report':
      return [['Type', item.reportType], ['Reference', item.relatedId], ['Statut', item.status], ['Raison', item.reason || '—'], ['Preuve', item.evidenceUrl ? 'Oui' : 'Non'], ['Reporter', item.reporterId || '—'], ['Cree le', formatDate(item.createdAt)]]
    default:
      return [['ID', item.id], ['Statut', item.status || '—']]
  }
}

export function contentSubtitle(contentView, item) {
  switch (contentView) {
    case 'businesses':
      return `${item.city || 'Russie'} · ${item.status}`
    case 'listings':
      return `${item.city || 'Russie'} · ${item.price ? formatMoney(item.price, item.currency) : '—'}`
    case 'jobs':
      return `${item.location || 'Russie'} · ${item.salary || '—'}`
    case 'events':
      return `${item.city || 'Russie'} · ${formatDate(item.startAt)}`
    case 'parcels':
      return `${item.origin} -> ${item.destination} · ${item.effectiveStatus || item.status || '—'}`
    case 'reports':
      return `${item.reportType} · ${item.status}`
    default:
      return item.status || '—'
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
