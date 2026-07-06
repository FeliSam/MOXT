import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it } from 'vitest'
import auditReducer from '../features/audit/auditSlice'
import authReducer from '../features/auth/authSlice'
import businessesReducer, { moderateBusiness } from '../features/businesses/businessSlice'
import { auditMiddleware } from './auditMiddleware'

describe('auditMiddleware', () => {
  it('journalise une action metier avec l acteur courant', () => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
        audit: auditReducer,
        businesses: businessesReducer,
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(auditMiddleware),
      preloadedState: {
        auth: {
          user: { id: 'admin', role: 'admin' },
          token: 'token',
          status: 'authenticated',
          error: null,
        },
        audit: { items: [] },
        businesses: {
          items: [{ id: 'b1', ownerId: 'u1', status: 'pending_review' }],
        },
      },
    })

    store.dispatch(moderateBusiness({ id: 'b1', status: 'verified' }))

    expect(store.getState().audit.items[0]).toMatchObject({
      action: 'businesses/moderateBusiness',
      actorId: 'admin',
      actorRole: 'admin',
      targetId: 'b1',
    })
  })
})
