import { createSlice } from '@reduxjs/toolkit'

function mapDirectoryEntry(row) {
  if (!row?.id) return null
  const status = row.status || null
  return {
    id: String(row.id),
    firstName: row.firstName || row.first_name || '',
    lastName: row.lastName || row.last_name || '',
    verified: row.verified === true || status === 'verified',
    status,
  }
}

const profileDirectorySlice = createSlice({
  name: 'profileDirectory',
  initialState: { byId: {} },
  reducers: {
    setProfileDirectory(state, action) {
      const byId = {}
      for (const row of action.payload || []) {
        const entry = mapDirectoryEntry(row)
        if (entry) byId[entry.id] = entry
      }
      state.byId = byId
    },
    upsertProfileDirectoryEntries(state, action) {
      for (const row of action.payload || []) {
        const entry = mapDirectoryEntry(row)
        if (entry) state.byId[entry.id] = entry
      }
    },
  },
})

export { mapDirectoryEntry }
export const { setProfileDirectory, upsertProfileDirectoryEntries } = profileDirectorySlice.actions
export default profileDirectorySlice.reducer
