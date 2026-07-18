import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  buildAdminMetrics,
  buildContentCollections,
  buildQueues,
} from '../adminData'
import { isActiveParcel, isArchivedParcel, isActivePost, isArchivedPost } from '../../publications/publicationCatalogUtils'
import { isActiveListing, isArchivedListing } from '../../marketplace/listingCatalogUtils'
import { isActiveEvent, isActiveJob, isArchivedEvent, isArchivedJob } from '../../publications/publicationCatalogUtils'

function effectiveContentStatus(section, item) {
  if (section === 'parcels') {
    if (isActiveParcel(item)) return 'active'
    if (item.status === 'archived' || isArchivedParcel(item)) return 'archived'
    return item.status || 'archived'
  }
  if (section === 'listings') {
    if (isActiveListing(item)) return 'active'
    if (isArchivedListing(item) || item.status === 'archived') return 'archived'
    return item.status || 'active'
  }
  if (section === 'jobs') {
    if (isActiveJob(item)) return 'active'
    if (isArchivedJob(item)) return 'archived'
    return item.status || 'active'
  }
  if (section === 'events') {
    if (isActiveEvent(item)) return 'published'
    if (isArchivedEvent(item)) return 'archived'
    return item.status || 'published'
  }
  if (section === 'posts') {
    if (isActivePost(item)) return 'published'
    if (isArchivedPost(item)) return 'archived'
    return item.status || 'published'
  }
  return item.status || 'active'
}

function matchesContentFilter(section, item, statusFilter) {
  if (!statusFilter || statusFilter === 'all') return true
  const effective = effectiveContentStatus(section, item)
  if (statusFilter === 'archived') {
    return effective === 'archived' || ['archived', 'rejected', 'expired', 'completed', 'suspended'].includes(item.status)
  }
  if (statusFilter === 'active') {
    return effective === 'active' || effective === 'published'
  }
  if (statusFilter === 'pending_review') {
    return ['pending_review', 'pending', 'draft', 'new'].includes(item.status || effective)
  }
  return effective === statusFilter || item.status === statusFilter
}

export function useAdminPageData(query, statusFilter, contentView) {
  const state = useSelector((v) => v)

  const metrics = useMemo(() => buildAdminMetrics(state), [state])
  const queues = useMemo(() => buildQueues(state), [state])
  const content = useMemo(() => buildContentCollections(state), [state])

  const supportTickets = useMemo(() => {
    let items = state.communications.support
    if (statusFilter !== 'all') {
      items = items.filter((ticket) => {
        if (statusFilter === 'open') return ticket.status === 'waiting_agent'
        if (statusFilter === 'pending') return ticket.status === 'waiting_user'
        if (statusFilter === 'resolved') return ['resolved', 'closed'].includes(ticket.status)
        return ticket.status === statusFilter
      })
    }
    if (query) {
      const q = query.toLowerCase()
      items = items.filter((i) => `${i.subject} ${i.userName} ${i.priority}`.toLowerCase().includes(q))
    }
    return items
  }, [query, statusFilter, state.communications.support])

  const users = useMemo(() => {
    let items = state.administration.users
    if (statusFilter !== 'all') items = items.filter((i) => i.role === statusFilter || i.status === statusFilter)
    if (query) {
      const q = query.toLowerCase()
      items = items.filter((i) => `${i.firstName} ${i.lastName} ${i.email} ${i.role}`.toLowerCase().includes(q))
    }
    return items
  }, [query, statusFilter, state.administration.users])

  const transfers = useMemo(() => {
    let items = state.transfers.items
    if (statusFilter !== 'all') items = items.filter((i) => i.status === statusFilter)
    if (query) {
      const q = query.toLowerCase()
      items = items.filter((i) =>
        `${i.id} ${i.exchanger?.name || ''} ${i.sender?.firstName || ''} ${i.recipient?.firstName || ''}`.toLowerCase().includes(q)
      )
    }
    return items
  }, [query, statusFilter, state.transfers.items])

  const auditItems = useMemo(() => {
    let items = state.audit.items
    if (query) {
      const q = query.toLowerCase()
      items = items.filter((i) => `${i.action} ${i.actorRole || ''} ${i.targetId || ''}`.toLowerCase().includes(q))
    }
    return items
  }, [query, state.audit.items])

  const activeContentItems = useMemo(() => {
    let items = content[contentView] || []
    items = items.filter((item) => matchesContentFilter(contentView, item, statusFilter))
    if (query) {
      const q = query.toLowerCase()
      items = items.filter((item) => {
        if (contentView === 'posts') {
          return `${item.id} ${item.authorName || ''} ${item.message || ''} ${item.title || ''} ${item.body || ''} ${item.sourceType || ''} ${item.status || ''}`
            .toLowerCase()
            .includes(q)
        }
        return `${item.id} ${item.name || ''} ${item.title || ''} ${item.origin || ''} ${item.destination || ''} ${item.reason || ''} ${item.status || ''}`
          .toLowerCase()
          .includes(q)
      })
    }
    return items.map((item) => ({
      ...item,
      effectiveStatus: effectiveContentStatus(contentView, item),
    }))
  }, [content, contentView, query, statusFilter])

  return {
    state,
    metrics,
    queues,
    content,
    supportTickets,
    users,
    transfers,
    auditItems,
    activeContentItems,
    allTransfers: state.transfers.items,
    allVerifications: state.account.verificationRequests.map((item) => {
      const user = state.administration.users.find((entry) => entry.id === item.userId)
      const userName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        : item.userId
      return {
        ...item,
        userName,
        userEmail: user?.email || '',
      }
    }),
  }
}
