import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_AVATAR_SETTINGS } from '../../../config/avatarSettings'
import avatarSettingsReducer from '../../platform/avatarSettingsSlice'
import platformModulesReducer from '../../platform/platformModulesSlice'
import { AdminAvatarPanel } from './AdminAvatarPanel'

const remote = vi.hoisted(() => ({
  updateSettings: vi.fn(),
  updateFlags: vi.fn(),
}))

vi.mock('../../../contexts/useLanguage', () => ({
  useLanguage: () => ({ language: 'fr', t: (key) => key }),
}))
vi.mock('../../platform/avatarSettingsRemote', () => ({
  fetchAvatarSettings: async () => ({ config: {}, updatedAt: null, source: 'default' }),
  adminUpdateAvatarSettings: (config) => remote.updateSettings(config),
  fetchAvatarStyleStats: async () => ({ portrait: 4, lorelei: 2, photo: 7, none: 11, total: 24 }),
}))
vi.mock('../../platform/platformModulesRemote', () => ({
  fetchAppModuleFlags: async () => ({ flags: {}, updatedAt: null, source: 'default' }),
  adminUpdateAppModuleFlags: (flags) => remote.updateFlags(flags),
}))

function renderPanel() {
  const store = configureStore({
    reducer: {
      avatarSettings: avatarSettingsReducer,
      platformModules: platformModulesReducer,
      ui: (state = {}) => state,
    },
  })
  render(
    <Provider store={store}>
      <AdminAvatarPanel />
    </Provider>,
  )
  return store
}

const toggle = (label) => screen.getByRole('switch', { name: label })

describe('AdminAvatarPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    remote.updateSettings.mockReset().mockImplementation(async (config) => config)
    remote.updateFlags.mockReset().mockImplementation(async (flags) => flags)
  })

  it('affiche les défauts (comportement actuel) et la répartition des profils', async () => {
    renderPanel()
    expect(screen.getByText('Module Avatar')).toBeTruthy()
    expect(toggle('Module Avatar activé').getAttribute('aria-checked')).toBe('true')
    expect(toggle('Portrait (bibliothèque)').getAttribute('aria-checked')).toBe('true')
    expect(toggle('Illustré (Lorelei)').getAttribute('aria-checked')).toBe('true')
    expect(toggle('Photo perso').getAttribute('aria-checked')).toBe('true')
    expect(toggle('Badge « Avatar »').getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('spinbutton', { name: 'Nombre max d’affichages' }).value).toBe('3')
    expect(screen.getByRole('spinbutton', { name: 'Délai min entre deux (heures)' }).value).toBe(
      '12',
    )
    expect(screen.getByRole('spinbutton', { name: 'Délai avant affichage (secondes)' }).value).toBe(
      '3.5',
    )
    expect(await screen.findByText('24 profils')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Enregistrer l’avatar' }).disabled).toBe(true)
  })

  it('garde au moins un style actif', () => {
    renderPanel()
    fireEvent.click(toggle('Portrait (bibliothèque)'))
    fireEvent.click(toggle('Illustré (Lorelei)'))
    expect(toggle('Photo perso').getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(toggle('Photo perso'))
    expect(toggle('Photo perso').getAttribute('aria-checked')).toBe('true')
  })

  it('enregistre réglages + flag module via les RPC admin', async () => {
    const store = renderPanel()
    fireEvent.click(toggle('Module Avatar activé'))
    fireEvent.click(toggle('Badge « Avatar »'))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Nombre max d’affichages' }), {
      target: { value: '5' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’avatar' }))
    await waitFor(() => expect(remote.updateSettings).toHaveBeenCalled())
    expect(remote.updateFlags).toHaveBeenCalledWith(expect.objectContaining({ avatar: false }))
    expect(remote.updateSettings).toHaveBeenCalledWith({
      ...DEFAULT_AVATAR_SETTINGS,
      badgeEnabled: false,
      promptMaxShows: 5,
    })
    await waitFor(() => expect(store.getState().avatarSettings.config.promptMaxShows).toBe(5))
    expect(store.getState().platformModules.flags.avatar).toBe(false)
  })
})
