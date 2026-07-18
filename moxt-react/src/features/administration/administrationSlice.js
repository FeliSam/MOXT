import { createSlice } from '@reduxjs/toolkit'
import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-administration-v1')

function profileRowToAdminUser(row) {
  if (!row) return null
  const status = ['suspended', 'pending_deletion'].includes(row.status)
    ? row.status
    : row.status === 'verified'
      ? 'active'
      : row.status || 'active'
  return {
    id: row.id,
    firstName: row.first_name || row.firstName || '',
    lastName: row.last_name || row.lastName || '',
    email: row.email || '',
    phone: row.phone || '',
    city: row.city || '',
    originCountry: row.origin_country || row.originCountry || '',
    country: row.country || '',
    role: row.role || 'user',
    status,
    verified: row.status === 'verified',
    createdAt: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null,
  }
}

const administrationSlice = createSlice({
  name: 'administration',
  initialState: storage.read({ users: [] }),
  reducers: {
    setAdminUsers(state, action) {
      state.users = action.payload
    },
    registerAdministrativeUser(state, action) {
      if (!state.users.some((item) => item.id === action.payload.id)) {
        state.users.unshift({ ...action.payload, status: action.payload.status || 'active' })
      }
    },
    updateUserRole(state, action) {
      const user = state.users.find((item) => item.id === action.payload.id)
      if (
        !user ||
        !['user', 'professional', 'moderator', 'admin', 'superadmin'].includes(action.payload.role)
      ) {
        return
      }
      user.role = action.payload.role
      user.updatedAt = new Date().toISOString()
    },
    updateUserStatus(state, action) {
      const user = state.users.find((item) => item.id === action.payload.id)
      if (!user || !['active', 'suspended', 'pending_deletion'].includes(action.payload.status)) {
        return
      }
      user.status = action.payload.status
      user.updatedAt = new Date().toISOString()
    },
    updateUserOriginCountry(state, action) {
      const user = state.users.find((item) => item.id === action.payload.id)
      if (!user || !action.payload.originCountry) return
      user.originCountry = action.payload.originCountry
      user.updatedAt = new Date().toISOString()
    },
  },
})

export { profileRowToAdminUser }
export const {
  setAdminUsers,
  registerAdministrativeUser,
  updateUserRole,
  updateUserStatus,
  updateUserOriginCountry,
} = administrationSlice.actions
export default administrationSlice.reducer
