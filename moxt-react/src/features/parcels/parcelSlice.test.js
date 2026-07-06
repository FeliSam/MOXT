import { beforeEach, describe, expect, it } from 'vitest'
import reducer, {
  cancelParcelRequest,
  createParcel,
  requestParcelReservation,
  reserveParcel,
  updateParcelRequestStatus,
} from './parcelSlice'

const parcel = {
  ownerId: 'owner',
  ownerName: 'Transporteur',
  origin: 'Cotonou',
  destination: 'Moscou',
  departureDate: '2030-01-01',
  capacityKg: 10,
  pricePerKg: 900,
  currency: 'RUB',
  contact: '+22901',
  conditions: 'Conditions du transport.',
}

describe('parcelSlice', () => {
  beforeEach(() => localStorage.clear())

  it('initialise la capacite restante', () => {
    const state = reducer({ items: [] }, createParcel(parcel))
    expect(state.items[0].remainingKg).toBe(10)
  })

  it('reserve une partie de la capacite puis marque le voyage complet', () => {
    const created = reducer({ items: [] }, createParcel(parcel))
    const id = created.items[0].id
    const partial = reducer(created, reserveParcel({ id, kg: 4, userId: 'u2' }))
    const full = reducer(partial, reserveParcel({ id, kg: 6, userId: 'u3' }))

    expect(partial.items[0].remainingKg).toBe(6)
    expect(full.items[0].status).toBe('full')
  })
  it('restaure uniquement la capacite de la demande annulee', () => {
    const created = reducer({ items: [], requests: [] }, createParcel(parcel))
    const parcelId = created.items[0].id
    const requested = reducer(
      created,
      requestParcelReservation({
        parcelId,
        userId: 'u2',
        ownerId: 'owner',
        requesterName: 'Client',
        kg: 4,
      }),
    )
    const approved = reducer(
      requested,
      updateParcelRequestStatus({ id: requested.requests[0].id, status: 'approved' }),
    )
    const withIndependentReservation = reducer(
      approved,
      reserveParcel({ id: parcelId, kg: 2, userId: 'u2' }),
    )
    const cancelled = reducer(
      withIndependentReservation,
      cancelParcelRequest({ id: requested.requests[0].id, userId: 'u2' }),
    )

    expect(cancelled.items[0].remainingKg).toBe(8)
    expect(cancelled.items[0].reservations).toHaveLength(1)
    expect(cancelled.requests[0].status).toBe('cancelled')
  })
})
