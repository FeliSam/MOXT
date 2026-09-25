import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarDicebearEditor } from './AvatarDicebearEditor'
import { initialAvatarStyle } from './editorUtils'
import { defaultPortraitChoice, findPortrait } from './portraitOptions'

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

const USER = {
  id: 'u-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '+79990000000',
  city: 'Moscou',
  originCountry: 'BJ',
  avatarUrl: '',
}

function makeStore(actions, { user = USER, prefs = {}, avatarModule = null } = {}) {
  const moduleReducers = avatarModule
    ? {
        platformModules: () => ({ flags: { avatar: avatarModule.enabled !== false } }),
        avatarSettings: () => ({ config: avatarModule.settings || {} }),
      }
    : {}
  return configureStore({
    reducer: {
      auth: () => ({ user }),
      account: () => ({ preferences: { [user.id]: prefs } }),
      ...moduleReducers,
    },
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(() => (next) => (action) => {
        actions.push(action)
        return next(action)
      }),
  })
}

function renderEditor(actions = [], opts = {}, props = {}) {
  return render(
    <Provider store={makeStore(actions, opts)}>
      <AvatarDicebearEditor open onClose={() => {}} {...props} />
    </Provider>,
  )
}

const styleRadio = (name) =>
  screen.getByRole('radio', { name: new RegExp(`profile\\.avatarEditor\\.${name}`) })

describe('AvatarDicebearEditor — style Portrait (défaut)', () => {
  beforeEach(() => {
    localStorage.clear()
    uploadAvatar.mockReset()
    updateProfileThunk.mockReset()
  })

  it('affiche le portrait par défaut du userId et le met à jour au changement de teint', () => {
    renderEditor()
    expect(styleRadio('stylePortrait').getAttribute('aria-checked')).toBe('true')
    const expected = findPortrait(defaultPortraitChoice('u-1'))
    const preview = screen.getByAltText('profile.avatarEditor.previewAlt')
    expect(preview.getAttribute('src')).toBe(expected.url)
    const tones = screen.getAllByRole('radio', { name: /claire|olive|mate|brun/i })
    expect(tones).toHaveLength(6)
    const target = tones.find((el) => el.getAttribute('aria-checked') === 'false')
    fireEvent.click(target)
    expect(target.getAttribute('aria-checked')).toBe('true')
    expect(preview.getAttribute('src')).not.toBe(expected.url)
    expect(preview.getAttribute('src')).toMatch(
      /^https:\/\/cdn\.moxtapp\.ru\/avatars\/portraits\/v1\//,
    )
  })

  it('vignettes de coiffure = thumbs du genre / teint courant ; changement de genre', () => {
    renderEditor()
    const { gender } = defaultPortraitChoice('u-1')
    const other = gender === 'f' ? 'genderM' : 'genderF'
    fireEvent.click(styleRadio(other))
    const group = screen.getByRole('radiogroup', { name: 'profile.avatarEditor.sectionHair' })
    const imgs = group.querySelectorAll('img')
    expect(imgs).toHaveLength(5)
    const prefix = gender === 'f' ? '/thumbs/m-' : '/thumbs/f-'
    for (const img of imgs) expect(img.getAttribute('src')).toContain(prefix)
  })

  it('enregistre : avatar_url = URL CDN, sans upload, préférences avatarPortrait + style', async () => {
    const actions = []
    updateProfileThunk.mockReturnValue({ type: 'auth/updateProfile/fulfilled' })
    const onClose = vi.fn()
    renderEditor(actions, {}, { onClose })
    fireEvent.click(screen.getByRole('button', { name: /profile\.avatarEditor\.save/ }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const expected = findPortrait(defaultPortraitChoice('u-1'))
    expect(uploadAvatar).not.toHaveBeenCalled()
    expect(updateProfileThunk).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Ada', avatarUrl: expected.url }),
    )
    const prefs = actions.find((a) => a.type === 'account/updateAccountPreferences')
    expect(prefs.payload.preferences).toMatchObject({
      avatarStyle: 'portrait',
      avatarPortrait: { ...defaultPortraitChoice('u-1'), v: 1 },
      avatarPrompt: { done: true },
    })
  })

  it('restaure le portrait enregistré et désactive Enregistrer tant que rien ne change', () => {
    const url = 'https://cdn.moxtapp.ru/avatars/portraits/v1/m-t6-m-buzz.jpg'
    renderEditor([], { user: { ...USER, avatarUrl: url }, prefs: { avatarStyle: 'portrait' } })
    expect(screen.getByAltText('profile.avatarEditor.previewAlt').getAttribute('src')).toBe(url)
    expect(screen.getByRole('button', { name: /profile\.avatarEditor\.save/ }).disabled).toBe(true)
  })
})

describe('AvatarDicebearEditor — style Illustré (Lorelei)', () => {
  beforeEach(() => {
    localStorage.clear()
    uploadAvatar.mockReset()
    updateProfileThunk.mockReset()
  })

  it('restaure l’onglet Illustré depuis preferences.avatarStyle', () => {
    expect(initialAvatarStyle({ prefs: { avatarStyle: 'lorelei' }, avatarUrl: '' })).toBe('lorelei')
    expect(initialAvatarStyle({ prefs: {}, avatarUrl: '' })).toBe('portrait')
    renderEditor([], { prefs: { avatarStyle: 'lorelei' } })
    expect(styleRadio('styleIllustrated').getAttribute('aria-checked')).toBe('true')
  })

  it('aperçu Lorelei et teint, groupes par onglets', async () => {
    renderEditor()
    fireEvent.click(styleRadio('styleIllustrated'))
    const swatches = await screen.findAllByRole('radio', {
      name: /profile\.avatarEditor\.skinOption/,
    })
    const preview = screen.getByAltText('profile.avatarEditor.previewAlt')
    await waitFor(() => expect(preview.getAttribute('src')).toMatch(/^data:image\/svg\+xml/))
    const before = preview.getAttribute('src')
    const target = swatches.find((el) => el.getAttribute('aria-checked') === 'false')
    fireEvent.click(target)
    expect(target.getAttribute('aria-checked')).toBe('true')
    await waitFor(() => expect(preview.getAttribute('src')).not.toBe(before))
    fireEvent.click(screen.getByRole('tab', { name: /profile\.avatarEditor\.tabAccessories/ }))
    const glasses = screen.getByRole('switch', { name: /profile\.avatarEditor\.glasses/ })
    fireEvent.click(glasses)
    expect(glasses.getAttribute('aria-checked')).toBe('true')
  })

  it('enregistre : PNG → upload lorelei.png, avatar_url puis préférences avatarDicebear', async () => {
    const actions = []
    uploadAvatar.mockResolvedValue('https://cdn.moxt.test/avatars/u-1/lorelei.png?v=1')
    updateProfileThunk.mockReturnValue({ type: 'auth/updateProfile/fulfilled' })
    const onClose = vi.fn()
    renderEditor(actions, {}, { onClose })
    fireEvent.click(styleRadio('styleIllustrated'))
    await screen.findAllByRole('radio', { name: /profile\.avatarEditor\.skinOption/ })
    fireEvent.click(screen.getByRole('button', { name: /profile\.avatarEditor\.save/ }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(uploadAvatar).toHaveBeenCalledWith(
      'u-1',
      expect.any(File),
      expect.objectContaining({ name: 'lorelei' }),
    )
    expect(updateProfileThunk).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: 'https://cdn.moxt.test/avatars/u-1/lorelei.png?v=1' }),
    )
    const prefs = actions.find((a) => a.type === 'account/updateAccountPreferences')
    expect(prefs.payload.userId).toBe('u-1')
    expect(prefs.payload.preferences).toMatchObject({
      avatarStyle: 'lorelei',
      avatarDicebear: {
        style: 'lorelei',
        avatarUrl: 'https://cdn.moxt.test/avatars/u-1/lorelei.png?v=1',
      },
      avatarPrompt: { done: true },
    })
  })
})

