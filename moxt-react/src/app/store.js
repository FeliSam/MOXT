import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import uiReducer from '../features/ui/uiSlice'
import transfersReducer from '../features/transfers/transferSlice'
import businessesReducer from '../features/businesses/businessSlice'
import parcelsReducer from '../features/parcels/parcelSlice'
import p2pReducer from '../features/p2p/p2pSlice'
import marketplaceReducer from '../features/marketplace/marketplaceSlice'
import jobsReducer from '../features/jobs/jobSlice'
import eventsReducer from '../features/events/eventSlice'
import communicationsReducer from '../features/communications/communicationSlice'
import auditReducer from '../features/audit/auditSlice'
import accountReducer from '../features/account/accountSlice'
import administrationReducer from '../features/administration/administrationSlice'
import reviewsReducer from '../features/reviews/reviewSlice'
import postsReducer from '../features/posts/postsSlice'
import disputesReducer from '../features/disputes/disputeSlice'
import financeReducer from '../features/finance/financeSlice'
import identityReducer from '../features/identity/identitySlice'
import recipientAddressesReducer from '../features/addresses/recipientAddressesSlice'
import { auditMiddleware } from './auditMiddleware'
import { persistenceMiddleware } from './persistenceMiddleware'
import { interactionMiddleware } from './interactionMiddleware'
import { supabaseMiddleware } from './supabaseMiddleware'
import { engagementToastMiddleware } from './engagementToastMiddleware'
import { baseApi } from '../services/baseApi'

export const store = configureStore({
  reducer: {
    account: accountReducer,
    administration: administrationReducer,
    auth: authReducer,
    ui: uiReducer,
    transfers: transfersReducer,
    businesses: businessesReducer,
    disputes: disputesReducer,
    finance: financeReducer,
    identity: identityReducer,
    recipientAddresses: recipientAddressesReducer,
    parcels: parcelsReducer,
    p2p: p2pReducer,
    posts: postsReducer,
    reviews: reviewsReducer,
    marketplace: marketplaceReducer,
    jobs: jobsReducer,
    events: eventsReducer,
    communications: communicationsReducer,
    audit: auditReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['meta.arg.files'],
      },
    }).concat(
      baseApi.middleware,
      auditMiddleware,
      interactionMiddleware,
      persistenceMiddleware,
      supabaseMiddleware,
      engagementToastMiddleware,
    ),
})
