import { createSlice } from '@reduxjs/toolkit'

// L'audit reste en mémoire uniquement — ne pas persister des données d'action
// sensibles (transferts, auth) en localStorage non chiffré.
const auditSlice = createSlice({
  name: 'audit',
  initialState: { items: [] },
  reducers: {
    recordAudit(state, action) {
      state.items.unshift(action.payload)
      state.items = state.items.slice(0, 500)
    },
    clearAudit(state) {
      state.items = []
    },
  },
})

export const { clearAudit, recordAudit } = auditSlice.actions
export default auditSlice.reducer
