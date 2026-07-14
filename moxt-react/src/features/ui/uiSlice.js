import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    sidebarCollapsed: false,
    /** Mobile conversation ouverte : masque header + bottom nav (posé par MessagesPage) */
    messageThreadImmersive: false,
    navigationGroups: {},
    toasts: [],
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    closeSidebar(state) {
      state.sidebarOpen = false
    },
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setMessageThreadImmersive(state, action) {
      state.messageThreadImmersive = Boolean(action.payload)
    },
    toggleNavigationGroup(state, action) {
      state.navigationGroups[action.payload] = !state.navigationGroups[action.payload]
    },

    addToast: {
      reducer(state, action) {
        const duplicate = state.toasts.some(
          (toast) =>
            toast.id === action.payload.id ||
            (toast.title === action.payload.title &&
              toast.message === action.payload.message &&
              toast.tone === action.payload.tone),
        )
        if (duplicate) return
        state.toasts.push(action.payload)
      },
      prepare({
        message,
        title,
        tone = 'info',
        link = null,
        engagement = false,
        id,
      }) {
        return {
          payload: {
            id: id || `TOAST-${Date.now().toString(36).toUpperCase()}`,
            message,
            title,
            tone,
            link,
            engagement,
          },
        }
      },
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload)
    },
  },
})

export const {
  addToast,
  closeSidebar,
  removeToast,
  setMessageThreadImmersive,
  toggleNavigationGroup,
  toggleSidebar,
  toggleSidebarCollapsed,
} = uiSlice.actions
export default uiSlice.reducer
