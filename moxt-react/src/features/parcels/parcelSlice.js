import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-parcels-v1')
const requestsStorage = createLocalStorage('moxt-parcel-requests-v1')

const parcelSlice = createSlice({
  name: 'parcels',
  initialState: { items: storage.read(), requests: requestsStorage.read() },
  reducers: {
    setAll(state, action) {
      Object.assign(state, action.payload)
    },
    createParcel: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare(values) {
        const now = new Date().toISOString()
        return {
          payload: {
            ...values,
            id: createId('COL'),
            capacityKg: Number(values.capacityKg),
            remainingKg: Number(values.capacityKg),
            pricePerKg: Number(values.pricePerKg),
            depositDeadline: values.depositDeadline || values.departureDate,
            status: 'active',
            proofStatus: 'pending_review',
            createdAt: now,
          },
        }
      },
    },
    updateParcelProofStatus(state, action) {
      const parcel = state.items.find((item) => item.id === action.payload.id)
      if (!parcel) return
      parcel.proofStatus = action.payload.status
      parcel.updatedAt = new Date().toISOString()
    },
    reserveParcel(state, action) {
      const { id, kg, userId } = action.payload
      const parcel = state.items.find((item) => item.id === id)
      if (!parcel || parcel.status !== 'active' || kg > parcel.remainingKg) return
      parcel.remainingKg -= kg
      parcel.reservations = [
        ...(parcel.reservations || []),
        { userId, kg, at: new Date().toISOString() },
      ]
      if (parcel.remainingKg === 0) parcel.status = 'full'
    },
    requestParcelReservation: {
      reducer(state, action) {
        const duplicate = state.requests.some(
          (item) =>
            item.parcelId === action.payload.parcelId &&
            item.userId === action.payload.userId &&
            item.status === 'submitted',
        )
        if (!duplicate) state.requests.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: createId('PREQ'),
            parcelId: values.parcelId,
            userId: values.userId,
            requesterName: values.requesterName,
            ownerId: values.ownerId,
            businessId: values.businessId || null,
            relatedType: 'parcel',
            relatedId: values.parcelId,
            kg: Number(values.kg),
            status: 'submitted',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateParcelRequestStatus(state, action) {
      const request = state.requests.find((item) => item.id === action.payload.id)
      if (!request) return
      const parcel = state.items.find((item) => item.id === request.parcelId)
      if (
        action.payload.status === 'approved' &&
        parcel &&
        parcel.status === 'active' &&
        request.kg <= parcel.remainingKg
      ) {
        parcel.remainingKg -= request.kg
        parcel.reservations = [
          ...(parcel.reservations || []),
          {
            requestId: request.id,
            userId: request.userId,
            kg: request.kg,
            at: new Date().toISOString(),
          },
        ]
        if (parcel.remainingKg === 0) parcel.status = 'full'
      }
      request.status = action.payload.status
      request.updatedAt = new Date().toISOString()
    },
    cancelParcelRequest(state, action) {
      const request = state.requests.find(
        (item) => item.id === action.payload.id && item.userId === action.payload.userId,
      )
      if (!request || ['cancelled', 'rejected'].includes(request.status)) return
      const parcel = state.items.find((item) => item.id === request.parcelId)
      if (request.status === 'approved' && parcel) {
        parcel.remainingKg = Math.min(parcel.capacityKg, parcel.remainingKg + request.kg)
        parcel.reservations = (parcel.reservations || []).filter((item) =>
          item.requestId
            ? item.requestId !== request.id
            : !(item.userId === request.userId && Number(item.kg) === Number(request.kg)),
        )
        if (parcel.status === 'full') parcel.status = 'active'
      }
      request.status = 'cancelled'
      request.updatedAt = new Date().toISOString()
    },
    updateParcelStatus(state, action) {
      const parcel = state.items.find((item) => item.id === action.payload.id)
      if (!parcel) return
      parcel.status = action.payload.status
      parcel.updatedAt = new Date().toISOString()
    },
    updateParcel(state, action) {
      const parcel = state.items.find((item) => item.id === action.payload.id)
      if (!parcel || parcel.ownerId !== action.payload.ownerId) return
      const { id: _id, ownerId: _o, createdAt: _c, ...changes } = action.payload
      Object.assign(parcel, changes, {
        capacityKg: Number(changes.capacityKg ?? parcel.capacityKg),
        pricePerKg: Number(changes.pricePerKg ?? parcel.pricePerKg),
        updatedAt: new Date().toISOString(),
      })
    },
  },
})

export const {
  createParcel,
  cancelParcelRequest,
  requestParcelReservation,
  reserveParcel,
  updateParcel,
  updateParcelProofStatus,
  updateParcelRequestStatus,
  updateParcelStatus,
  setAll,
} = parcelSlice.actions
export default parcelSlice.reducer
