export { bottomNavigationPaths } from '../../config/primaryNavigation'

function filterGroupItems(group, role, excludePaths) {
  return group.children.filter(
    (item) =>
      (!item.roles || item.roles.includes(role)) &&
      (!excludePaths || !excludePaths.has(item.path)),
  )
}

export function filterNavigationGroups(groups, role, excludePaths, query, translateLabel) {
  const q = query.trim().toLowerCase()
  return groups
    .map((group) => ({
      ...group,
      children: filterGroupItems(group, role, excludePaths).filter(
        (item) => !q || translateLabel(item.label).toLowerCase().includes(q),
      ),
    }))
    .filter((group) => group.children.length > 0)
}

export function countNavigationBadge(state, userId, selector) {
  if (!userId) return 0
  if (selector === 'notifications') {
    return state.communications.notifications.filter(
      (n) => n.userId === userId && n.type !== 'message' && !n.archived && !n.read,
    ).length
  }
  if (selector === 'messages') {
    return state.communications.conversations
      .filter((c) => c.participantIds.includes(userId))
      .reduce((total, c) => total + (c.unreadBy?.[userId] || 0), 0)
  }
  return 0
}

export function useNavigationBadges(userId) {
  return function badgeFor(item, state) {
    if (!userId || !item.badgeSelector) return 0
    return countNavigationBadge(state, userId, item.badgeSelector)
  }
}

export function selectMoreMenuBadgeCount(state, userId) {
  if (!userId) return 0
  return (
    countNavigationBadge(state, userId, 'notifications') +
    countNavigationBadge(state, userId, 'messages')
  )
}
