import { describe, expect, it } from 'vitest'
import { p2pOfferFromRemoteRow, p2pOrderToRemoteRow, reportToRemoteRow } from './entityRemote'

describe('entityRemote', () => {
  it('mappe un signalement annonce', () => {
    const row = reportToRemoteRow(
      { id: 'REP-1', listingId: 'ANN-1', reporterId: 'u1', reason: 'spam' },
      'listing_id',
    )
    expect(row.listing_id).toBe('ANN-1')
    expect(row.reporter_id).toBe('u1')
  })

  it('mappe une commande P2P avec proofs et ratings', () => {
    const row = p2pOrderToRemoteRow({
      id: 'ORD-1',
      offerId: 'P2P-1',
      buyerId: 'b1',
      sellerId: 's1',
      amount: 100,
      fromCurrency: 'RUB',
      toCurrency: 'XOF',
      rate: 7,
      fee: 2,
      status: 'completed',
      proofs: [{ id: 'P1' }],
      ratings: [{ userId: 'b1', rating: 5 }],
      timeline: [{ status: 'created', at: '2026-01-01' }],
    })
    expect(row.proofs).toHaveLength(1)
    expect(row.ratings[0].rating).toBe(5)
  })

  it("restaure les détails métier d'une offre P2P distante", () => {
    const offer = p2pOfferFromRemoteRow({
      id: 'P2P-1',
      owner_id: 'u1',
      status: 'archived',
      payload: {
        businessId: 'BIZ-1',
        method: 'Mobile Money',
        comment: 'Sur rendez-vous',
        status: 'active',
      },
    })

    expect(offer.businessId).toBe('BIZ-1')
    expect(offer.method).toBe('Mobile Money')
    expect(offer.status).toBe('archived')
  })
})
