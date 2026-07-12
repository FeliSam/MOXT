import { createSelector } from '@reduxjs/toolkit'
import { selectActiveBusinessForOwner } from './businesses/businessVisibility'
import { normalizeConversation } from './communications/communicationSlice'

export const selectCurrentUser = (state) => state.auth.user
export const selectBusinesses = (state) => state.businesses.items

export const selectOwnBusiness = createSelector(
  [selectBusinesses, selectCurrentUser],
  (businesses, user) => selectActiveBusinessForOwner(businesses, user?.id),
)

export const selectVisibleNotifications = createSelector(
  [(state) => state.communications.notifications, selectCurrentUser],
  (notifications, user) =>
    notifications.filter(
      (item) => item.userId === user?.id && item.type !== 'message' && !item.archived,
    ),
)

export const selectUnreadNotificationCount = createSelector(
  [selectVisibleNotifications],
  (notifications) => notifications.filter((item) => !item.read).length,
)

export const selectUserConversations = createSelector(
  [(state) => state.communications.conversations, selectCurrentUser],
  (conversations, user) =>
    conversations
      .filter((item) => normalizeConversation(item).participantIds.includes(user?.id))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
)

export const selectUnreadMessageCount = createSelector(
  [selectUserConversations, selectCurrentUser],
  (conversations, user) =>
    conversations.reduce((total, item) => total + (item.unreadBy?.[user?.id] || 0), 0),
)
