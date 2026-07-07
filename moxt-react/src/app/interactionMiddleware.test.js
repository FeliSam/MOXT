import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it } from 'vitest'
import businessesReducer, { moderateBusiness } from '../features/businesses/businessSlice'
import communicationsReducer, { sendMessage } from '../features/communications/communicationSlice'
import financeReducer from '../features/finance/financeSlice'
import jobsReducer, { updateApplicationStatus } from '../features/jobs/jobSlice'
import parcelsReducer, { updateParcelRequestStatus } from '../features/parcels/parcelSlice'
import transfersReducer, {
  createTransfer,
  declarePayment,
  moderateTransfer,
} from '../features/transfers/transferSlice'
import { DIRECTIONS, TRANSFER_STATUS } from '../features/transfers/transferConfig'
import uiReducer from '../features/ui/uiSlice'
import { interactionMiddleware } from './interactionMiddleware'

describe('interactionMiddleware', () => {
  beforeEach(() => localStorage.clear())

  it('n ajoute pas de notification pour un message envoye', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'u1' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        jobs: () => ({ applications: [], items: [] }),
        events: () => ({ registrations: [], items: [] }),
        parcels: () => ({ items: [] }),
        businesses: () => ({ items: [] }),
        marketplace: () => ({ items: [] }),
        finance: () => ({ payments: [], receipts: [], walletEntries: [] }),
      },
      preloadedState: {
        communications: {
          conversations: [
            {
              id: 'c1',
              participantIds: ['u1', 'u2'],
              relatedType: 'listing',
              relatedId: 'a1',
              messages: [],
              unreadBy: {},
            },
          ],
          notifications: [],
          support: [],
        },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(
      sendMessage({
        conversationId: 'c1',
        senderId: 'u1',
        senderName: 'Amina',
        text: 'Bonjour',
      }),
    )

    expect(store.getState().communications.notifications).toHaveLength(0)
  })

  it('notifie le candidat quand son statut change', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'owner' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        jobs: jobsReducer,
        events: () => ({ registrations: [], items: [] }),
        parcels: () => ({ items: [], requests: [] }),
        businesses: () => ({ items: [] }),
        marketplace: () => ({ items: [] }),
        finance: () => ({ payments: [], receipts: [], walletEntries: [] }),
      },
      preloadedState: {
        jobs: {
          items: [{ id: 'job-1', ownerId: 'owner', title: 'Developpeur React' }],
          applications: [{ id: 'app-1', jobId: 'job-1', userId: 'candidate', status: 'submitted' }],
          reports: [],
        },
        communications: { conversations: [], notifications: [], support: [] },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(updateApplicationStatus({ id: 'app-1', status: 'accepted' }))

    expect(store.getState().communications.notifications[0]).toMatchObject({
      userId: 'candidate',
      type: 'job',
      link: '/jobs/job-1',
    })
  })

  it('notifie le demandeur colis quand la demande est traitee', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'owner' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        jobs: () => ({ applications: [], items: [] }),
        events: () => ({ registrations: [], items: [] }),
        parcels: parcelsReducer,
        businesses: () => ({ items: [] }),
        marketplace: () => ({ items: [] }),
        finance: () => ({ payments: [], receipts: [], walletEntries: [] }),
      },
      preloadedState: {
        parcels: {
          items: [
            {
              id: 'parcel-1',
              ownerId: 'owner',
              status: 'active',
              remainingKg: 10,
              capacityKg: 10,
              reservations: [],
            },
          ],
          requests: [
            {
              id: 'preq-1',
              parcelId: 'parcel-1',
              userId: 'client',
              ownerId: 'owner',
              kg: 2,
              status: 'submitted',
            },
          ],
        },
        communications: { conversations: [], notifications: [], support: [] },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(updateParcelRequestStatus({ id: 'preq-1', status: 'approved' }))

    expect(store.getState().communications.notifications[0]).toMatchObject({
      userId: 'client',
      type: 'parcel',
      link: '/parcels/parcel-1',
    })
  })

  it('notifie l entreprise au paiement declare et cree un recu a la finalisation', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'business-owner' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        jobs: () => ({ applications: [], items: [] }),
        events: () => ({ registrations: [], items: [] }),
        parcels: () => ({ items: [], requests: [] }),
        businesses: () => ({ items: [] }),
        marketplace: () => ({ items: [] }),
        finance: financeReducer,
        transfers: transfersReducer,
      },
      preloadedState: {
        communications: { conversations: [], notifications: [], support: [] },
        finance: { payments: [], receipts: [], walletEntries: [] },
        transfers: { items: [] },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(
      createTransfer({
        amount: 50000,
        direction: DIRECTIONS.BJ_TO_RU,
        user: { id: 'client' },
        sender: { firstName: 'Amina', lastName: 'Demo', phone: '+22901', method: 'MTN MoMo' },
        recipient: { firstName: 'Ivan', lastName: 'Demo', phone: '+7900', method: 'Sberbank' },
        exchanger: {
          id: 'biz-1',
          ownerId: 'business-owner',
          name: 'MOXT Change',
          rating: 4.9,
          averageDelay: '10 min',
          feePercent: 3,
        },
      }),
    )
    const id = store.getState().transfers.items[0].id
    store.dispatch(declarePayment(id))
    store.dispatch(moderateTransfer({ id, status: TRANSFER_STATUS.RECEIVED }))
    store.dispatch(moderateTransfer({ id, status: TRANSFER_STATUS.PAID_OUT }))
    store.dispatch(moderateTransfer({ id, status: TRANSFER_STATUS.COMPLETED }))

    expect(
      store
        .getState()
        .communications.notifications.some(
          (item) => item.userId === 'business-owner' && item.type === 'transfer',
        ),
    ).toBe(true)
    expect(store.getState().finance.receipts[0]).toMatchObject({
      userId: 'client',
      relatedType: 'transfer',
      relatedId: id,
      simulation: true,
    })
  })

  it('notifie le proprietaire quand son entreprise est verifiee', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'admin' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        jobs: () => ({ applications: [], items: [] }),
        events: () => ({ registrations: [], items: [] }),
        parcels: () => ({ items: [], requests: [] }),
        businesses: businessesReducer,
        marketplace: () => ({ items: [] }),
        finance: () => ({ payments: [], receipts: [], walletEntries: [] }),
      },
      preloadedState: {
        businesses: {
          items: [
            {
              id: 'biz-1',
              ownerId: 'owner-1',
              name: 'MOXT Change',
              status: 'pending_review',
            },
          ],
          requests: [],
        },
        communications: { conversations: [], notifications: [], support: [] },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(moderateBusiness({ id: 'biz-1', status: 'verified' }))

    expect(store.getState().communications.notifications[0]).toMatchObject({
      userId: 'owner-1',
      title: 'Entreprise vérifiée',
      type: 'business',
      link: '/businesses/biz-1',
    })
  })

  it('ne renvoie pas de notification de verification si deja verifiee', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'admin' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        jobs: () => ({ applications: [], items: [] }),
        events: () => ({ registrations: [], items: [] }),
        parcels: () => ({ items: [], requests: [] }),
        businesses: businessesReducer,
        marketplace: () => ({ items: [] }),
        finance: () => ({ payments: [], receipts: [], walletEntries: [] }),
      },
      preloadedState: {
        businesses: {
          items: [
            {
              id: 'biz-1',
              ownerId: 'owner-1',
              name: 'MOXT Change',
              status: 'verified',
            },
          ],
          requests: [],
        },
        communications: { conversations: [], notifications: [], support: [] },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(moderateBusiness({ id: 'biz-1', status: 'active' }))

    expect(store.getState().communications.notifications).toHaveLength(0)
  })
})
