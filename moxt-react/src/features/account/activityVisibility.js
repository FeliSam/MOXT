/**
 * Contrôle qui peut consulter l'activité / publications d'un membre ou d'une entreprise.
 * @param {'private'|'contacts'|'public'} visibility
 */
export function canViewActivity({
  viewerId,
  ownerId,
  visibility = 'private',
  conversations = [],
}) {
  if (!ownerId) return false
  if (!viewerId) {
    return visibility === 'public'
  }
  if (viewerId === ownerId) return true
  if (visibility === 'public') return true
  if (visibility === 'private') return false
  if (visibility === 'contacts') {
    return conversations.some(
      (conversation) =>
        conversation.participantIds?.includes(viewerId) &&
        conversation.participantIds?.includes(ownerId),
    )
  }
  return false
}

export function canViewUserActivity(params) {
  return canViewActivity(params)
}

export function canViewBusinessActivity({ viewerId, business, conversations = [] }) {
  if (!business) return false
  return canViewActivity({
    viewerId,
    ownerId: business.ownerId,
    visibility: business.activityVisibility || 'public',
    conversations,
  })
}

export function activityVisibilityLabel(visibility) {
  if (visibility === 'public') return 'Publique'
  if (visibility === 'contacts') return 'Mes contacts'
  return 'Privée'
}
