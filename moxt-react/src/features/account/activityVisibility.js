/**
 * Contrôle qui peut consulter l'activité / publications d'un membre.
 * @param {'private'|'contacts'|'public'} visibility
 */
export function canViewUserActivity({
  viewerId,
  ownerId,
  visibility = 'private',
  conversations = [],
}) {
  if (!ownerId) return false
  if (!viewerId || viewerId === ownerId) return true
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

export function activityVisibilityLabel(visibility) {
  if (visibility === 'public') return 'Publique'
  if (visibility === 'contacts') return 'Mes contacts'
  return 'Privée'
}
