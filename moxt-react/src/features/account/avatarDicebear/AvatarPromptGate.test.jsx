import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarPromptGate } from './AvatarPromptGate'

vi.mock('./AvatarPromptSheet.jsx', () => ({
  default: () => <div>avatar-prompt-sheet</div>,
}))
vi.mock('./AvatarDicebearEditorLazy', () => ({ AvatarDicebearEditorLazy: () => null }))
vi.mock('../../onboarding/welcomeStorage', () => ({
  hasSeenWelcome: () => true,
  isTourPreview: () => false,
  isWelcomePending: () => false,
}))
vi.mock('../accountSlice', () => ({
  updateAccountPreferences: (payload) => ({ type: 'account/updatePreferences', payload }),
}))

const USER = { id: 'u-gate', avatarUrl: '' }

function renderGate({ moduleEnabled = true, settings = {}, prefs = {} } = {}) {
  const store = configureStore({
    reducer: {
      auth: () => ({ user: USER }),
      account: () => ({ preferences: { [USER.id]: prefs } }),
      platformModules: () => ({ flags: { avatar: moduleEnabled } }),
      avatarSettings: () => ({ config: settings }),
    },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/profile']}>
        <AvatarPromptGate />
      </MemoryRouter>
    </Provider>,
  )
}

async function advance(ms) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
}

describe('AvatarPromptGate — module Avatar (admin)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('défaut : invitation après 3,5 s', async () => {
    renderGate()
    await advance(3400)
    expect(screen.queryByText('avatar-prompt-sheet')).toBeNull()
    await advance(200)
    vi.useRealTimers()
    expect(await screen.findByText('avatar-prompt-sheet')).toBeTruthy()
  })

  it('délai avant affichage configurable', async () => {
    renderGate({ settings: { promptDelaySeconds: 1 } })
    await advance(1100)
    vi.useRealTimers()
    expect(await screen.findByText('avatar-prompt-sheet')).toBeTruthy()
  })

  it('module coupé : aucune invitation', async () => {
    renderGate({ moduleEnabled: false })
    await advance(10_000)
    expect(screen.queryByText('avatar-prompt-sheet')).toBeNull()
    expect(localStorage.getItem(`moxt-avatar-prompt:${USER.id}`)).toBeNull()
  })

  it('invitation désactivée dans le module : aucune invitation', async () => {
    renderGate({ settings: { promptEnabled: false } })
    await advance(10_000)
    expect(screen.queryByText('avatar-prompt-sheet')).toBeNull()
  })

  it('max d’affichages atteint (réglage admin = 1) : aucune invitation', async () => {
    renderGate({
      settings: { promptMaxShows: 1 },
      prefs: { avatarPrompt: { shown: 1, lastShownAt: '2020-01-01T00:00:00Z' } },
    })
    await advance(10_000)
    expect(screen.queryByText('avatar-prompt-sheet')).toBeNull()
  })
})
