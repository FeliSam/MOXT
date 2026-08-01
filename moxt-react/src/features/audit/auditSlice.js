import { createSlice } from '@reduxjs/toolkit'

// L'audit reste en mémoire uniquement — ne pas persister des données d'action
// sensibles (transferts, auth) en localStorage non chiffré.
const auditSlice = createSlice({
  name: 'audit',
  initialState: { items: [], remoteItems: [] },
  reducers: {
    recordAudit(state, action) {
      state.items.unshift(action.payload)
      state.items = state.items.slice(0, 500)
    },
    clearAudit(state) {
      state.items = []
    },
    setRemoteAuditItems(state, action) {
      state.remoteItems = action.payload || []
    },
  },
})

export const { clearAudit, recordAudit, setRemoteAuditItems } = auditSlice.actions
export default auditSlice.reducer
