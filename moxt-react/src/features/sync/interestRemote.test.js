import { describe, expect, it } from 'vitest'
import {
  eventRegistrationToRemoteRow,
  parcelRequestToRemoteRow,
} from './interestRemote'

describe('interestRemote', () => {
  it('mappe les demandes colis en snake_case', () => {
    expect(
      parcelRequestToRemoteRow({
        id: 'PREQ-1',
        parcelId: 'PAR-1',
        userId: 'u1',
        requesterName: 'Amina Diallo',
        ownerId: 'o1',
        businessId: 'BIZ-1',
        relatedType: 'parcel',
        relatedId: 'PAR-1',
        kg: 12,
        status: 'submitted',
        createdAt: '2026-07-20T10:00:00.000Z',
      }),
    ).toEqual({
      id: 'PREQ-1',
      parcel_id: 'PAR-1',
      user_id: 'u1',
      requester_name: 'Amina Diallo',
      owner_id: 'o1',
      business_id: 'BIZ-1',
      related_type: 'parcel',
      related_id: 'PAR-1',
      kg: 12,
      status: 'submitted',
      created_at: '2026-07-20T10:00:00.000Z',
      updated_at: '2026-07-20T10:00:00.000Z',
    })
  })

  it('mappe les inscriptions événement en snake_case', () => {
    expect(
      eventRegistrationToRemoteRow({
        id: 'REG-1',
        eventId: 'EVT-1',
        userId: 'u1',
        participantName: 'Amina Diallo',
        status: 'registered',
        createdAt: '2026-07-20T10:00:00.000Z',
      }),
    ).toMatchObject({
      event_id: 'EVT-1',
      participant_name: 'Amina Diallo',
      user_id: 'u1',
    })
  })
})
