import { describe, expect, it } from 'vitest'
import {
  computeP2PReputation,
  p2pOfferFromRemoteRow,
  p2pReceivedFromOffered,
  selectDashboardP2POffers,
} from './p2pRules.js'

describe('p2pRules (copie du web)', () => {
  it('fusionne le payload des offres', () => {
    const offer = p2pOfferFromRemoteRow({ id: 'o1', owner_id: 'u1', payload: { fromCurrency: 'RUB', method: 'MTN' } })
    expect(offer).toMatchObject({ id: 'o1', ownerId: 'u1', fromCurrency: 'RUB', method: 'MTN', status: 'active' })
  })

  it('filtre les offres actives par devises', () => {
    const list = selectDashboardP2POffers(
      [
        { id: 'a', status: 'active', fromCurrency: 'RUB', toCurrency: 'XOF', createdAt: '2026-01-01' },
        { id: 'b', status: 'active', fromCurrency: 'RUB', toCurrency: 'NGN', createdAt: '2026-01-02' },
        { id: 'c', status: 'archived', fromCurrency: 'RUB', toCurrency: 'XOF' },
      ],
      { currencies: ['RUB', 'XOF'] },
    )
    expect(list.map((o) => o.id)).toEqual(['a'])
  })

  it('calcule la réputation comme le web', () => {
    const stats = computeP2PReputation('u1', {
      orders: [
        { buyerId: 'u1', status: 'completed' },
        { sellerId: 'u1', status: 'cancelled' },
        { sellerId: 'u2', status: 'completed' },
      ],
      reviews: [{ targetId: 'u1', targetType: 'user_profile', rating: 5, status: 'published' }],
    })
    expect(stats).toEqual({ avgRating: 5, ratingCount: 1, completed: 1, total: 2, successRate: 50 })
    expect(p2pReceivedFromOffered(100, 6.5684)).toBe('656.84')
  })
})
