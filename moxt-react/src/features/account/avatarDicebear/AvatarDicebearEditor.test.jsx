import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarDicebearEditor } from './AvatarDicebearEditor'

const uploadAvatar = vi.fn()
const updateProfileThunk = vi.fn()

vi.mock('../../../contexts/useLanguage', () => ({
  useLanguage: () => ({ language: 'fr', t: (key) => key }),
}))

vi.mock('../../../services/storageService', () => ({
  storageService: { uploadAvatar: (...args) => uploadAvatar(...args) },
}))

vi.mock('../../auth/authSlice', () => {
  const updateProfile = (details) => async () => updateProfileThunk(details)
  updateProfile.fulfilled = { match: (r) => r?.type === 'auth/updateProfile/fulfilled' }
  return {
    updateProfile,
    setUser: (payload) => ({ type: 'auth/setUser', payload }),
  }
})

vi.mock('./createLoreleiAvatar', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loreleiToPngFile: vi.fn(async () => new File(['png'], 'avatar.png', { type: 'image/png' })),
  }
})

function makeStore(actions) {
  return configureStore({
    reducer: {
      auth: () => ({
        user: {
          id: 'u-1',
          firstName: 'Ada',
          lastName: 'Lovelace',
          phone: '+79990000000',
          city: 'Moscou',
          originCountry: 'BJ',
          avatarUrl: '',
        },
      }),
      account: () => ({ preferences: {} }),
    },
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(() => (next) => (action) => {
        actions.push(action)
        return next(action)
      }),
  })
}

describe('AvatarDicebearEditor', () => {
  beforeEach(() => {
    uploadAvatar.mockReset()
    updateProfileThunk.mockReset()
  })

  it('affiche l’aperçu Lorelei et met à jour le teint', () => {
    const actions = []
    render(
      <Provider store={makeStore(actions)}>
        <AvatarDicebearEditor open onClose={() => {}} />
      </Provider>,
    )
    const preview = screen.getByAltText('profile.avatarEditor.previewAlt')
    const before = preview.getAttribute('src')
    expect(before.startsWith('data:image/svg+xml')).toBe(true)
    const swatches = screen.getAllByRole('radio', { name: /profile\.avatarEditor\.skinOption/ })
    const target = swatches.find((el) => el.getAttribute('aria-checked') === 'false')
    fireEvent.click(target)
    expect(target.getAttribute('aria-checked')).toBe('true')
    expect(preview.getAttribute('src')).not.toBe(before)
  })

  it('enregistre : upload PNG, avatar_url puis préférences avatarDicebear', async () => {
    const actions = []
    uploadAvatar.mockResolvedValue('https://cdn.moxt.test/avatars/u-1/avatar.png?v=1')
    updateProfileThunk.mockReturnValue({ type: 'auth/updateProfile/fulfilled' })
    const onClose = vi.fn()
    render(
      <Provider store={makeStore(actions)}>
        <AvatarDicebearEditor open onClose={onClose} />
      </Provider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /profile\.avatarEditor\.save/ }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(uploadAvatar).toHaveBeenCalledWith('u-1', expect.any(File), expect.any(Object))
    expect(updateProfileThunk).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Ada',
        avatarUrl: 'https://cdn.moxt.test/avatars/u-1/avatar.png?v=1',
      }),
    )
    const prefs = actions.find((a) => a.type === 'account/updateAccountPreferences')
    expect(prefs.payload.userId).toBe('u-1')
    expect(prefs.payload.preferences.avatarDicebear).toMatchObject({
      style: 'lorelei',
      avatarUrl: 'https://cdn.moxt.test/avatars/u-1/avatar.png?v=1',
    })
  })
})
