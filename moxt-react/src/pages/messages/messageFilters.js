import { FiHeadphones, FiRepeat, FiStar } from 'react-icons/fi'

/** Shared filter chips for desktop toolbar + mobile filter menu. */
export const MESSAGE_FILTER_IDS = [
  { id: 'all', labelKey: 'messages.filterAll' },
  { id: 'unread', labelKey: 'messages.filterUnread' },
  { id: 'pinned', labelKey: 'messages.filterPinned', icon: FiStar },
  { id: 'transfer', labelKey: 'messages.filterTransfer', icon: FiRepeat },
  { id: 'p2p', labelKey: 'messages.filterP2p', icon: FiRepeat },
  { id: 'support', labelKey: 'messages.filterSupport', icon: FiHeadphones },
]

export function conversationMatchesFilter(item, filter, userId) {
  if (filter === 'unread' && !(item.unreadBy?.[userId] > 0)) return false
  if (filter === 'pinned' && !item.pinnedBy?.includes(userId)) return false
  if (filter === 'support' && item.relatedType !== 'support') return false
  if (filter === 'transfer' && item.relatedType !== 'transfer') return false
  if (filter === 'p2p' && item.relatedType !== 'p2p' && item.relatedType !== 'p2p_order') {
    return false
  }
  return true
}