describe('AvatarDicebearEditor — réglages du module Avatar (admin)', () => {
  beforeEach(() => localStorage.clear())

  it('module coupé : l’éditeur ne s’affiche pas', () => {
    const { container } = renderEditor([], { avatarModule: { enabled: false } })
    expect(container.innerHTML).toBe('')
    expect(screen.queryByAltText('profile.avatarEditor.previewAlt')).toBeNull()
  })

  it('Illustré désactivé : pas de sélecteur de style, portrait seul', () => {
    renderEditor([], {
      prefs: { avatarStyle: 'lorelei' },
      avatarModule: { settings: { loreleiEnabled: false } },
    })
    expect(
      screen.queryByRole('radio', { name: /profile\.avatarEditor\.styleIllustrated/ }),
    ).toBeNull()
    expect(screen.getByAltText('profile.avatarEditor.previewAlt').getAttribute('src')).toMatch(
      /^https:\/\/cdn\.moxtapp\.ru\/avatars\/portraits\/v1\//,
    )
  })

  it('style par défaut Illustré (admin) pour un profil sans avatar', () => {
    renderEditor([], { avatarModule: { settings: { defaultStyle: 'lorelei' } } })
    expect(styleRadio('styleIllustrated').getAttribute('aria-checked')).toBe('true')
    expect(initialAvatarStyle({ prefs: {}, avatarUrl: '', defaultStyle: 'lorelei' })).toBe(
      'lorelei',
    )
    expect(
      initialAvatarStyle({
        prefs: {},
        avatarUrl: '',
        defaultStyle: 'lorelei',
        styles: ['portrait'],
      }),
    ).toBe('portrait')
  })

  it('Photo perso désactivée : pas de lien « Photo à la place »', () => {
    renderEditor([], { avatarModule: { settings: { photoEnabled: false } } })
    expect(screen.queryByRole('button', { name: /profile\.avatarEditor\.photoInstead/ })).toBeNull()
  })

  it('défauts (ligne de réglages absente) : deux styles + lien photo', () => {
    renderEditor([], { avatarModule: { settings: {} } })
    expect(styleRadio('stylePortrait')).toBeTruthy()
    expect(styleRadio('styleIllustrated')).toBeTruthy()
    expect(screen.getByRole('button', { name: /profile\.avatarEditor\.photoInstead/ })).toBeTruthy()
  })
})
