import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  online: {},
}

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setOnlineUsers(state, action) {
      state.online = Object.fromEntries((action.payload || []).map((id) => [String(id), true]))
    },
    markUserOnline(state, action) {
      state.online[String(action.payload)] = true
    },
    markUserOffline(state, action) {
      delete state.online[String(action.payload)]
    },
  },
})

export const { setOnlineUsers, markUserOnline, markUserOffline } = presenceSlice.actions
export default presenceSlice.reducer
