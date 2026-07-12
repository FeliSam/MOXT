import { addNotification } from '../features/communications/communicationSlice'
import { BUSINESS_VISIBLE_STATUSES } from '../features/businesses/businessPublishUtils'
import { upsertTransferReceipt } from '../features/finance/financeSlice'
import { syncTransferReceipt } from '../features/transfers/transferReceiptSync'
import { addToast } from '../features/ui/uiSlice'
import {
  notifyPublisherSubscribers,
  resolvePublisherFromContent,
} from '../features/account/publisherSubscriptionNotify'

import { createNotificationDispatcher } from './notificationTriggers'
import { hasReviewEligibility } from '@moxt/shared/utils/reviewEligibility.js'
import { setUser } from '../features/auth/authSlice'
import { sanitizeAuthMessage } from '../features/auth/authErrorMessages'

function notify(store, payload) {
  if (payload.userId) store.dispatch(addNotification(payload))
}

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
        : 'Nouveau contenu publié',
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
            title: 'Avis non autorisé',
            message: eligibility.reason,
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
  if (action.type === 'account/reportPublisherSubscriber') {
    triggers.handleSubscriberReported(before, after, action)
  }
  if (action.type === 'administration/updateUserRole' && action.payload.id === actorId) {
    const user = after.auth.user
    if (user) store.dispatch(setUser({ ...user, role: action.payload.role }))
  }
  if (action.type === 'administration/updateUserStatus' && action.payload.id === actorId) {
    const user = after.auth.user
    if (user) store.dispatch(setUser({ ...user, status: action.payload.status }))
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
  if (action.type === 'p2p/updateOrderStatus') {
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
      const currentUser = store.getState().auth.user
      if (request?.userId && currentUser?.id === request.userId) {
        store.dispatch(setUser({ ...currentUser, verified: true, status: 'verified' }))
      }
    }
  }
  if (action.type === 'disputes/openDispute') {
    triggers.handleDisputeOpened(before, after, action, actorId)
  }
  if (action.type === 'disputes/updateDisputeStatus') {
    triggers.handleDisputeStatus(before, after, action, actorId)
  }

  if (action.type === 'transfers/createTransfer') {
    notify(store, {
      userId: action.payload.businessOwnerId,
      title: 'Nouveau transfert reçu',
      message: `${action.payload.sender.firstName} a choisi votre entreprise pour ${action.payload.id}.`,
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
        title: 'Transfert mis à jour',
        message: `Votre opération ${transfer.id} est maintenant ${action.payload.status}.`,
        type: 'transfer',
        link: `/transfers/${transfer.id}`,
      })
    }

    // Toast uniquement si le statut a réellement changé
    const previousTransfer = before.transfers.items.find((item) => item.id === action.payload.id)
    if (previousTransfer && previousTransfer.status !== action.payload.status) {
      store.dispatch(
        addToast({
          title: 'Transfert mis à jour',
          message: `L'action « ${action.payload.status} » a été ajoutée à la chronologie.`,
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
        title: 'Paiement declare',
        message: `Le client a declare le paiement pour ${transfer.id}.`,
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
        title: 'Demande mise à jour',
        message: `Votre demande est maintenant ${request.status}.`,
        type: request.relatedType || 'request',
        link: request.relatedId ? `/${request.relatedType}/${request.relatedId}` : '/activities',
      })
    }
    store.dispatch(
      addToast({
        title: 'Action enregistrée',
        message: 'La chronologie de la demande a été mise à jour.',
        tone: 'success',
      }),
    )
  }

  if (
    action.type === 'jobs/applyToJob' &&
    after.jobs.applications.length > before.jobs.applications.length
  ) {
    const job = after.jobs.items.find((item) => item.id === action.payload.jobId)
    notify(store, {
      userId: job?.ownerId,
      title: 'Nouvelle candidature',
      message: `${action.payload.applicantName} a postule a ${job?.title}.`,
      type: 'job',
      link: `/jobs/${job?.id}`,
    })
  }

  if (action.type === 'jobs/updateApplicationStatus') {
    const application = after.jobs.applications.find((item) => item.id === action.payload.id)
    const previous = before.jobs.applications.find((item) => item.id === action.payload.id)
    const job = after.jobs.items.find((item) => item.id === application?.jobId)
    if (application && previous?.status !== application.status) {
      notify(store, {
        userId: application.userId,
        title: 'Candidature mise a jour',
        message: `Votre candidature pour ${job?.title || 'ce job'} est maintenant ${application.status}.`,
        type: 'job',
        link: `/jobs/${application.jobId}`,
      })
    }
  }

  if (
    action.type === 'events/registerForEvent' &&
    after.events.registrations.length > before.events.registrations.length
  ) {
    const event = after.events.items.find((item) => item.id === action.payload.eventId)
    notify(store, {
      userId: event?.ownerId,
      title: 'Nouvelle inscription',
      message: `${action.payload.participantName} participe a ${event?.title}.`,
      type: 'event',
      link: `/events/${event?.id}`,
    })
  }

  if (action.type === 'events/updateRegistrationStatus') {
    const registration = after.events.registrations.find((item) => item.id === action.payload.id)
    const previous = before.events.registrations.find((item) => item.id === action.payload.id)
    const event = after.events.items.find((item) => item.id === registration?.eventId)
    if (registration && previous?.status !== registration.status) {
      notify(store, {
        userId: registration.userId,
        title: 'Inscription evenement mise a jour',
        message: `Votre inscription a ${event?.title || 'cet evenement'} est maintenant ${registration.status}.`,
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
        title: 'Nouvelle reservation',
        message: `${action.payload.kg} kg ont ete reserves sur votre voyage.`,
        type: 'parcel',
        link: `/parcels/${parcel.id}`,
      })
    }
  }

  if (
    action.type === 'parcels/requestParcelReservation' &&
    after.parcels.requests.length > before.parcels.requests.length
  ) {
    const request = action.payload
    notify(store, {
      userId: request.ownerId,
      title: 'Nouvelle demande de colis',
      message: `${request.requesterName} demande ${request.kg} kg.`,
      type: 'parcel',
      link: `/parcels/${request.parcelId}`,
    })
  }

  if (action.type === 'parcels/updateParcelRequestStatus') {
    const request = after.parcels.requests.find((item) => item.id === action.payload.id)
    const previous = before.parcels.requests.find((item) => item.id === action.payload.id)
    if (request && previous?.status !== request.status) {
      notify(store, {
        userId: request.userId,
        title: 'Demande colis mise a jour',
        message: `Votre demande de ${request.kg} kg est maintenant ${request.status}.`,
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
        title: 'Nouvelle question sur votre annonce',
        message: `${action.payload.question.authorName} a posé une question sur « ${listing.title} ».`,
        type: 'marketplace',
        link: `/marketplace/${listing.id}`,
      })
    }
    store.dispatch(
      addToast({
        title: 'Question publiée',
        message: 'Le vendeur pourra y répondre publiquement.',
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
        title: 'Réponse à votre question',
        message: `Le vendeur a répondu sur « ${listing?.title || 'votre annonce'} ».`,
        type: 'marketplace',
        link: `/marketplace/${action.payload.listingId}`,
      })
    }
    store.dispatch(
      addToast({
        title: 'Réponse publiée',
        message: 'Votre réponse est visible sur la fiche.',
        tone: 'success',
      }),
    )
  }

  if (action.type === 'businesses/moderateBusiness') {
    const previous = before.businesses.items.find((item) => item.id === action.payload.id)
    const business = after.businesses.items.find((item) => item.id === action.payload.id)
    const { status } = action.payload
    if (business?.ownerId && business.ownerId !== actorId && previous?.status !== status) {
      const wasPublishReady = BUSINESS_VISIBLE_STATUSES.includes(previous?.status)
      const isPublishReady = BUSINESS_VISIBLE_STATUSES.includes(status)
      if (isPublishReady && !wasPublishReady) {
        notify(store, {
          userId: business.ownerId,
          title: 'Entreprise vérifiée',
          message: `« ${business.name} » est maintenant vérifiée. Vous pouvez publier au nom de l'entreprise et apparaître dans l'annuaire.`,
          type: 'business',
          link: `/businesses/${business.id}`,
        })
      } else if (status === 'rejected') {
        notify(store, {
          userId: business.ownerId,
          title: 'Entreprise refusée',
          message: `La validation de « ${business.name} » a été refusée. Contactez le support MOXT pour plus d'informations.`,
          type: 'moderation',
          link: `/businesses/${business.id}`,
        })
      } else if (!isPublishReady) {
        notify(store, {
          userId: business.ownerId,
          title: 'Entreprise mise à jour',
          message: `Nouveau statut : ${status}.`,
          type: 'moderation',
          link: `/businesses/${business.id}`,
        })
      }
    }
  }

  const moderationDomains = {
    'events/moderateEvent': ['events', '/events/', 'Événement'],
    'jobs/moderateJob': ['jobs', '/jobs/', 'Job'],
    'marketplace/updateListingStatus': ['marketplace', '/marketplace/', 'Annonce'],
  }
  const moderation = moderationDomains[action.type]
  if (moderation) {
    const [domain, path, label] = moderation
    const resource = after[domain].items.find((item) => item.id === action.payload.id)
    if (resource?.ownerId && resource.ownerId !== actorId) {
      notify(store, {
        userId: resource.ownerId,
        title: `${label} mise a jour`,
        message: `Nouveau statut: ${action.payload.status}.`,
        type: 'moderation',
        link: `${path}${resource.id}`,
      })
    }
  }

  const successActions = {
    'businesses/saveBusiness': {
      title: 'Entreprise enregistrée',
      message: 'Le profil et ses modules ont été mis à jour.',
    },
    'events/createEvent': {
      title: 'Événement publié',
      message: 'Votre événement est maintenant visible.',
    },
    'jobs/applyToJob': {
      title: 'Candidature envoyée',
      message: 'Votre candidature a bien été transmise.',
    },
    'jobs/createJob': {
      title: 'Offre publiée',
      message: "L'offre d'emploi est maintenant visible.",
    },
    'marketplace/publishListing/fulfilled': {
      title: 'Annonce publiée',
      message: 'Votre annonce est maintenant visible.',
    },
    'p2p/createOffer': {
      title: 'Offre P2P publiée',
      message: 'Votre offre est maintenant disponible.',
    },
    'parcels/requestParcelReservation': {
      title: 'Demande envoyée',
      message: 'Le transporteur a reçu votre demande de réservation.',
    },
    'parcels/createParcel': {
      title: 'Voyage publié',
      message: 'Votre trajet est maintenant visible.',
    },
    'finance/createReceipt': {
      title: 'Reçu enregistré',
      message: 'Le reçu est disponible dans votre profil.',
    },
    'account/reportPublisherSubscriber': {
      title: 'Signalement envoyé',
      message: 'La modération MOXT examinera ce dossier.',
    },
    'account/banPublisherSubscriber': {
      title: 'Abonné banni',
      message: "L'abonné ne pourra plus suivre vos publications.",
    },
    'account/removeSubscriberByPublisher': {
      title: 'Abonné retiré',
      message: "L'abonnement a été supprimé.",
    },
    'disputes/openDispute': {
      title: 'Réclamation enregistrée',
      message: 'Votre demande sera examinée.',
    },
    'transfers/createTransfer': {
      title: 'Transfert créé',
      message: "L'entreprise sélectionnée peut maintenant traiter l'opération.",
    },
  }
  if (successActions[action.type]) {
    store.dispatch(addToast({ ...successActions[action.type], tone: 'success' }))
  }

  if (action.type === 'marketplace/publishListing/fulfilled') {
    fanOutPublication(
      store,
      after,
      action.payload,
      'listing',
      'Nouvelle annonce',
      (id) => `/marketplace/${id}`,
      'high',
    )
  }

  if (action.type === 'jobs/createJob') {
    fanOutPublication(
      store,
      after,
      action.payload,
      'job',
      'Nouveau job',
      (id) => `/jobs/${id}`,
    )
  }

  if (action.type === 'events/createEvent') {
    fanOutPublication(
      store,
      after,
      action.payload,
      'event',
      'Nouvel événement',
      (id) => `/events/${id}`,
    )
  }

  if (action.type === 'parcels/createParcel') {
    fanOutPublication(
      store,
      after,
      action.payload,
      'parcel',
      'Nouveau colis',
      (id) => `/parcels/${id}`,
    )
  }

  if (action.type === 'posts/createPost') {
    fanOutPublication(
      store,
      after,
      action.payload,
      'post',
      'Nouvelle publication',
      () => '/news',
      'high',
    )
  }

  if (
    action.type.endsWith('/rejected') &&
    !['auth/login/rejected', 'auth/register/rejected'].includes(action.type)
  ) {
    const message =
      typeof action.payload === 'string'
        ? action.payload
        : action.error?.message || "L'action n'a pas pu être terminée."
    const rejectedTitles = {
      'auth/requestPhoneVerificationOtp/rejected': 'Envoi SMS impossible',
      'auth/requestPhoneLoginOtp/rejected': 'Envoi SMS impossible',
      'auth/confirmPhoneVerification/rejected': 'Vérification impossible',
    }
    store.dispatch(
      addToast({
        title: rejectedTitles[action.type] || 'Une erreur est survenue',
        message: sanitizeAuthMessage(message),
        tone: 'error',
      }),
    )
  }

  return result
  }
}
