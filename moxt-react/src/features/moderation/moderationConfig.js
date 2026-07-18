import { FiEdit3, FiInbox, FiLayers, FiShield } from 'react-icons/fi'

export const MODERATION_VIEWS = [
  { id: 'overview', label: 'Vue générale', labelKey: 'moderation.nav.overview', icon: FiShield },
  { id: 'content', label: 'Contenus', labelKey: 'moderation.nav.content', icon: FiLayers },
  {
    id: 'publications',
    label: 'Publications',
    labelKey: 'moderation.nav.publications',
    icon: FiEdit3,
  },
  { id: 'queues', label: "Files d'action", labelKey: 'moderation.nav.queues', icon: FiInbox },
]

export const MODERATION_VIEW_IDS = MODERATION_VIEWS.map((view) => view.id)

export const MODERATION_VIEW_FILTERS = {
  overview: [],
  content: ['all', 'active', 'pending_review', 'archived', 'published', 'rejected', 'new', 'resolved'],
  publications: ['all', 'active', 'pending_review', 'archived', 'published'],
  queues: [],
}

export function moderationQueuesUrgent(queues) {
  if (!queues) return 0
  return (
    (queues.disputes?.length || 0) +
    (queues.reports?.length || 0) +
    (queues.contestedReviews?.length || 0) +
    (queues.reviews?.length || 0)
  )
}

export function badgeForModerationView(view, metrics, queues) {
  if (view === 'content') return metrics.content.pending
  if (view === 'publications') return metrics.posts.pending
  if (view === 'queues') return moderationQueuesUrgent(queues)
  return 0
}
