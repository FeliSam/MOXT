import { createSlice } from '@reduxjs/toolkit'

export function createItemsSlice(name, initialState = { items: [] }) {
  const slice = createSlice({
    name,
    initialState,
    reducers: {
      setAll(state, action) {
        Object.assign(state, action.payload)
      },
    },
  })

  return {
    reducer: slice.reducer,
    setAll: slice.actions.setAll,
  }
}
