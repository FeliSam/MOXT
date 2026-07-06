import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  buildAdminMetrics,
  buildContentCollections,
  buildQueues,
} from '../adminData'

export function useAdminPageData(query, statusFilter, contentView) {
  const state = useSelector((v) => v)

  const metrics = useMemo(() => buildAdminMetrics(state), [state])
  const queues = useMemo(() => buildQueues(state), [state])
  const content = useMemo(() => buildContentCollections(state), [state])

  const supportTickets = useMemo(() => {
    let items = state.communications.support
    if (statusFilter !== 'all') items = items.filter((i) => i.status === statusFilter)
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

  const activeContentItems = content[contentView] || []

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
  }
}
