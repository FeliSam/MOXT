import { createSlice } from '@reduxjs/toolkit'
import { matchUserId } from '../businesses/businessVisibility'
import { TRANSFER_CONFIG, TRANSFER_STATUS, TRANSFER_TRANSITIONS } from './transferConfig'
import { transferStorage } from './transferStorage'
import { calculateTransfer } from './transferUtils'

const initialState = {
  items: transferStorage.read(),
}

const transferSlice = createSlice({
  name: 'transfers',
  initialState,
  reducers: {
    setAll(state, action) {
      Object.assign(state, action.payload)
    },
    createTransfer: {
      reducer(state, action) {
        if (action.payload.blocked) return
        state.items.unshift(action.payload)
      },
      prepare({
        amount,
        direction,
        exchanger,
        originCountry,
        rateDate,
        rateOverride,
        rateSource,
        recipient,
        sender,
        user,
      }) {
        if (!exchanger || matchUserId(exchanger.ownerId, user.id)) {
          return { payload: { blocked: true, reason: 'self_business_transfer' } }
        }
        const calculation = calculateTransfer(
          amount,
          direction,
          exchanger.feePercent,
          rateOverride,
          originCountry,
        )
        const createdAt = new Date().toISOString()
        return {
          payload: {
            id: `MXT-${Date.now().toString(36).toUpperCase()}`,
            userId: user.id,
            originCountry: originCountry || user.originCountry || user.country || 'BJ',
            businessId: exchanger.id,
            businessOwnerId: exchanger.ownerId || null,
            status: TRANSFER_STATUS.PENDING,
            direction,
            ...calculation,
            rateDate: rateDate || null,
            rateSource: rateSource || calculation.rateSource,
            sender,
            recipient,
            exchanger: {
              id: exchanger.id,
              name: exchanger.name,
              rating: exchanger.rating,
              averageDelay: exchanger.averageDelay,
              paymentAccount: exchanger.paymentAccount,
              paymentDetails: exchanger.paymentDetails || null,
            },
            paymentProof: null,
            createdAt,
            updatedAt: createdAt,
            paymentDeadlineAt: new Date(
              Date.now() + TRANSFER_CONFIG.paymentWindowMinutes * 60000,
            ).toISOString(),
            timeline: [{ status: TRANSFER_STATUS.PENDING, at: createdAt }],
          },
        }
      },
    },
    declarePayment(state, action) {
      const payload =
        typeof action.payload === 'string' ? { id: action.payload, proof: null } : action.payload
      const transfer = state.items.find((item) => item.id === payload.id)
      if (!transfer || transfer.status !== TRANSFER_STATUS.PENDING) return
      transfer.status = TRANSFER_STATUS.DECLARED
      transfer.paymentProof = payload.proof || null
      transfer.updatedAt = new Date().toISOString()
      transfer.timeline.push({
        status: TRANSFER_STATUS.DECLARED,
        at: transfer.updatedAt,
        proofName: payload.proof?.name,
      })
    },
    cancelTransfer(state, action) {
      const transfer = state.items.find((item) => item.id === action.payload)
      if (
        !transfer ||
        ![TRANSFER_STATUS.PENDING, TRANSFER_STATUS.DECLARED].includes(transfer.status)
      )
        return
      transfer.status = TRANSFER_STATUS.CANCELLED
      transfer.updatedAt = new Date().toISOString()
      transfer.timeline.push({ status: TRANSFER_STATUS.CANCELLED, at: transfer.updatedAt })
    },
    moderateTransfer(state, action) {
      const transfer = state.items.find((item) => item.id === action.payload.id)
      if (!transfer) return
      const expectedStatus = TRANSFER_TRANSITIONS[transfer.status]
      if (!expectedStatus || action.payload.status !== expectedStatus) return
      if (expectedStatus === TRANSFER_STATUS.PAID_OUT && !action.payload.proof) return
      transfer.status = expectedStatus
      if (action.payload.proof) transfer.businessProof = action.payload.proof
      transfer.updatedAt = new Date().toISOString()
      transfer.timeline ||= []
      transfer.timeline.push({
        status: expectedStatus,
        at: transfer.updatedAt,
        actorType: 'business',
        actorId: action.payload.actorId || transfer.businessOwnerId,
        note: action.payload.note || '',
        proofName: action.payload.proof?.name,
      })
    },
    receiveTransfer(state, action) {
      const transfer = state.items.find((item) => item.id === action.payload.id)
      if (!transfer) return
      if (!transfer.businessProof || transfer.status !== TRANSFER_STATUS.PAID_OUT) return
      transfer.receivedAmount = action.payload.receivedAmount
      transfer.receivedMethod = action.payload.receivedMethod
      transfer.receivedProof = action.payload.receivedProof || null
      transfer.receivedAt = action.payload.receivedAt
      transfer.updatedAt = action.payload.receivedAt
      transfer.status = TRANSFER_STATUS.COMPLETED
      transfer.timeline ||= []
      transfer.timeline.push({
        status: 'received',
        at: action.payload.receivedAt,
        amount: action.payload.receivedAmount,
        method: action.payload.receivedMethod,
      })
      transfer.timeline.push({
        status: TRANSFER_STATUS.COMPLETED,
        at: action.payload.receivedAt,
      })
    },
    expireOverdueTransfers(state, action) {
      const now = new Date(action.payload || Date.now()).getTime()
      state.items.forEach((transfer) => {
        if (
          transfer.status === TRANSFER_STATUS.PENDING &&
          new Date(transfer.paymentDeadlineAt).getTime() <= now
        ) {
          transfer.status = TRANSFER_STATUS.EXPIRED
          transfer.updatedAt = new Date(now).toISOString()
          transfer.timeline.push({ status: TRANSFER_STATUS.EXPIRED, at: transfer.updatedAt })
        }
      })
    },
  },
})

export const {
  cancelTransfer,
  createTransfer,
  declarePayment,
  expireOverdueTransfers,
  moderateTransfer,
  receiveTransfer,
  setAll,
} = transferSlice.actions
export default transferSlice.reducer
