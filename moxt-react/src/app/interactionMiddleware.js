import { addNotification } from '../features/communications/communicationSlice'
import { createReceipt } from '../features/finance/financeSlice'
import { TRANSFER_STATUS } from '../features/transfers/transferConfig'
import { addToast } from '../features/ui/uiSlice'

function notify(store, payload) {
  if (payload.userId) store.dispatch(addNotification(payload))
}

export const interactionMiddleware = (store) => (next) => (action) => {
  const before = store.getState()
  const result = next(action)
  const after = store.getState()
  const actorId = after.auth.user?.id

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

    // Créer un reçu quand le transfert est complété
    if (
      transfer?.status === TRANSFER_STATUS.COMPLETED &&
      !before.finance?.receipts?.some(
        (receipt) => receipt.relatedType === 'transfer' && receipt.relatedId === transfer.id,
      )
    ) {
      store.dispatch(
        createReceipt({
          userId: transfer.userId,
          relatedType: 'transfer',
          relatedId: transfer.id,
          title: `Recu transfert ${transfer.id}`,
          amount: transfer.totalToPay || transfer.amount,
          currency: transfer.fromCurrency,
          status: transfer.status,
          details: {
            direction: transfer.direction,
            exchanger: transfer.exchanger?.name,
            receivedAmount: transfer.receivedAmount,
            receivedCurrency: transfer.toCurrency,
            simulation: true,
          },
        }),
      )
    }
  }

  if (action.type === 'transfers/declarePayment') {
    const transferId = typeof action.payload === 'string' ? action.payload : action.payload.id
    const transfer = after.transfers.items.find((item) => item.id === transferId)
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

  const moderationDomains = {
    'businesses/moderateBusiness': ['businesses', '/businesses/', 'Entreprise'],
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

  if (
    action.type.endsWith('/rejected') &&
    !['auth/login/rejected', 'auth/register/rejected'].includes(action.type)
  ) {
    const message =
      typeof action.payload === 'string'
        ? action.payload
        : action.error?.message || "L'action n'a pas pu être terminée."
    store.dispatch(addToast({ title: 'Une erreur est survenue', message, tone: 'error' }))
  }

  return result
}
