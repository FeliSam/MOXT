import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-recipient-addresses-v1')

function emptyIdentity() {
  return {
    firstNames: '',
    lastName: '',
    companyName: '',
    contactName: '',
    idType: 'PASSEPORT',
    passportNumber: '',
    issuedBy: '',
    issuedAt: '',
    expiresAt: '',
    scanMeta: null,
  }
}

function normalizeRecipient(row) {
  const now = new Date().toISOString()
  return {
    id: row.id || createId('RCP'),
    userId: row.userId,
    ownerType: row.ownerType === 'COMPANY' ? 'COMPANY' : 'PERSON',
    label: row.label?.trim() || '',
    country: row.country?.trim() || '',
    city: row.city?.trim() || '',
    addressLine: row.addressLine?.trim() || '',
    phone: row.phone?.trim() || '',
    email: row.email?.trim() || '',
    identity: { ...emptyIdentity(), ...(row.identity || {}) },
    identityProfileId: row.identityProfileId || null,
    createdAt: row.createdAt || now,
    updatedAt: row.updatedAt || now,
  }
}

const recipientAddressesSlice = createSlice({
  name: 'recipientAddresses',
  initialState: { items: storage.read() },
  reducers: {
    addRecipientAddress: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare(payload) {
        return { payload: normalizeRecipient(payload) }
      },
    },
    updateRecipientAddress(state, action) {
      const index = state.items.findIndex((item) => item.id === action.payload.id)
      if (index === -1) return
      state.items[index] = normalizeRecipient({
        ...state.items[index],
        ...action.payload,
        updatedAt: new Date().toISOString(),
      })
    },
    removeRecipientAddress(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    setRecipientAddresses(state, action) {
      state.items = (action.payload || []).map(normalizeRecipient)
    },
  },
})

export const {
  addRecipientAddress,
  updateRecipientAddress,
  removeRecipientAddress,
  setRecipientAddresses,
} = recipientAddressesSlice.actions

export default recipientAddressesSlice.reducer
