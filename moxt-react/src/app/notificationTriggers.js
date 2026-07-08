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
          title: 'Nouvel avis reçu',
          message: `${action.payload.authorName || 'Un membre'} a laissé ${action.payload.rating}/5 : « ${String(action.payload.comment).slice(0, 100)} »`,
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
          title: 'Réponse à votre avis',
          message: `Le propriétaire a répondu à votre avis : « ${String(review.replyText).slice(0, 100)} »`,
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
          title: 'Contestation enregistrée',
          message: 'Votre contestation a été transmise à la modération MOXT.',
          type: 'review',
          link,
          priority: 'high',
        },
        'notifSysteme',
      )
      notifyAdmins({
        title: 'Contestation d avis',
        message: `${review.authorName || 'Un membre'} — avis contesté sur ${review.targetType}.`,
        type: 'moderation',
        link: '/admin',
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
          : 'Un membre'

      notifyUser(
        publisherOwnerId,
        {
          title: 'Nouvel abonné',
          message: `${subscriberName || 'Un membre'} s'est abonné à vos publications.`,
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
          title: 'Abonnement retiré',
          message: `${action.payload.publisherName || 'Un éditeur'} a retiré votre abonnement à ses publications.`,
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
          title: 'Accès abonnement restreint',
          message: `${action.payload.publisherName || 'Un éditeur'} vous a interdit de vous abonner à ses publications.`,
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
        title: 'Signalement abonné',
        message: `${action.payload.publisherName || 'Un éditeur'} a signalé un abonné : ${String(action.payload.reason).slice(0, 120)}`,
        type: 'moderation',
        link: '/admin',
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
      const actorName = actor ? `${actor.firstName || ''} ${actor.lastName || ''}`.trim() : 'Quelqu un'
      notifyUser(
        post.authorId,
        {
          title: 'Nouveau j aime',
          message: `${actorName || 'Un membre'} a aimé votre publication.`,
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
          title: 'Nouveau commentaire',
          message: `${comment.authorName || 'Un membre'} : « ${String(comment.text).slice(0, 100)} »`,
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
          title: 'Nouvelle commande P2P',
          message: `${order.buyerName} a accepté votre offre ${order.offerId}.`,
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

      const label = P2P_STATUS_LABELS[order.status] || order.status
      const recipients = [order.buyerId, order.sellerId].filter((id) => id && id !== actorId)
      notifyUsers(
        recipients,
        {
          title: 'Commande P2P mise à jour',
          message: `La commande ${order.id} est maintenant : ${label}.`,
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
          title: 'Preuve P2P ajoutée',
          message: `Une preuve a été ajoutée sur la commande ${order.id}.`,
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
          title: 'Évaluation P2P reçue',
          message: `Votre transaction ${order.id} a reçu une note de ${action.payload.rating}/5.`,
          type: 'p2p',
          link: `/p2p/orders/${order.id}`,
        },
        'notifTransfers',
      )
    },
    handleVerificationStatus(before, after, action, actorId) {
      const previous = before.account.verificationRequests.find((item) => item.id === action.payload.id)
      const request = after.account.verificationRequests.find((item) => item.id === action.payload.id)
      if (!request || previous?.status === request.status) return

      const labels = {
        verified: 'vérifiée',
        rejected: 'refusée',
        pending_review: 'en cours d examen',
      }
      notifyUser(
        request.userId,
        {
          title: 'Vérification de compte',
          message: `Votre demande de vérification est ${labels[request.status] || request.status}.`,
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
          title: 'Litige ouvert',
          message: `Un litige a été ouvert concernant ${dispute.relatedType} ${dispute.relatedId}.`,
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
          title: 'Litige mis à jour',
          message: `Le litige ${dispute.id} est maintenant : ${dispute.status}.`,
          type: 'dispute',
          link: '/disputes',
          priority: 'high',
        },
        'notifSysteme',
      )
    },
  }
}
