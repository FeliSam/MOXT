import { createSlice } from '@reduxjs/toolkit'
import { demoAccounts } from '../auth/authService'
import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-administration-v1')
const defaultUsers = demoAccounts.map(({ user }) => ({
  ...user,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
}))

const administrationSlice = createSlice({
  name: 'administration',
  initialState: storage.read({ users: defaultUsers }),
  reducers: {
    registerAdministrativeUser(state, action) {
      if (!state.users.some((item) => item.id === action.payload.id)) {
        state.users.unshift({ ...action.payload, status: 'active' })
      }
    },
    updateUserRole(state, action) {
      const user = state.users.find((item) => item.id === action.payload.id)
      if (!user || !['user', 'professional', 'admin', 'superadmin'].includes(action.payload.role))
        return
      user.role = action.payload.role
      user.updatedAt = new Date().toISOString()
    },
    updateUserStatus(state, action) {
      const user = state.users.find((item) => item.id === action.payload.id)
      if (!user || !['active', 'suspended'].includes(action.payload.status)) return
      user.status = action.payload.status
      user.updatedAt = new Date().toISOString()
    },
  },
})

export const { registerAdministrativeUser, updateUserRole, updateUserStatus } =
  administrationSlice.actions
export default administrationSlice.reducer
