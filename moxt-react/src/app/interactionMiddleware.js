import { addNotification } from '../features/communications/communicationSlice'
import { BUSINESS_VISIBLE_STATUSES } from '../features/businesses/businessPublishUtils'
import { syncTransferReceipt } from '../features/transfers/transferReceiptSync'
import { addToast } from '../features/ui/uiSlice'
import {
  notifyPublisherSubscribers,
  resolvePublisherFromContent,
} from '../features/account/publisherSubscriptionNotify'
import {
  reportForeignKeyForAction,
  wasActiveReportAdded,
  wasActiveReportDuplicate,
} from '../features/moderation/reportUtils'
import { collectCascadeArchiveTargets } from '../features/posts/archiveLinkedPosts'
import { archivePostsBySource } from '../features/posts/postsSlice'

import { createNotificationDispatcher } from './notificationTriggers'
import { hasReviewEligibility } from '@moxt/shared/utils/reviewEligibility.js'
import { setUser } from '../features/auth/authSlice'
import { setUserVerified } from '../features/administration/administrationSlice'
import { sanitizeUserFacingMessage } from '../features/auth/authErrorMessages'
import { appText } from '../i18n/appText'
import { supabase } from '../services/supabaseClient'

function notify(store, payload) {
  if (payload.userId) store.dispatch(addNotification(payload))
}

/** Notifie tous les comptes actifs (RPC serveur) — marketplace / jobs / colis / events / P2P. */
function notifyAllUsersPublication({ title, message, type, link, priority, dedupeKey }) {
  if (!supabase) return
  void supabase
    .rpc('moxt_notify_all_users', {
      p_title: String(title || '').slice(0, 200),
      p_message: String(message || '').slice(0, 500),
      p_type: type || 'publication',
      p_link: link || '/',
      p_priority: priority || 'normal',
      p_dedupe_key: dedupeKey || null,
    })
    .then(({ error }) => {
      if (error) console.warn('[notifications] fan-out global:', error.message)
    })
}

function fanOutPublicationToEveryone(store, state, item, contentType, title, linkBuilder, priority = 'normal') {
  const publisher = resolvePublisherFromContent(state, item)
  if (!publisher.publisherId || !item?.id) return
  const link = linkBuilder(item.id)
  const label = item.title
    ? `« ${item.title} »`
    : item.body
      ? String(item.body).slice(0, 120)
      : appText('notificationsFeed.newContentPublished')
  notifyAllUsersPublication({
    title: `${publisher.publisherName} — ${title}`,
    message: label,
    type: contentType || 'publication',
    link,
    priority,
    dedupeKey: `${contentType || 'pub'}-${item.id}`,
  })
}

/** Posts / fil : abonnés uniquement (pas de flood global). */
function fanOutPublication(store, state, item, contentType, title, linkBuilder, priority = 'normal') {
  const publisher = resolvePublisherFromContent(state, item)
  if (!publisher.publisherId) return
  notifyPublisherSubscribers(store, {
    ...publisher,
    contentType,
    contentLabel: item.title
      ? `« ${item.title} »`
      : item.body
        ? String(item.body).slice(0, 120)
        : appText('notificationsFeed.newContentPublished'),
    title,
    link: linkBuilder(item.id),
    actorId: state.auth.user?.id,
    priority,
  })
}

