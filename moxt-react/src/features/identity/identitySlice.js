import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-identity-profiles-v1')

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

function normalizeIdentity(identity = {}) {
  return {
    ...emptyIdentity(),
    ...identity,
    scanMeta: identity.scanMeta ?? null,
  }
}

function normalizeProfile(profile) {
  const now = new Date().toISOString()
  return {
    id: profile.id || createId('IDN'),
    userId: profile.userId,
    ownerType: profile.ownerType === 'COMPANY' ? 'COMPANY' : 'PERSON',
    identity: normalizeIdentity(profile.identity),
    createdAt: profile.createdAt || now,
    updatedAt: profile.updatedAt || now,
  }
}

const identitySlice = createSlice({
  name: 'identity',
  initialState: { profiles: storage.read() },
  reducers: {
    addIdentityProfile: {
      reducer(state, action) {
        state.profiles.unshift(action.payload)
      },
      prepare({ userId, ownerType, identity }) {
        const now = new Date().toISOString()
        return {
          payload: normalizeProfile({
            userId,
            ownerType,
            identity: normalizeIdentity(identity),
            createdAt: now,
            updatedAt: now,
          }),
        }
      },
    },
    updateIdentityProfile(state, action) {
      const index = state.profiles.findIndex((p) => p.id === action.payload.id)
      if (index === -1) return
      state.profiles[index] = normalizeProfile({
        ...state.profiles[index],
        ...action.payload,
        identity: normalizeIdentity({
          ...state.profiles[index].identity,
          ...action.payload.identity,
        }),
        updatedAt: new Date().toISOString(),
      })
    },
    removeIdentityProfile(state, action) {
      state.profiles = state.profiles.filter((p) => p.id !== action.payload)
    },
    setIdentityProfiles(state, action) {
      state.profiles = (action.payload || []).map(normalizeProfile)
    },
  },
})

export const {
  addIdentityProfile,
  updateIdentityProfile,
  removeIdentityProfile,
  setIdentityProfiles,
} = identitySlice.actions

export default identitySlice.reducer
