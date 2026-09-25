import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProfileHeroCard } from './ProfileHeroCard'

vi.mock('../../../contexts/useLanguage', () => ({
  useLanguage: () => ({ language: 'fr', t: (key) => key }),
}))
vi.mock('../../referral/ReferralShareButton', () => ({ ReferralShareButton: () => null }))

const PORTRAIT = 'https://cdn.moxtapp.ru/avatars/portraits/v1/f-t2-f-bob.jpg'
const USER = {
  id: 'u-hero',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@moxt.test',
  role: 'user',
  verified: true,
  avatarUrl: PORTRAIT,
}

function renderHero({ moduleEnabled = true, settings = {} } = {}) {
  const store = configureStore({
    reducer: {
      auth: () => ({ user: USER }),
      account: () => ({ preferences: {} }),
      platformModules: () => ({ flags: { avatar: moduleEnabled } }),
      avatarSettings: () => ({ config: settings }),
    },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ProfileHeroCard user={USER} profileCompletion={100} />
      </MemoryRouter>
    </Provider>,
  )
}

const badge = () => screen.queryByText('profile.avatarEditor.portraitBadge')
const editButton = () => screen.queryByRole('button', { name: 'profile.avatarEditor.openAria' })

describe('ProfileHeroCard — module Avatar (admin)', () => {
  it('défaut : badge « Avatar » et bouton d’édition visibles', () => {
    renderHero()
    expect(badge()).toBeTruthy()
    expect(editButton()).toBeTruthy()
  })

  it('module coupé : ni badge ni éditeur (la photo actuelle reste affichée)', () => {
    renderHero({ moduleEnabled: false })
    expect(badge()).toBeNull()
    expect(editButton()).toBeNull()
    expect(screen.getByAltText('Ada Lovelace')).toBeTruthy()
  })

  it('badge désactivé : pas de badge, éditeur conservé', () => {
    renderHero({ settings: { badgeEnabled: false } })
    expect(badge()).toBeNull()
    expect(editButton()).toBeTruthy()
  })
})