export const interactionMiddleware = (store) => {
  const triggers = createNotificationDispatcher(store)
  return (next) => (action) => {
  const before = store.getState()

  if (action.type === 'reviews/createReview') {
    const existed = before.reviews.items.some(
      (item) =>
        item.authorId === action.payload.authorId &&
        item.targetType === action.payload.targetType &&
        item.targetId === action.payload.targetId,
    )
    if (!existed) {
      const eligibility = hasReviewEligibility(
        before,
        action.payload.authorId,
        action.payload.targetType,
        action.payload.targetId,
      )
      if (!eligibility.allowed) {
        store.dispatch(
          addToast({
            title: appText('toasts.reviewNotAllowed'),
            message: eligibility.reasonKey
              ? appText(eligibility.reasonKey)
              : eligibility.reason || appText('reviews.reasons.notAllowed'),
            tone: 'error',
          }),
        )
        return action
      }
    }
  }

  const result = next(action)
  const after = store.getState()
  const actorId = after.auth.user?.id

  // Cascade: archive feed posts linked to catalog items that left a live status
  if (action.type !== 'posts/archivePostsBySource') {
    for (const target of collectCascadeArchiveTargets(action, before, after)) {
      store.dispatch(archivePostsBySource(target))
    }
  }

  if (action.type === 'reviews/createReview') {
    const existed = before.reviews.items.some(
      (item) =>
        item.authorId === action.payload.authorId &&
        item.targetType === action.payload.targetType &&
        item.targetId === action.payload.targetId,
    )
    const created = after.reviews.items.some(
      (item) =>
        item.authorId === action.payload.authorId &&
        item.targetType === action.payload.targetType &&
        item.targetId === action.payload.targetId,
    )
    if (!existed && created) {
      triggers.handleReviewCreated(before, after, action)
    }
  }
  if (action.type === 'reviews/replyToReview') {
    triggers.handleReviewReply(before, after, action)
  }
  if (action.type === 'reviews/contestReview') {
    triggers.handleReviewContest(before, after, action)
  }
  if (action.type === 'account/upsertPublisherSubscription') {
    triggers.handleNewSubscriber(before, after, action)
  }
  if (action.type === 'account/removeSubscriberByPublisher') {
    triggers.handleSubscriberRemovedByPublisher(before, after, action)
  }
  if (action.type === 'account/banPublisherSubscriber') {
    triggers.handleSubscriberBanned(before, after, action)
  }
  if (action.type === 'administration/updateUserRole' && action.payload.id === actorId) {
    const user = after.auth.user
    if (user) store.dispatch(setUser({ ...user, role: action.payload.role }))
  }
  if (action.type === 'administration/updateUserStatus' && action.payload.id === actorId) {
    const user = after.auth.user
    if (user) store.dispatch(setUser({ ...user, status: action.payload.status }))
  }
  if (action.type === 'administration/updateUserCity' && action.payload.id === actorId) {
    const user = after.auth.user
    const city = String(action.payload.city || '').trim()
    if (user && city) store.dispatch(setUser({ ...user, city }))
  }
  if (action.type === 'administration/updateUserOriginCountry' && action.payload.id === actorId) {
    const user = after.auth.user
    if (user && action.payload.originCountry) {
      store.dispatch(setUser({ ...user, originCountry: action.payload.originCountry }))
    }
  }
  if (action.type === 'posts/toggleLike') {
    triggers.handlePostLike(before, after, action)
  }
  if (action.type === 'posts/addComment') {
    triggers.handlePostComment(before, after, action)
  }
  if (action.type === 'p2p/acceptOffer') {
    triggers.handleP2PAcceptOffer(after, action)
  }
  if (action.type === 'p2p/updateOrderStatus' || action.type === 'p2p/expireOrder') {
    triggers.handleP2POrderStatus(before, after, action, actorId)
  }
  if (action.type === 'p2p/addOrderProof') {
    triggers.handleP2POrderProof(after, action, actorId)
  }
  if (action.type === 'p2p/rateOrder') {
    triggers.handleP2PRateOrder(after, action, actorId)
  }
  if (action.type === 'account/updateVerificationStatus') {
    triggers.handleVerificationStatus(before, after, action, actorId)
    if (action.payload.status === 'verified') {
      const request = after.account.verificationRequests.find((item) => item.id === action.payload.id)
      if (request?.userId) {
        store.dispatch(setUserVerified({ id: request.userId, verified: true }))
        const currentUser = store.getState().auth.user
        if (currentUser?.id === request.userId) {
          store.dispatch(setUser({ ...currentUser, verified: true, status: 'verified' }))
        }
      }
    }
  }
  if (action.type === 'businesses/addBusinessDocument') {
    triggers.handleBusinessDocumentSubmitted(before, after, action)
  }
  if (action.type === 'businesses/updateBusinessDocumentStatus') {
    triggers.handleBusinessDocumentStatus(before, after, action)
  }
  if (action.type === 'disputes/openDispute') {
    triggers.handleDisputeOpened(before, after, action, actorId)
  }
  if (action.type === 'disputes/updateDisputeStatus') {
    triggers.handleDisputeStatus(before, after, action, actorId)
  }
  if (action.type === 'communications/createSupportTicket') {
    triggers.handleSupportTicketCreated(before, after, action)
  }
  if (action.type === 'communications/replySupportTicket') {
    triggers.handleSupportTicketReply(before, after, action)
  }

  if (action.type === 'transfers/createTransfer' && !action.payload?.blocked) {
    notify(store, {
      userId: action.payload.businessOwnerId,
      title: appText('notificationsFeed.newTransferReceived'),
      message: appText('notificationsFeed.newTransferReceivedBody', {
        name: action.payload.sender?.firstName,
        id: action.payload.id,
      }),
      type: 'transfer',
      link: `/transfers/${action.payload.id}`,
    })
  }

  // Fusion des deux blocs moderateTransfer qui étaient dupliqués
  if (action.type === 'transfers/moderateTransfer') {
    const transfer = after.transfers.items.find((item) => item.id === action.payload.id)

    // Notifier le client du changement de statut
    if (transfer?.userId && transfer.userId !== actorId) {
      notify(store, {
        userId: transfer.userId,
        title: appText('notificationsFeed.transferUpdated'),
        message: appText('notificationsFeed.transferUpdatedBody', {
          id: transfer.id,
          status: action.payload.status,
        }),
        type: 'transfer',
        link: `/transfers/${transfer.id}`,
      })
    }

    // Toast uniquement si le statut a réellement changé
    const previousTransfer = before.transfers.items.find((item) => item.id === action.payload.id)
    if (previousTransfer && previousTransfer.status !== action.payload.status) {
      store.dispatch(
        addToast({
          title: appText('toasts.transferUpdated'),
          message: appText('toasts.transferTimelineMessage', {
            status: action.payload.status,
          }),
          tone: 'success',
        }),
      )
    }

    // Conserver reçu et preuves à chaque étape
    if (transfer) {
      syncTransferReceipt(store, transfer)
    }
  }

  if (action.type === 'transfers/receiveTransfer') {
    const transfer = after.transfers.items.find((item) => item.id === action.payload.id)
    if (transfer) {
      syncTransferReceipt(store, transfer)
    }
    if (transfer?.businessOwnerId && transfer.businessOwnerId !== actorId) {
      notify(store, {
        userId: transfer.businessOwnerId,
        title: appText('notificationsFeed.transferCompleted'),
        message: appText('notificationsFeed.transferCompletedBody', { id: transfer.id }),
        type: 'transfer',
        link: `/transfers/${transfer.id}`,
        priority: 'high',
      })
    }
  }

  if (action.type === 'transfers/cancelTransfer') {
    const transferId =
      typeof action.payload === 'string' ? action.payload : action.payload?.id
    const transfer = after.transfers.items.find((item) => item.id === transferId)
    const previous = before.transfers.items.find((item) => item.id === transferId)
    if (
      transfer?.businessOwnerId &&
      previous?.status !== 'cancelled' &&
      transfer.status === 'cancelled' &&
      transfer.businessOwnerId !== actorId
    ) {
      notify(store, {
        userId: transfer.businessOwnerId,
        title: appText('notificationsFeed.transferCancelled'),
        message: appText('notificationsFeed.transferCancelledBody', { id: transfer.id }),
        type: 'transfer',
        link: `/transfers/${transfer.id}`,
        priority: 'high',
      })
    }
  }

  if (action.type === 'transfers/expireOverdueTransfers') {
    after.transfers.items.forEach((transfer) => {
      const previous = before.transfers.items.find((item) => item.id === transfer.id)
      if (!previous || previous.status === transfer.status || transfer.status !== 'expired') return
      ;[transfer.userId, transfer.businessOwnerId]
        .filter((id) => id && id !== actorId)
        .forEach((userId) => {
          notify(store, {
            userId,
            title: appText('notificationsFeed.transferExpired'),
            message: appText('notificationsFeed.transferExpiredBody', { id: transfer.id }),
            type: 'transfer',
            link: `/transfers/${transfer.id}`,
            priority: 'high',
          })
        })
    })
  }

  if (action.type === 'jobs/applyToJob') {
    const application = after.jobs.applications.find((item) => item.id === action.payload.id)
    const job = after.jobs.items.find((item) => item.id === application?.jobId)
    if (job?.ownerId && job.ownerId !== actorId) {
      notify(store, {
        userId: job.ownerId,
        title: appText('notificationsFeed.newApplication'),
        message: appText('notificationsFeed.newApplicationBody', {
          name: application?.applicantName || appText('notificationsFeed.someone'),
          title: job.title || appText('notificationsFeed.thisJob'),
        }),
        type: 'job',
        link: `/jobs/${job.id}`,
        priority: 'high',
      })
    }
  }

  if (action.type === 'jobs/withdrawApplication') {
    const application = after.jobs.applications.find((item) => item.id === action.payload.id)
    const previous = before.jobs.applications.find((item) => item.id === action.payload.id)
    const job = after.jobs.items.find((item) => item.id === application?.jobId)
    if (
      job?.ownerId &&
      previous?.status !== 'withdrawn' &&
      application?.status === 'withdrawn' &&
      job.ownerId !== actorId
    ) {
      notify(store, {
        userId: job.ownerId,
        title: appText('notificationsFeed.applicationWithdrawn'),
        message: appText('notificationsFeed.applicationWithdrawnBody', {
          title: job.title || appText('notificationsFeed.thisJob'),
        }),
        type: 'job',
        link: `/jobs/${job.id}`,
      })
    }
  }

  if (action.type === 'events/registerForEvent') {
    const registration = after.events.registrations.find((item) => item.id === action.payload.id)
    const event = after.events.items.find((item) => item.id === registration?.eventId)
    if (event?.ownerId && event.ownerId !== actorId) {
      notify(store, {
        userId: event.ownerId,
        title: appText('notificationsFeed.newRegistration'),
        message: appText('notificationsFeed.newRegistrationBody', {
          name: registration?.participantName || appText('notificationsFeed.someone'),
          title: event.title || appText('notificationsFeed.thisEvent'),
        }),
        type: 'event',
        link: `/events/${event.id}`,
        priority: 'high',
      })
    }
  }

  if (action.type === 'events/cancelRegistration') {
    const registration = after.events.registrations.find((item) => item.id === action.payload.id)
    const previous = before.events.registrations.find((item) => item.id === action.payload.id)
    const event = after.events.items.find((item) => item.id === registration?.eventId)
    if (
      event?.ownerId &&
      previous?.status !== 'cancelled' &&
      registration?.status === 'cancelled' &&
      event.ownerId !== actorId
    ) {
      notify(store, {
        userId: event.ownerId,
        title: appText('notificationsFeed.registrationCancelled'),
        message: appText('notificationsFeed.registrationCancelledBody', {
          title: event.title || appText('notificationsFeed.thisEvent'),
        }),
        type: 'event',
        link: `/events/${event.id}`,
      })
    }
  }

  if (action.type === 'parcels/requestParcelReservation') {
    const request = after.parcels.requests.find((item) => item.id === action.payload.id)
    if (request?.ownerId && request.ownerId !== actorId) {
      notify(store, {
        userId: request.ownerId,
        title: appText('notificationsFeed.newParcelRequest'),
        message: appText('notificationsFeed.newParcelRequestBody', {
          name: request.requesterName || appText('notificationsFeed.someone'),
          kg: request.kg,
        }),
        type: 'parcel',
        link: `/parcels/${request.parcelId}`,
        priority: 'high',
      })
    }
  }

  if (action.type === 'parcels/cancelParcelRequest') {
    const request = after.parcels.requests.find((item) => item.id === action.payload.id)
    const previous = before.parcels.requests.find((item) => item.id === action.payload.id)
    if (
      request?.ownerId &&
      previous?.status !== 'cancelled' &&
      request.status === 'cancelled' &&
      request.ownerId !== actorId
    ) {
      notify(store, {
        userId: request.ownerId,
        title: appText('notificationsFeed.parcelRequestCancelled'),
        message: appText('notificationsFeed.parcelRequestCancelledBody', {
          kg: request.kg,
        }),
        type: 'parcel',
        link: `/parcels/${request.parcelId}`,
      })
    }
  }

  if (action.type === 'parcels/updateParcelProofStatus') {
    const parcel = after.parcels.items.find((item) => item.id === action.payload.id)
    const previous = before.parcels.items.find((item) => item.id === action.payload.id)
    if (
      parcel?.ownerId &&
      previous?.proofStatus !== parcel.proofStatus &&
      parcel.ownerId !== actorId
    ) {
      notify(store, {
        userId: parcel.ownerId,
        title: appText('notificationsFeed.parcelProofReviewed'),
        message: appText('notificationsFeed.parcelProofReviewedBody', {
          status: parcel.proofStatus,
        }),
        type: 'parcel',
        link: `/parcels/${parcel.id}`,
      })
    }
  }

  if (action.type === 'businesses/createBusinessRequest') {
    const request = after.businesses.requests.find((item) => item.id === action.payload.id)
    const business = after.businesses.items.find((item) => item.id === request?.businessId)
    const businessOwnerId = business?.ownerId
    if (businessOwnerId && businessOwnerId !== actorId) {
      notify(store, {
        userId: businessOwnerId,
        title: appText('notificationsFeed.businessRequestCreated'),
        message: appText('notificationsFeed.businessRequestCreatedBody', {
          name: request?.requesterName || appText('notificationsFeed.someone'),
        }),
        type: 'business',
        link: '/professional?tab=requests',
        priority: 'high',
      })
    }
  }

  if (action.type === 'businesses/addBusinessMember') {
    const memberId = action.payload?.userId
    if (memberId && memberId !== actorId) {
      notify(store, {
        userId: memberId,
        title: appText('notificationsFeed.businessMemberAdded'),
        message: appText('notificationsFeed.businessMemberAddedBody'),
        type: 'business',
        link: '/professional',
      })
    }
  }

  if (action.type === 'businesses/removeBusinessMember') {
    const previous = before.businesses.members.find(
      (item) => item.id === action.payload.id && item.businessId === action.payload.businessId,
    )
    const memberId = previous?.userId
    if (memberId && memberId !== actorId) {
      notify(store, {
        userId: memberId,
        title: appText('notificationsFeed.businessMemberRemoved'),
        message: appText('notificationsFeed.businessMemberRemovedBody'),
        type: 'business',
        link: '/professional',
      })
    }
  }

  if (action.type === 'administration/updateUserStatus') {
    const actor = store.getState().auth?.user
    const actorIsAdmin = ['admin', 'superadmin'].includes(actor?.role)
    const targetId = action.payload?.id
    const status = action.payload?.status
    // Uniquement après une vraie action admin (anti-spoof via Redux/devtools).
    if (
      actorIsAdmin &&
      targetId &&
      targetId !== actorId &&
      ['suspended', 'banned', 'blocked', 'disabled', 'pending_deletion'].includes(status)
    ) {
      notify(store, {
        userId: targetId,
        title: appText('notificationsFeed.accountStatusChanged'),
        message: appText('notificationsFeed.accountStatusChangedBody', { status }),
        type: 'system',
        link: '/support',
        priority: 'high',
      })
    }
  }

  if (action.type === 'p2p/moderateOffer') {
    const actor = store.getState().auth?.user
    const actorIsStaff = ['admin', 'superadmin', 'moderator'].includes(actor?.role)
    const offer = after.p2p.offers.find((item) => item.id === action.payload.id)
    if (actorIsStaff && offer?.ownerId && offer.ownerId !== actorId) {
      notify(store, {
        userId: offer.ownerId,
        title: appText('notificationsFeed.p2pOfferModerated'),
        message: appText('notificationsFeed.p2pOfferModeratedBody', {
          status: action.payload.status || offer.status,
        }),
        type: 'p2p',
        link: `/p2p/${offer.id}`,
        priority: 'high',
      })
    }
  }

  if (action.type === 'communications/updateSupportStatus') {
    const ticket = after.communications.support.find((item) => item.id === action.payload.id)
    const previous = before.communications.support.find((item) => item.id === action.payload.id)
    if (ticket?.userId && previous?.status !== ticket.status && ticket.userId !== actorId) {
      notify(store, {
        userId: ticket.userId,
        title: appText('notificationsFeed.supportStatusUpdated'),
        message: appText('notificationsFeed.supportStatusUpdatedBody', {
          status: ticket.status,
        }),
        type: 'support',
        link: `/messages?relatedType=support&relatedId=${encodeURIComponent(`support-${ticket.userId}`)}`,
      })
    }
  }

  if (action.type === 'transfers/declarePayment') {
    const transferId = typeof action.payload === 'string' ? action.payload : action.payload.id
    const transfer = after.transfers.items.find((item) => item.id === transferId)
    if (transfer) {
      syncTransferReceipt(store, transfer)
    }
    if (transfer?.businessOwnerId) {
      notify(store, {
        userId: transfer.businessOwnerId,
        title: appText('notificationsFeed.paymentDeclared'),
        message: appText('notificationsFeed.paymentDeclaredBody', { id: transfer.id }),
        type: 'transfer',
        link: `/transfers/${transfer.id}`,
      })
    }
  }

  if (action.type === 'businesses/updateBusinessRequestStatus') {
    const request = after.businesses.requests.find((item) => item.id === action.payload.id)
    if (request?.ownerId) {
      notify(store, {
        userId: request.ownerId,
        title: appText('notificationsFeed.requestUpdated'),
        message: appText('notificationsFeed.requestUpdatedBody', { status: request.status }),
        type: request.relatedType || 'request',
        link: request.relatedId ? `/${request.relatedType}/${request.relatedId}` : '/activities',
      })
    }
    store.dispatch(
      addToast({
        title: appText('toasts.actionSaved'),
        message: appText('toasts.requestTimelineUpdated'),
        tone: 'success',
      }),
    )
  }

  if (action.type === 'jobs/updateApplicationStatus') {
    const application = after.jobs.applications.find((item) => item.id === action.payload.id)
    const previous = before.jobs.applications.find((item) => item.id === action.payload.id)
    const job = after.jobs.items.find((item) => item.id === application?.jobId)
    if (application && previous?.status !== application.status) {
      notify(store, {
        userId: application.userId,
        title: appText('notificationsFeed.applicationUpdated'),
        message: appText('notificationsFeed.applicationUpdatedBody', {
          title: job?.title || appText('notificationsFeed.thisJob'),
          status: application.status,
        }),
        type: 'job',
        link: `/jobs/${application.jobId}`,
      })
    }
  }

  if (action.type === 'events/updateRegistrationStatus') {
    const registration = after.events.registrations.find((item) => item.id === action.payload.id)
    const previous = before.events.registrations.find((item) => item.id === action.payload.id)
    const event = after.events.items.find((item) => item.id === registration?.eventId)
    if (registration && previous?.status !== registration.status) {
      notify(store, {
        userId: registration.userId,
        title: appText('notificationsFeed.eventRegistrationUpdated'),
        message: appText('notificationsFeed.eventRegistrationUpdatedBody', {
          title: event?.title || appText('notificationsFeed.thisEvent'),
          status: registration.status,
        }),
        type: 'event',
        link: `/events/${registration.eventId}`,
      })
    }
  }

  if (action.type === 'parcels/reserveParcel') {
    const previous = before.parcels.items.find((item) => item.id === action.payload.id)
    const parcel = after.parcels.items.find((item) => item.id === action.payload.id)
    if (parcel && previous?.remainingKg !== parcel.remainingKg) {
      notify(store, {
        userId: parcel.ownerId,
        title: appText('notificationsFeed.newReservation'),
        message: appText('notificationsFeed.newReservationBody', { kg: action.payload.kg }),
        type: 'parcel',
        link: `/parcels/${parcel.id}`,
      })
    }
  }

  if (action.type === 'parcels/updateParcelRequestStatus') {
    const request = after.parcels.requests.find((item) => item.id === action.payload.id)
    const previous = before.parcels.requests.find((item) => item.id === action.payload.id)
    if (request && previous?.status !== request.status) {
      notify(store, {
        userId: request.userId,
        title: appText('notificationsFeed.parcelRequestUpdated'),
        message: appText('notificationsFeed.parcelRequestUpdatedBody', {
          kg: request.kg,
          status: request.status,
        }),
        type: 'parcel',
        link: `/parcels/${request.parcelId}`,
      })
    }
  }

  if (action.type === 'marketplace/addListingQuestion') {
    const listing = after.marketplace.items.find((item) => item.id === action.payload.listingId)
    if (listing?.ownerId && listing.ownerId !== action.payload.question.authorId) {
      notify(store, {
        userId: listing.ownerId,
        title: appText('notificationsFeed.newListingQuestion'),
        message: appText('notificationsFeed.newListingQuestionBody', {
          name: action.payload.question.authorName,
          title: listing.title,
        }),
        type: 'marketplace',
        link: `/marketplace/${listing.id}`,
      })
    }
    store.dispatch(
      addToast({
        title: appText('toasts.questionPublished'),
        message: appText('toasts.questionPublishedBody'),
        tone: 'success',
      }),
    )
  }

  if (action.type === 'marketplace/answerListingQuestion') {
    const listing = after.marketplace.items.find((item) => item.id === action.payload.listingId)
    const question = listing?.questions?.find((item) => item.id === action.payload.questionId)
    if (question?.authorId && question.authorId !== actorId) {
      notify(store, {
        userId: question.authorId,
        title: appText('notificationsFeed.questionAnswered'),
        message: appText('notificationsFeed.questionAnsweredBody', {
          title: listing?.title || appText('notificationsFeed.yourListing'),
        }),
        type: 'marketplace',
        link: `/marketplace/${action.payload.listingId}`,
      })
    }
    store.dispatch(
      addToast({
        title: appText('toasts.answerPublished'),
        message: appText('toasts.answerPublishedBody'),
        tone: 'success',
      }),
    )
  }

  if (action.type === 'businesses/moderateBusiness') {
    const actor = store.getState().auth?.user
    const actorIsStaff = ['admin', 'superadmin', 'moderator'].includes(actor?.role)
    if (actorIsStaff) {
      const previous = before.businesses.items.find((item) => item.id === action.payload.id)
      const business = after.businesses.items.find((item) => item.id === action.payload.id)
      const { status } = action.payload
      if (business?.ownerId && business.ownerId !== actorId && previous?.status !== status) {
        const wasPublishReady = BUSINESS_VISIBLE_STATUSES.includes(previous?.status)
        const isPublishReady = BUSINESS_VISIBLE_STATUSES.includes(status)
        if (isPublishReady && !wasPublishReady) {
          notify(store, {
            userId: business.ownerId,
            title: appText('notificationsFeed.businessVerified'),
            message: appText('notificationsFeed.businessVerifiedBody', { name: business.name }),
            type: 'business',
            link: `/businesses/${business.id}`,
          })
        } else if (status === 'rejected') {
          notify(store, {
            userId: business.ownerId,
            title: appText('notificationsFeed.businessRejected'),
            message: appText('notificationsFeed.businessRejectedBody', { name: business.name }),
            type: 'moderation',
            link: `/businesses/${business.id}`,
          })
        } else if (!isPublishReady) {
          notify(store, {
            userId: business.ownerId,
            title: appText('notificationsFeed.businessUpdated'),
            message: appText('notificationsFeed.businessUpdatedBody', { status }),
            type: 'moderation',
            link: `/businesses/${business.id}`,
          })
        }
      }
    }
  }

  const moderationDomains = {
    'events/moderateEvent': ['events', '/events/', appText('notificationsFeed.labelEvent')],
    'jobs/moderateJob': ['jobs', '/jobs/', appText('notificationsFeed.labelJob')],
    'marketplace/updateListingStatus': [
      'marketplace',
      '/marketplace/',
      appText('notificationsFeed.labelListing'),
    ],
  }
  const moderation = moderationDomains[action.type]
  if (moderation) {
    const actor = store.getState().auth?.user
    const actorIsStaff = ['admin', 'superadmin', 'moderator'].includes(actor?.role)
    if (actorIsStaff) {
      const [domain, path, label] = moderation
      const resource = after[domain].items.find((item) => item.id === action.payload.id)
      if (resource?.ownerId && resource.ownerId !== actorId) {
        notify(store, {
          userId: resource.ownerId,
          title: appText('notificationsFeed.resourceUpdated', { label }),
          message: appText('notificationsFeed.newStatus', { status: action.payload.status }),
          type: 'moderation',
          link: `${path}${resource.id}`,
        })
      }
    }
  }

  const contentReportConfig = {
    'marketplace/reportListing': {
      slice: 'marketplace',
      label: appText('notificationsFeed.labelListing'),
      link: (payload) => `/marketplace/${payload.listingId}`,
    },
    'jobs/reportJob': {
      slice: 'jobs',
      label: appText('notificationsFeed.labelJobOffer'),
      link: (payload) => `/jobs/${payload.jobId}`,
    },
    'events/reportEvent': {
      slice: 'events',
      label: appText('notificationsFeed.labelEvent'),
      link: (payload) => `/events/${payload.eventId}`,
    },
  }
  const reportConfig = contentReportConfig[action.type]
  if (reportConfig) {
    const foreignKey = reportForeignKeyForAction(action.type)
    const beforeReports = before[reportConfig.slice].reports || []
    const afterReports = after[reportConfig.slice].reports || []
    if (wasActiveReportAdded(beforeReports, afterReports, action.payload, foreignKey)) {
      store.dispatch(
        addToast({
          title: appText('toasts.reportSent'),
          message: appText('toasts.reportSentBody'),
          tone: 'success',
        }),
      )
      triggers.handleContentReported(
        reportConfig.label,
        action.payload.reason,
        reportConfig.link(action.payload),
      )
    } else if (wasActiveReportDuplicate(beforeReports, afterReports, action.payload, foreignKey)) {
      store.dispatch(
        addToast({
          title: appText('toasts.alreadyReported'),
          message: appText('toasts.alreadyReportedBody'),
          tone: 'info',
        }),
      )
    }
  }

  if (action.type === 'account/reportPublisherSubscriber') {
    const beforeReports = before.account.subscriberReports || []
    const afterReports = after.account.subscriberReports || []
    if (afterReports.length > beforeReports.length) {
      store.dispatch(
        addToast({
          title: appText('toasts.reportSent'),
          message: appText('toasts.reportSentCaseBody'),
          tone: 'success',
        }),
      )
      triggers.handleSubscriberReported(before, after, action)
    } else {
      store.dispatch(
        addToast({
          title: appText('toasts.alreadyReported'),
          message: appText('toasts.alreadyReportedCaseBody'),
          tone: 'info',
        }),
      )
    }
  }

  if (action.type === 'disputes/openDispute') {
    const beforeCount = before.disputes.items.length
    const afterCount = after.disputes.items.length
    if (afterCount > beforeCount) {
      store.dispatch(
        addToast({
          title: appText('toasts.claimRegistered'),
          message: appText('toasts.claimRegisteredBody'),
          tone: 'success',
        }),
      )
    } else {
      store.dispatch(
        addToast({
          title: appText('toasts.claimAlreadyOpen'),
          message: appText('toasts.claimAlreadyOpenBody'),
          tone: 'info',
        }),
      )
    }
  }

  const successActions = {
    'businesses/saveBusiness': {
      title: appText('toasts.businessSaved'),
      message: appText('toasts.businessSavedBody'),
    },
    'events/createEvent': {
      title: appText('toasts.eventPublished'),
      message: appText('toasts.eventPublishedBody'),
    },
    'jobs/applyToJob': {
      title: appText('toasts.applicationSent'),
      message: appText('toasts.applicationSentBody'),
    },
    'jobs/createJob': {
      title: appText('toasts.jobPublished'),
      message: appText('toasts.jobPublishedBody'),
    },
    'marketplace/publishListing/fulfilled': {
      title: appText('toasts.listingPublished'),
      message: appText('toasts.listingPublishedBody'),
    },
    'p2p/createOffer': {
      title: appText('toasts.p2pOfferPublished'),
      message: appText('toasts.p2pOfferPublishedBody'),
    },
    'parcels/requestParcelReservation': {
      title: appText('toasts.parcelRequestSent'),
      message: appText('toasts.parcelRequestSentBody'),
    },
    'parcels/createParcel': {
      title: appText('toasts.parcelPublished'),
      message: appText('toasts.parcelPublishedBody'),
    },
    'finance/createReceipt': {
      title: appText('toasts.receiptSaved'),
      message: appText('toasts.receiptSavedBody'),
    },
    'account/banPublisherSubscriber': {
      title: appText('toasts.subscriberBanned'),
      message: appText('toasts.subscriberBannedBody'),
    },
    'account/removeSubscriberByPublisher': {
      title: appText('toasts.subscriberRemoved'),
      message: appText('toasts.subscriberRemovedBody'),
    },
    'transfers/createTransfer': {
      title: appText('toasts.transferCreated'),
      message: appText('toasts.transferCreatedBody'),
    },
  }
  if (successActions[action.type]) {
    store.dispatch(addToast({ ...successActions[action.type], tone: 'success' }))
  }

  if (action.type === 'marketplace/publishListing/fulfilled') {
    fanOutPublicationToEveryone(
      store,
      after,
      action.payload,
      'listing',
      appText('notificationsFeed.fanOutListing'),
      (id) => `/marketplace/${id}`,
      'high',
    )
  }

  if (action.type === 'jobs/createJob') {
    fanOutPublicationToEveryone(
      store,
      after,
      action.payload,
      'job',
      appText('notificationsFeed.fanOutJob'),
      (id) => `/jobs/${id}`,
      'high',
    )
  }

  if (action.type === 'events/createEvent') {
    fanOutPublicationToEveryone(
      store,
      after,
      action.payload,
      'event',
      appText('notificationsFeed.fanOutEvent'),
      (id) => `/events/${id}`,
      'high',
    )
  }

  if (action.type === 'parcels/createParcel') {
    fanOutPublicationToEveryone(
      store,
      after,
      action.payload,
      'parcel',
      appText('notificationsFeed.fanOutParcel'),
      (id) => `/parcels/${id}`,
      'high',
    )
  }

  if (action.type === 'p2p/createOffer') {
    fanOutPublicationToEveryone(
      store,
      after,
      action.payload,
      'p2p',
      appText('notificationsFeed.fanOutP2p'),
      (id) => `/p2p/${id}`,
      'high',
    )
  }

  if (action.type === 'posts/createPost') {
    fanOutPublication(
      store,
      after,
      action.payload,
      'post',
      appText('notificationsFeed.fanOutPost'),
      (id) => `/news?post=${id}`,
      'high',
    )
  }

  if (
    action.type.endsWith('/rejected') &&
    ![
      'auth/login/rejected',
      'auth/register/rejected',
      'auth/verifyPhoneRegistration/rejected',
      'auth/verifyEmailRegistration/rejected',
    ].includes(action.type)
  ) {
    const message =
      typeof action.payload === 'string'
        ? action.payload
        : action.error?.message || appText('toasts.actionCouldNotComplete')
    const rejectedTitles = {
      'auth/requestPhoneVerificationOtp/rejected': appText('toasts.smsSendFailed'),
      'auth/confirmPhoneVerification/rejected': appText('toasts.verificationFailed'),
    }
    store.dispatch(
      addToast({
        title: rejectedTitles[action.type] || appText('toasts.genericError'),
        message: sanitizeUserFacingMessage(message, appText),
        tone: 'error',
      }),
    )
  }

  return result
  }
}
