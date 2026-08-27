import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import businessesReducer, { moderateBusiness, saveBusiness } from '../features/businesses/businessSlice'
import communicationsReducer, { sendMessage } from '../features/communications/communicationSlice'
import financeReducer from '../features/finance/financeSlice'
import jobsReducer, { updateApplicationStatus } from '../features/jobs/jobSlice'
import parcelsReducer, { updateParcelRequestStatus } from '../features/parcels/parcelSlice'
import postsReducer, { createPost } from '../features/posts/postsSlice'
import transfersReducer, {
  createTransfer,
  declarePayment,
  declineTransferRequest,
  moderateTransfer,
  reassignTransferExchanger,
} from '../features/transfers/transferSlice'
import { DIRECTIONS, TRANSFER_STATUS } from '../features/transfers/transferConfig'
import uiReducer from '../features/ui/uiSlice'
import marketplaceReducer, {
  reportListing,
  updateListingStatus,
} from '../features/marketplace/marketplaceSlice'
import { supabase } from '../services/supabaseClient'
import { interactionMiddleware } from './interactionMiddleware'

describe('interactionMiddleware', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

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

  it('notifie les abonnés d’un nouveau post avec un lien précis vers ce post', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'author1' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        posts: postsReducer,
        jobs: () => ({ applications: [], items: [] }),
        events: () => ({ registrations: [], items: [] }),
        parcels: () => ({ items: [] }),
        businesses: () => ({ items: [] }),
        marketplace: () => ({ items: [] }),
        finance: () => ({ payments: [], receipts: [], walletEntries: [] }),
        account: () => ({
          subscriptions: [
            { userId: 'sub1', publisherType: 'user', publisherId: 'author1', notifyPref: 'all' },
          ],
        }),
      },
      preloadedState: {
        communications: { conversations: [], notifications: [], support: [] },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(
      createPost({
        id: 'POST-1',
        authorId: 'author1',
        authorName: 'Amina',
        message: 'Nouvelle publication',
      }),
    )

    const notifications = store.getState().communications.notifications
    expect(notifications).toHaveLength(1)
    expect(notifications[0].userId).toBe('sub1')
    expect(notifications[0].link).toBe('/news/POST-1')
  })

  it('n envoie pas de notification pour un post en attente de moderation', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'author1' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        posts: postsReducer,
        jobs: () => ({ applications: [], items: [] }),
        events: () => ({ registrations: [], items: [] }),
        parcels: () => ({ items: [] }),
        businesses: () => ({ items: [] }),
        marketplace: () => ({ items: [] }),
        finance: () => ({ payments: [], receipts: [], walletEntries: [] }),
        account: () => ({
          subscriptions: [
            { userId: 'sub1', publisherType: 'user', publisherId: 'author1', notifyPref: 'all' },
          ],
        }),
      },
      preloadedState: {
        communications: { conversations: [], notifications: [], support: [] },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(
      createPost({
        id: 'POST-2',
        authorId: 'author1',
        authorName: 'Amina',
        message: 'En attente',
        status: 'pending_review',
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
    store.dispatch(declarePayment({ id, actorId: 'client' }))
    store.dispatch(
      moderateTransfer({ id, status: TRANSFER_STATUS.RECEIVED, actorId: 'business-owner' }),
    )
    store.dispatch(
      moderateTransfer({
        id,
        status: TRANSFER_STATUS.PAID_OUT,
        actorId: 'business-owner',
        proof: { name: 'virement.pdf' },
      }),
    )
    store.dispatch(
      moderateTransfer({
        id,
        status: TRANSFER_STATUS.COMPLETED,
        actorId: 'admin',
        actorRole: 'admin',
      }),
    )

    expect(
      store
        .getState()
        .communications.notifications.some(
          (item) => item.userId === 'business-owner' && item.type === 'transfer',
        ),
    ).toBe(true)
    expect(
      store
        .getState()
        .communications.notifications.some(
          (item) =>
            item.userId === 'client' &&
            item.type === 'transfer' &&
            /virement|payout|versé|pay out|выполн|transferencia|transferência/i.test(
              `${item.title} ${item.message}`,
            ),
        ),
    ).toBe(true)
    expect(store.getState().finance.receipts[0]).toMatchObject({
      userId: 'client',
      relatedType: 'transfer',
      relatedId: id,
      simulation: true,
    })
  })

  it('notifie echangeur choisi, client et ancien partenaire lors d une reassignation', () => {
    const rpcMock = vi.fn(() => Promise.resolve({ data: 1, error: null }))
    vi.spyOn(supabase, 'rpc').mockImplementation(rpcMock)

    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'client' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        jobs: () => ({ applications: [], items: [] }),
        events: () => ({ registrations: [], items: [] }),
        parcels: () => ({ items: [], requests: [] }),
        businesses: () => ({
          items: [
            { id: 'biz-1', ownerId: 'owner-1', name: 'MOXT Change' },
            { id: 'biz-2', ownerId: 'owner-2', name: 'Pont Change' },
          ],
        }),
        marketplace: () => ({ items: [] }),
        finance: () => ({ payments: [], receipts: [], walletEntries: [] }),
        transfers: transfersReducer,
      },
      preloadedState: {
        communications: { conversations: [], notifications: [], support: [] },
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
          ownerId: 'owner-1',
          name: 'MOXT Change',
          rating: 4.9,
          averageDelay: '10 min',
          feePercent: 3,
          transferAcceptanceRequired: true,
        },
      }),
    )
    const id = store.getState().transfers.items[0].id
    store.dispatch(declineTransferRequest({ id, actorId: 'owner-1', actorRole: 'user' }))
    store.dispatch(
      reassignTransferExchanger({
        id,
        actorId: 'client',
        amount: 50000,
        rateOverride: 0.1,
        exchanger: {
          id: 'biz-2',
          ownerId: 'owner-2',
          name: 'Pont Change',
          feePercent: 5,
          rateReductionToRu: 2,
          transferAcceptanceRequired: true,
        },
      }),
    )

    const notifications = store.getState().communications.notifications
    expect(notifications.some((item) => item.userId === 'owner-2' && item.type === 'transfer')).toBe(
      true,
    )
    expect(notifications.some((item) => item.userId === 'client' && item.id?.includes('CLI'))).toBe(
      true,
    )
    expect(notifications.some((item) => item.userId === 'owner-1' && item.id?.includes('AWAY'))).toBe(
      true,
    )
    expect(rpcMock).toHaveBeenCalledWith(
      'moxt_notify_admins',
      expect.objectContaining({
        p_dedupe_key: expect.stringContaining(`trf-re-${id}`),
        p_type: 'transfer',
      }),
    )
  })

  it('notifie le proprietaire quand son entreprise est verifiee', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'admin', role: 'admin' } }),
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

  it('fan-out global meme si admin = proprietaire de l entreprise', () => {
    const rpcMock = vi.fn(() => Promise.resolve({ data: 1, error: null }))
    vi.spyOn(supabase, 'rpc').mockImplementation(rpcMock)

    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'owner-1', role: 'admin' } }),
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

    // Pas de notif locale propriétaire (acteur = owner), mais fan-out RPC obligatoire
    expect(store.getState().communications.notifications).toHaveLength(0)
    expect(rpcMock).toHaveBeenCalledWith(
      'moxt_notify_all_users',
      expect.objectContaining({
        p_dedupe_key: 'business-verified-biz-1',
        p_type: 'business',
        p_link: '/businesses/biz-1',
        p_priority: 'high',
      }),
    )
  })

  it('alerte les admins quand une entreprise est creee', () => {
    const rpcMock = vi.fn(() => Promise.resolve({ data: 1, error: null }))
    vi.spyOn(supabase, 'rpc').mockImplementation(rpcMock)

    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'owner-1', role: 'user' } }),
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
        businesses: { items: [], requests: [], members: [], documents: [] },
        communications: { conversations: [], notifications: [], support: [] },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(
      saveBusiness({
        ownerId: 'owner-1',
        name: 'Boutique Test',
        phone: '+79001234567',
        description: 'Test',
        services: [],
      }),
    )

    expect(rpcMock).toHaveBeenCalledWith(
      'moxt_notify_admins',
      expect.objectContaining({
        p_type: 'moderation',
        p_link: '/admin?view=businesses',
        p_priority: 'high',
      }),
    )
    const dedupe = rpcMock.mock.calls.find((call) => call[0] === 'moxt_notify_admins')?.[1]
      ?.p_dedupe_key
    expect(String(dedupe || '')).toMatch(/^business-pending-/)
  })

  it('ne renvoie pas de notification de verification si deja verifiee', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'admin', role: 'admin' } }),
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

  it('affiche un toast et notifie les admins apres un signalement annonce', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'reporter' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        jobs: () => ({ applications: [], items: [], reports: [] }),
        events: () => ({ registrations: [], items: [], reports: [] }),
        parcels: () => ({ items: [], requests: [] }),
        businesses: () => ({ items: [] }),
        marketplace: marketplaceReducer,
        account: () => ({ subscriberReports: [] }),
        administration: () => ({
          users: [{ id: 'admin-1', role: 'admin' }],
        }),
        finance: () => ({ payments: [], receipts: [], walletEntries: [] }),
      },
      preloadedState: {
        marketplace: {
          items: [{ id: 'ANN-1', ownerId: 'owner-1', title: 'Test' }],
          reports: [],
          filters: {},
          draft: null,
        },
        communications: { conversations: [], notifications: [], support: [] },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(
      reportListing({
        listingId: 'ANN-1',
        reporterId: 'reporter',
        reason: 'Contenu suspect',
      }),
    )

    expect(store.getState().ui.toasts[0]).toMatchObject({
      title: 'Signalement envoyé',
      tone: 'success',
    })
    expect(store.getState().communications.notifications[0]).toMatchObject({
      userId: 'admin-1',
      type: 'moderation',
      link: '/marketplace/ANN-1',
    })
  })

  it('archive en cascade les posts du fil lies a une annonce archivee', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'owner' } }),
        communications: communicationsReducer,
        ui: uiReducer,
        jobs: () => ({ applications: [], items: [], reports: [] }),
        events: () => ({ registrations: [], items: [], reports: [] }),
        parcels: () => ({ items: [], requests: [] }),
        businesses: () => ({ items: [] }),
        marketplace: marketplaceReducer,
        posts: postsReducer,
        finance: () => ({ payments: [], receipts: [], walletEntries: [] }),
      },
      preloadedState: {
        marketplace: {
          items: [{ id: 'ANN-1', ownerId: 'owner', title: 'Test', status: 'active' }],
          reports: [],
          filters: {},
          draft: null,
        },
        posts: {
          items: [
            {
              id: 'POST-1',
              sourceType: 'listing',
              sourceId: 'ANN-1',
              status: 'published',
              message: 'share',
            },
            {
              id: 'POST-2',
              sourceType: 'listing',
              sourceId: 'OTHER',
              status: 'published',
              message: 'other',
            },
            {
              id: 'POST-3',
              sourceType: 'free',
              sourceId: null,
              status: 'published',
              message: 'free',
            },
          ],
        },
        communications: { conversations: [], notifications: [], support: [] },
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(interactionMiddleware),
    })

    store.dispatch(updateListingStatus({ id: 'ANN-1', status: 'archived' }))

    const posts = store.getState().posts.items
    expect(posts.find((p) => p.id === 'POST-1').status).toBe('archived')
    expect(posts.find((p) => p.id === 'POST-2').status).toBe('published')
    expect(posts.find((p) => p.id === 'POST-3').status).toBe('published')
  })
})
