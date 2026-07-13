import { describe, expect, it } from 'vitest'
import {
  canUserAccessTransfer,
  selectTransfersVisibleToUser,
} from './transferSelectors'

describe('transferSelectors', () => {
  const state = {
    businesses: {
      items: [{ id: 'BIZ-1', ownerId: 'owner-1' }],
    },
    transfers: {
      items: [
        { id: 'MXT-1', userId: 'client-1', businessId: 'BIZ-1', businessOwnerId: 'owner-1' },
        { id: 'MXT-2', userId: 'client-2', businessId: 'BIZ-2', businessOwnerId: 'owner-2' },
      ],
    },
  }

  it('expose les transferts envoyes et recus par entreprise', () => {
    expect(selectTransfersVisibleToUser(state, 'client-1').map((item) => item.id)).toEqual(['MXT-1'])
    expect(selectTransfersVisibleToUser(state, 'owner-1').map((item) => item.id)).toEqual(['MXT-1'])
  })

  it('autorise le proprietaire a ouvrir le detail', () => {
    const transfer = state.transfers.items[0]
    expect(canUserAccessTransfer(transfer, { id: 'owner-1' }, ['BIZ-1'])).toBe(true)
    expect(canUserAccessTransfer(transfer, { id: 'stranger' }, [])).toBe(false)
  })

  it('accepte les identifiants numeriques et texte', () => {
    const transfer = { id: 'MXT-3', userId: 42, businessId: 'BIZ-9', businessOwnerId: 99 }
    const mixedState = {
      businesses: { items: [{ id: 'BIZ-9', ownerId: '99' }] },
      transfers: { items: [transfer] },
    }

    expect(selectTransfersVisibleToUser(mixedState, '42').map((item) => item.id)).toEqual(['MXT-3'])
    expect(canUserAccessTransfer(transfer, { id: 42 }, ['BIZ-9'])).toBe(true)
  })
})
