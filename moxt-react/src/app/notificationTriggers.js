import { addNotification } from '../features/communications/communicationSlice'
import {
  getAdminUserIds,
  getNotificationPriority,
  P2P_STATUS_LABELS,
  resolveDisputePartyIds,
  resolvePublisherOwnerId,
  resolveReviewOwnerId,
  resolveReviewOwnerLink,
  shouldSendNotification,
} from '@moxt/shared/utils/notificationUtils.js'
import { filterPublisherSubscribers } from '@moxt/shared/utils/subscriptionUtils.js'
import { translate } from '../i18n/translate'
import { sharedText } from '../i18n/sharedI18n'

const P2P_STATUS_KEYS = {
  created: 'shared.notifications.p2p.status.created',
  waiting_payment: 'shared.notifications.p2p.status.waitingPayment',
  completed: 'shared.notifications.p2p.status.completed',
  cancelled: 'shared.notifications.p2p.status.cancelled',
}

function currentLanguage() {
  try {
    return (
      (typeof localStorage !== 'undefined' && localStorage.getItem('moxt-language')) || 'fr'
    )
  } catch {
    return 'fr'
  }
}

function notifyT(key, vars) {
  const language = currentLanguage()
  return sharedText((k, v) => translate(language, k, v), key, vars)
}

function p2pStatusLabel(status) {
  const key = P2P_STATUS_KEYS[status]
  if (key) return notifyT(key)
  return P2P_STATUS_LABELS[status] || status
}

function verificationStatusLabel(status) {
  const language = currentLanguage()
  if (status === 'verified') {
    const value = translate(language, 'verification.admin.statusVerified')
    return value !== 'verification.admin.statusVerified' ? value : 'vérifiée'
  }
  if (status === 'rejected') {
    const value = translate(language, 'verification.admin.statusRejected')
    return value !== 'verification.admin.statusRejected' ? value : 'refusée'
  }
  if (status === 'pending_review') {
    return notifyT('shared.notifications.verification.pendingReview')
  }
  return status
}

function uniqueIds(ids = []) {
  return [...new Set(ids.filter(Boolean))]
}

