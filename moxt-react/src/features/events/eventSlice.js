import { createSlice } from '@reduxjs/toolkit'
import { createLocalStorage } from '../../services/createLocalStorage'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'

const eventsStorage = createLocalStorage('moxt-events-v1')
const registrationsStorage = createLocalStorage('moxt-event-registrations-v1')
const reportsStorage = createLocalStorage('moxt-event-reports-v1')

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    items: eventsStorage.read(),
    registrations: registrationsStorage.read(),
    reports: reportsStorage.read(),
  },
  reducers: {
    setAll(state, action) {
      const { items, registrations, reports } = action.payload
      if (items) state.items = mergeRemoteById(state.items, items)
      if (registrations) state.registrations = mergeRemoteById(state.registrations, registrations)
      if (reports) state.reports = mergeRemoteById(state.reports, reports)
    },
    createEvent: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            ...values,
            id: `EVT-${Date.now().toString(36).toUpperCase()}`,
            capacity: Number(values.capacity),
            price: Number(values.price),
            status: values.status || 'published',
            createdAt: new Date().toISOString(),
            expiresAt: values.startAt || null,
          },
        }
      },
    },
    registerForEvent: {
      reducer(state, action) {
        const duplicate = state.registrations.some(
          (item) =>
            item.eventId === action.payload.eventId &&
            item.userId === action.payload.userId &&
            item.status !== 'cancelled',
        )
        if (duplicate) return
        const count = state.registrations.filter(
          (item) => item.eventId === action.payload.eventId && item.status !== 'cancelled',
        ).length
        const event = state.items.find((item) => item.id === action.payload.eventId)
        if (!event || count >= event.capacity) return
        state.registrations.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            ...values,
            id: `REG-${Date.now().toString(36).toUpperCase()}`,
            status: 'registered',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateEvent(state, action) {
      const event = state.items.find((item) => item.id === action.payload.id)
      if (!event || event.ownerId !== action.payload.ownerId) return
      const { id: _id, ownerId: _o, createdAt: _c, ...changes } = action.payload
      Object.assign(event, changes, { updatedAt: new Date().toISOString() })
    },
    moderateEvent(state, action) {
      const event = state.items.find((item) => item.id === action.payload.id)
      if (!event) return
      event.status = action.payload.status
    },
    updateRegistrationStatus(state, action) {
      const registration = state.registrations.find((item) => item.id === action.payload.id)
      if (!registration) return
      registration.status = action.payload.status
      registration.updatedAt = new Date().toISOString()
    },
    cancelRegistration(state, action) {
      const registration = state.registrations.find(
        (item) => item.id === action.payload.id && item.userId === action.payload.userId,
      )
      if (!registration || registration.status === 'cancelled') return
      registration.status = 'cancelled'
      registration.updatedAt = new Date().toISOString()
    },
    reportEvent: {
      reducer(state, action) {
        const duplicate = state.reports.some(
          (item) =>
            item.eventId === action.payload.eventId &&
            item.reporterId === action.payload.reporterId &&
            item.status === 'new',
        )
        if (!duplicate) state.reports.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            ...values,
            id: `EREP-${Date.now().toString(36).toUpperCase()}`,
            status: 'new',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateEventReportStatus(state, action) {
      const report = state.reports.find((item) => item.id === action.payload.id)
      if (report) report.status = action.payload.status
    },
    expireEvents(state, action) {
      const now = new Date(action.payload || Date.now())
      state.items.forEach((event) => {
        if (event.status === 'published' && event.expiresAt && new Date(event.expiresAt) <= now) {
          event.status = 'archived'
        }
      })
    },
  },
})

export const {
  createEvent,
  cancelRegistration,
  expireEvents,
  moderateEvent,
  updateEvent,
  registerForEvent,
  reportEvent,
  updateRegistrationStatus,
  updateEventReportStatus,
  setAll,
} = eventSlice.actions
export default eventSlice.reducer
