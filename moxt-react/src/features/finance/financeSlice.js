import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'

const storage = createLocalStorage('moxt-finance-v1')

const financeSlice = createSlice({
  name: 'finance',
  initialState: storage.read({ payments: [], receipts: [], walletEntries: [] }),
  reducers: {
    setAll(state, action) {
      const { payments, walletEntries, receipts } = action.payload
      if (payments) state.payments = mergeRemoteById(state.payments, payments)
      if (walletEntries) state.walletEntries = mergeRemoteById(state.walletEntries, walletEntries)
      if (receipts) state.receipts = mergeRemoteById(state.receipts, receipts)
    },
    createSimulatedPayment: {
      reducer(state, action) {
        const duplicate = state.payments.find(
          (item) =>
            item.userId === action.payload.userId &&
            item.relatedType === action.payload.relatedType &&
            item.relatedId === action.payload.relatedId,
        )
        if (!duplicate) state.payments.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: createId('PAY'),
            userId: values.userId,
            relatedType: values.relatedType,
            relatedId: values.relatedId,
            amount: Number(values.amount),
            currency: values.currency,
            provider: values.provider || 'MOXT Demo',
            status: values.status || 'pending',
            simulation: true,
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateSimulatedPaymentStatus(state, action) {
      const payment = state.payments.find((item) => item.id === action.payload.id)
      if (!payment) return
      payment.status = action.payload.status
      payment.updatedAt = new Date().toISOString()
    },
    createReceipt: {
      reducer(state, action) {
        const duplicate = state.receipts.find(
          (item) =>
            item.userId === action.payload.userId &&
            item.relatedType === action.payload.relatedType &&
            item.relatedId === action.payload.relatedId,
        )
        if (!duplicate) state.receipts.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: createId('REC'),
            userId: values.userId,
            relatedType: values.relatedType,
            relatedId: values.relatedId,
            title: values.title,
            amount: Number(values.amount),
            currency: values.currency,
            status: values.status,
            details: values.details || {},
            simulation: true,
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    addWalletEntry: {
      reducer(state, action) {
        state.walletEntries.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: createId('WAL'),
            userId: values.userId,
            direction: values.direction,
            amount: Number(values.amount),
            currency: values.currency,
            label: values.label,
            relatedType: values.relatedType,
            relatedId: values.relatedId,
            simulation: true,
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
  },
})

export const {
  addWalletEntry,
  createReceipt,
  createSimulatedPayment,
  updateSimulatedPaymentStatus,
  setAll,
} = financeSlice.actions
export default financeSlice.reducer
