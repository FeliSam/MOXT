import { beforeEach, describe, expect, it } from 'vitest'
import reducer, {
  cancelRegistration,
  createEvent,
  registerForEvent,
  reportEvent,
  updateRegistrationStatus,
} from './eventSlice'

describe('eventSlice', () => {
  beforeEach(() => localStorage.clear())

  it('refuse les doublons et respecte la capacite', () => {
    const created = reducer(
      { items: [], registrations: [] },
      createEvent({ title: 'Atelier', capacity: 1, price: 0 }),
    )
    const eventId = created.items[0].id
    const first = reducer(created, registerForEvent({ eventId, userId: 'u1' }))
    const duplicate = reducer(first, registerForEvent({ eventId, userId: 'u1' }))
    const overflow = reducer(duplicate, registerForEvent({ eventId, userId: 'u2' }))
    expect(overflow.registrations).toHaveLength(1)
  })
  it('pointe un participant et évite les signalements en double', () => {
    const created = reducer(
      { items: [], registrations: [], reports: [] },
      createEvent({ title: 'Atelier', capacity: 2, price: 0 }),
    )
    const eventId = created.items[0].id
    const registered = reducer(created, registerForEvent({ eventId, userId: 'u1' }))
    const checked = reducer(
      registered,
      updateRegistrationStatus({ id: registered.registrations[0].id, status: 'checked_in' }),
    )
    const report = { eventId, reporterId: 'u2', reason: 'Vérifier' }
    const reported = reducer(checked, reportEvent(report))
    const duplicate = reducer(reported, reportEvent(report))
    expect(checked.registrations[0].status).toBe('checked_in')
    expect(duplicate.reports).toHaveLength(1)
  })
  it('libere une place apres annulation et autorise une nouvelle inscription', () => {
    const created = reducer(
      { items: [], registrations: [], reports: [] },
      createEvent({ title: 'Atelier', capacity: 1, price: 0 }),
    )
    const eventId = created.items[0].id
    const registered = reducer(created, registerForEvent({ eventId, userId: 'u1' }))
    const cancelled = reducer(
      registered,
      cancelRegistration({ id: registered.registrations[0].id, userId: 'u1' }),
    )
    const replacement = reducer(cancelled, registerForEvent({ eventId, userId: 'u2' }))

    expect(cancelled.registrations[0].status).toBe('cancelled')
    expect(replacement.registrations.filter((item) => item.status !== 'cancelled')).toHaveLength(1)
  })
})