export function createNotificationDispatcher(store) {
  function notifyUser(userId, payload, preferenceKey = 'notifSysteme') {
    if (!userId) return
    const state = store.getState()
    const priority = getNotificationPriority(state, userId, preferenceKey)
    if (!priority) return
    const actorId = state.auth.user?.id
    if (actorId && userId === actorId && payload.type !== 'moderation') return
    store.dispatch(
      addNotification({
        ...payload,
        userId,
        priority: payload.priority || priority,
      }),
    )
  }

  function notifyUsers(userIds, payload, preferenceKey = 'notifSysteme') {
    for (const userId of uniqueIds(userIds)) {
      notifyUser(userId, payload, preferenceKey)
    }
  }

  function notifyAdmins(payload) {
    const state = store.getState()
    for (const adminId of getAdminUserIds(state)) {
      notifyUser(adminId, payload, 'notifSysteme')
    }
  }

  return {
    notifyUser,
    notifyUsers,
    notifyAdmins,
    handleReviewCreated(before, after, action) {
      const exists = before.reviews.items.some(
        (item) =>
          item.authorId === action.payload.authorId &&
          item.targetType === action.payload.targetType &&
          item.targetId === action.payload.targetId,
      )
      if (exists) return

      const ownerId = resolveReviewOwnerId(after, action.payload)
      const link = resolveReviewOwnerLink(action.payload)
      notifyUser(
        ownerId,
        {
          title: notifyT('shared.notifications.review.createdTitle'),
          message: notifyT('shared.notifications.review.createdBody', {
            name: action.payload.authorName || notifyT('shared.notifications.someone'),
            rating: action.payload.rating,
            comment: String(action.payload.comment).slice(0, 100),
          }),
          type: 'review',
          link,
          priority: 'high',
        },
        'notifSysteme',
      )
    },
    handleReviewReply(before, after, action) {
      const review = after.reviews.items.find((item) => item.id === action.payload.id)
      const previous = before.reviews.items.find((item) => item.id === action.payload.id)
      if (!review || previous?.replyText === review.replyText) return

      const link = resolveReviewOwnerLink(review)
      notifyUser(
        review.authorId,
        {
          title: notifyT('shared.notifications.review.replyTitle'),
          message: notifyT('shared.notifications.review.replyBody', {
            comment: String(review.replyText).slice(0, 100),
          }),
          type: 'review',
          link,
        },
        'notifSysteme',
      )
    },
    handleReviewContest(before, after, action) {
      const review = after.reviews.items.find((item) => item.id === action.payload.id)
      const previous = before.reviews.items.find((item) => item.id === action.payload.id)
      if (!review || previous?.disputeStatus === review.disputeStatus) return

      const ownerId = resolveReviewOwnerId(after, review)
      const link = resolveReviewOwnerLink(review)
      notifyUser(
        ownerId,
        {
          title: notifyT('shared.notifications.review.contestTitle'),
          message: notifyT('shared.notifications.review.contestBody'),
          type: 'review',
          link,
          priority: 'high',
        },
        'notifSysteme',
      )
      notifyAdmins({
        title: notifyT('shared.notifications.review.contestAdminTitle'),
        message: notifyT('shared.notifications.review.contestAdminBody', {
          name: review.authorName || notifyT('shared.notifications.someone'),
          type: review.targetType,
        }),
        type: 'moderation',
        link: '/admin?view=queues',
        priority: 'high',
      })
    },
    handleNewSubscriber(before, after, action) {
      const existed = (before.account.subscriptions || []).some(
        (item) =>
          item.userId === action.payload.userId &&
          item.publisherType === action.payload.publisherType &&
          item.publisherId === action.payload.publisherId,
      )
      if (existed) return

      const publisherOwnerId = resolvePublisherOwnerId(
        after,
        action.payload.publisherType,
        action.payload.publisherId,
      )
      if (!shouldSendNotification(after, publisherOwnerId, 'notifNewSubscribers')) return

      const subscriberName =
        after.auth.user?.id === action.payload.userId
          ? `${after.auth.user.firstName || ''} ${after.auth.user.lastName || ''}`.trim()
          : notifyT('shared.notifications.someone')

      notifyUser(
        publisherOwnerId,
        {
          title: notifyT('shared.notifications.subscription.newTitle'),
          message: notifyT('shared.notifications.subscription.newBody', {
            name: subscriberName || notifyT('shared.notifications.someone'),
          }),
          type: 'subscription',
          link: action.payload.publisherPath || '/subscriptions',
        },
        'notifNewSubscribers',
      )
    },
    handleSubscriberRemovedByPublisher(before, after, action) {
      const beforeCount = filterPublisherSubscribers(
        before.account.subscriptions,
        action.payload.publisherType,
        action.payload.publisherId,
      ).length
      const afterCount = filterPublisherSubscribers(
        after.account.subscriptions,
        action.payload.publisherType,
        action.payload.publisherId,
      ).length
      if (afterCount >= beforeCount) return

      notifyUser(
        action.payload.subscriberId,
        {
          title: notifyT('shared.notifications.subscription.removedTitle'),
          message: notifyT('shared.notifications.subscription.removedBody', {
            name: action.payload.publisherName || notifyT('shared.notifications.publisher'),
          }),
          type: 'subscription',
          link: '/subscriptions',
        },
        'notifSysteme',
      )
    },
    handleSubscriberBanned(before, after, action) {
      const existed = (before.account.subscriberBans || []).some(
        (item) =>
          item.publisherType === action.payload.publisherType &&
          item.publisherId === action.payload.publisherId &&
          item.subscriberId === action.payload.subscriberId,
      )
      if (existed) return

      notifyUser(
        action.payload.subscriberId,
        {
          title: notifyT('shared.notifications.subscription.bannedTitle'),
          message: notifyT('shared.notifications.subscription.bannedBody', {
            name: action.payload.publisherName || notifyT('shared.notifications.publisher'),
          }),
          type: 'subscription',
          link: '/subscriptions',
          priority: 'high',
        },
        'notifSysteme',
      )
    },
    handleSubscriberReported(before, after, action) {
      const beforeCount = (before.account.subscriberReports || []).length
      const afterCount = (after.account.subscriberReports || []).length
      if (afterCount <= beforeCount) return

      notifyAdmins({
        title: notifyT('shared.notifications.report.subscriberTitle'),
        message: notifyT('shared.notifications.report.subscriberBody', {
          name: action.payload.publisherName || notifyT('shared.notifications.publisher'),
          reason: String(action.payload.reason).slice(0, 120),
        }),
        type: 'moderation',
        link: '/admin?view=queues',
        priority: 'high',
      })
    },
    handleContentReported(label, reason, link) {
      notifyAdmins({
        title: notifyT('shared.notifications.report.contentTitle', { label }),
        message: String(reason || notifyT('shared.notifications.report.contentFallback')).slice(
          0,
          120,
        ),
        type: 'moderation',
        link: link || '/admin?view=queues',
        priority: 'high',
      })
    },
    handlePostLike(before, after, action) {
      const { postId, userId } = action.payload
      const previous = before.posts.items.find((item) => item.id === postId)
      const post = after.posts.items.find((item) => item.id === postId)
      if (!post?.authorId || !previous) return
      const likedBefore = previous.likes?.includes(userId)
      const likedAfter = post.likes?.includes(userId)
      if (likedBefore || !likedAfter) return

      const actor = after.auth.user
      const actorName = actor
        ? `${actor.firstName || ''} ${actor.lastName || ''}`.trim()
        : notifyT('shared.notifications.someoneAlt')
      notifyUser(
        post.authorId,
        {
          title: notifyT('shared.notifications.post.likeTitle'),
          message: notifyT('shared.notifications.post.likeBody', {
            name: actorName || notifyT('shared.notifications.someone'),
          }),
          type: 'post',
          link: '/news',
        },
        'notifActualites',
      )
    },
    handlePostComment(before, after, action) {
      const previous = before.posts.items.find((item) => item.id === action.payload.postId)
      const post = after.posts.items.find((item) => item.id === action.payload.postId)
      const comment = action.payload.comment
      if (!post?.authorId || !comment) return
      if ((previous?.comments?.length || 0) >= (post.comments?.length || 0)) return
      if (comment.authorId === post.authorId) return

      notifyUser(
        post.authorId,
        {
          title: notifyT('shared.notifications.post.commentTitle'),
          message: notifyT('shared.notifications.post.commentBody', {
            name: comment.authorName || notifyT('shared.notifications.someone'),
            text: String(comment.text).slice(0, 100),
          }),
          type: 'post',
          link: '/news',
        },
        'notifActualites',
      )
    },
    handleP2PAcceptOffer(after, action) {
      const order = after.p2p.orders.find((item) => item.id === action.payload.id)
      if (!order) return
      notifyUser(
        order.sellerId,
        {
          title: notifyT('shared.notifications.p2p.newOrderTitle'),
          message: notifyT('shared.notifications.p2p.newOrderBody', {
            name: order.buyerName,
            offerId: order.offerId,
          }),
          type: 'p2p',
          link: `/p2p/orders/${order.id}`,
          priority: 'high',
        },
        'notifTransfers',
      )
    },
    handleP2POrderStatus(before, after, action, actorId) {
      const previous = before.p2p.orders.find((item) => item.id === action.payload.id)
      const order = after.p2p.orders.find((item) => item.id === action.payload.id)
      if (!order || previous?.status === order.status) return

      const label = p2pStatusLabel(order.status)
      const recipients = [order.buyerId, order.sellerId].filter((id) => id && id !== actorId)
      notifyUsers(
        recipients,
        {
          title: notifyT('shared.notifications.p2p.statusTitle'),
          message: notifyT('shared.notifications.p2p.statusBody', {
            id: order.id,
            label,
          }),
          type: 'p2p',
          link: `/p2p/orders/${order.id}`,
        },
        'notifTransfers',
      )
    },
    handleP2POrderProof(after, action, actorId) {
      const order = after.p2p.orders.find((item) => item.id === action.payload.id)
      if (!order) return
      const recipient = order.buyerId === actorId ? order.sellerId : order.buyerId
      notifyUser(
        recipient,
        {
          title: notifyT('shared.notifications.p2p.proofTitle'),
          message: notifyT('shared.notifications.p2p.proofBody', { id: order.id }),
          type: 'p2p',
          link: `/p2p/orders/${order.id}`,
        },
        'notifTransfers',
      )
    },
    handleP2PRateOrder(after, action, actorId) {
      const order = after.p2p.orders.find((item) => item.id === action.payload.id)
      if (!order) return
      const recipient = order.buyerId === actorId ? order.sellerId : order.buyerId
      notifyUser(
        recipient,
        {
          title: notifyT('shared.notifications.p2p.ratingTitle'),
          message: notifyT('shared.notifications.p2p.ratingBody', {
            id: order.id,
            rating: action.payload.rating,
          }),
          type: 'p2p',
          link: `/p2p/orders/${order.id}`,
        },
        'notifTransfers',
      )
    },
    handleVerificationStatus(before, after, action) {
      const previous = before.account.verificationRequests.find(
        (item) => item.id === action.payload.id,
      )
      const request = after.account.verificationRequests.find(
        (item) => item.id === action.payload.id,
      )
      if (!request || previous?.status === request.status) return

      const statusText = verificationStatusLabel(request.status)
      const reason =
        request.status === 'rejected' && request.reviewNote
          ? notifyT('shared.notifications.verification.reasonPrefix', {
              note: String(request.reviewNote).slice(0, 120),
            })
          : ''
      notifyUser(
        request.userId,
        {
          title: notifyT('shared.notifications.verification.title'),
          message: notifyT('shared.notifications.verification.body', {
            status: statusText,
            reason,
          }),
          type: 'verification',
          link: '/verification',
          priority: 'high',
        },
        'notifSysteme',
      )
    },
    handleDisputeOpened(before, after, action, actorId) {
      if (after.disputes.items.length <= before.disputes.items.length) return
      const dispute =
        after.disputes.items.find((item) => item.id === action.payload.id) || action.payload
      const parties = resolveDisputePartyIds(after, dispute).filter((id) => id !== actorId)

      notifyUsers(
        parties,
        {
          title: notifyT('shared.notifications.dispute.openedTitle'),
          message: notifyT('shared.notifications.dispute.openedBody', {
            type: dispute.relatedType,
            id: dispute.relatedId,
          }),
          type: 'dispute',
          link: '/disputes',
          priority: 'high',
        },
        'notifSysteme',
      )
    },
    handleDisputeStatus(before, after, action, actorId) {
      const previous = before.disputes.items.find((item) => item.id === action.payload.id)
      const dispute = after.disputes.items.find((item) => item.id === action.payload.id)
      if (!dispute || previous?.status === dispute.status) return

      const parties = resolveDisputePartyIds(after, dispute).filter((id) => id !== actorId)
      notifyUsers(
        parties,
        {
          title: notifyT('shared.notifications.dispute.updatedTitle'),
          message: notifyT('shared.notifications.dispute.updatedBody', {
            id: dispute.id,
            status: dispute.status,
          }),
          type: 'dispute',
          link: '/disputes',
          priority: 'high',
        },
        'notifSysteme',
      )
    },
    handleSupportTicketCreated(before, after, action) {
      const created = after.communications.support.some((item) => item.id === action.payload.id)
      if (!created) return
      const existed = before.communications.support.some((item) => item.id === action.payload.id)
      if (existed) return

      const ticket = after.communications.support.find((item) => item.id === action.payload.id)
      if (!ticket) return

      notifyAdmins({
        title: notifyT('shared.notifications.support.newTitle'),
        message: notifyT('shared.notifications.support.newBody', {
          name: ticket.userName || notifyT('shared.notifications.someone'),
          subject: ticket.subject,
        }),
        type: 'support',
        link: '/admin?view=support',
        priority: 'high',
      })
    },
    handleSupportTicketReply(before, after, action) {
      if (action.payload.role !== 'agent') return
      const ticket = after.communications.support.find((item) => item.id === action.payload.ticketId)
      if (!ticket?.userId) return

      notifyUser(
        ticket.userId,
        {
          title: notifyT('shared.notifications.support.replyTitle'),
          message: notifyT('shared.notifications.support.replyBody', {
            text: String(action.payload.text || '').slice(0, 120),
          }),
          type: 'support',
          link: '/support',
          priority: 'high',
        },
        'notifSysteme',
      )
    },
  }
}
