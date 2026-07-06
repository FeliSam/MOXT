import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-disputes-v1')

const disputeSlice = createSlice({
  name: 'disputes',
  initialState: { items: storage.read() },
  reducers: {
    setAll(state, action) {
      Object.assign(state, action.payload)
    },
    openDispute: {
      reducer(state, action) {
        const existing = state.items.find(
          (item) =>
            item.openedBy === action.payload.openedBy &&
            item.relatedType === action.payload.relatedType &&
            item.relatedId === action.payload.relatedId &&
            !['resolved', 'closed'].includes(item.status),
        )
        if (!existing) state.items.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: createId('DSP'),
            openedBy: values.openedBy,
            businessId: values.businessId || null,
            relatedType: values.relatedType,
            relatedId: values.relatedId,
            reason: values.reason.trim(),
            evidence: values.evidence || [],
            status: 'new',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateDisputeStatus(state, action) {
      const dispute = state.items.find((item) => item.id === action.payload.id)
      if (!dispute) return
      dispute.status = action.payload.status
      dispute.updatedAt = new Date().toISOString()
      dispute.updatedBy = action.payload.updatedBy
    },
    addDisputeEvidence(state, action) {
      const dispute = state.items.find((item) => item.id === action.payload.id)
      if (!dispute) return
      dispute.evidence.push({
        id: createId('EVD'),
        name: action.payload.name,
        size: Number(action.payload.size) || 0,
        type: action.payload.type,
        createdAt: new Date().toISOString(),
      })
    },
  },
})

export const { addDisputeEvidence, openDispute, updateDisputeStatus, setAll } = disputeSlice.actions
export default disputeSlice.reducer
