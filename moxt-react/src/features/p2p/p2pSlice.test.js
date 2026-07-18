import { beforeEach, describe, expect, it } from 'vitest'
import reducer, { acceptOffer, createOffer, updateOfferStatus } from './p2pSlice'
import { calculateP2PFee } from './p2pUtils'

const offerValues = {
  ownerId: 'seller',
  ownerName: 'Vendeur Demo',
  fromCurrency: 'XOF',
  toCurrency: 'RUB',
  amount: 10000,
  rate: 0.1,
  method: 'MTN MoMo',
}

describe('P2P', () => {
  beforeEach(() => localStorage.clear())

  it('applique les frais minimums', () => {
    expect(calculateP2PFee(1000, 'XOF')).toBe(250)
    expect(calculateP2PFee(1000, 'RUB')).toBe(25)
  })

  it('cree une transaction et ferme l offre acceptee', () => {
    const offered = reducer({ offers: [], orders: [] }, createOffer(offerValues))
    const offer = offered.offers[0]
    const accepted = reducer(
      offered,
      acceptOffer({
        offer,
        buyer: { id: 'buyer', firstName: 'Amina', lastName: 'Demo' },
      }),
    )

    expect(accepted.offers[0].status).toBe('accepted')
    expect(accepted.orders[0].offerId).toBe(offer.id)
    expect(accepted.orders[0].fee).toBe(250)
  })

  it('archive puis republie une offre', () => {
    const offered = reducer({ offers: [], orders: [] }, createOffer(offerValues))
    const offerId = offered.offers[0].id
    const archived = reducer(offered, updateOfferStatus({ id: offerId, status: 'archived' }))
    const republished = reducer(archived, updateOfferStatus({ id: offerId, status: 'active' }))

    expect(archived.offers[0].status).toBe('archived')
    expect(republished.offers[0].status).toBe('active')
  })
})
