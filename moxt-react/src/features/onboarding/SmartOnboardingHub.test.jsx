import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SmartOnboardingHub } from './SmartOnboardingHub'

vi.mock('../../contexts/useLanguage', () => ({
  useLanguage: () => ({ language: 'fr', t: (key) => key }),
}))

vi.mock('../../services/appReleaseService', () => ({
  appReleaseService: {
    getActiveRelease: vi.fn().mockResolvedValue({
      platform: 'android',
      downloadUrl: 'https://example.com/moxt-test.apk',
    }),
  },
}))

function renderHub(preloadedState = {}) {
  const store = configureStore({
    reducer: {
      auth: (state = { user: { id: 'u1', firstName: 'Jean', avatarUrl: '' } }) => state,
      businesses: (state = { items: [] }) => state,
      marketplace: (state = { userItems: [] }) => state,
      ui: (state = {}) => state,
    },
    preloadedState,
  })

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <SmartOnboardingHub />
      </MemoryRouter>
    </Provider>,
  )
}

describe('SmartOnboardingHub', () => {
  it('affiche le parcours de démarrage pour un utilisateur connecté', () => {
    renderHub()
    expect(screen.getByText('Parcours de réussite Moxt')).toBeTruthy()
    expect(screen.getByText('Installer Moxt sur votre téléphone')).toBeTruthy()
    expect(screen.getByText('Personnaliser votre Avatar')).toBeTruthy()
    expect(screen.getByText('Lancer votre Business ou Annonce')).toBeTruthy()
    expect(screen.getByText('Activer les alertes & messages')).toBeTruthy()
  })

  it('peut être réduit en pilule flottante', () => {
    renderHub()
    const minimizeBtn = screen.getByLabelText('Réduire')
    fireEvent.click(minimizeBtn)
    expect(screen.getByText('🚀 Booster mon compte')).toBeTruthy()
  })

  it('valide l’étape avatar si l’utilisateur possède un avatar personnalisé', () => {
    renderHub({
      auth: {
        user: {
          id: 'u2',
          firstName: 'Claire',
          avatarUrl: 'https://cdn.example.com/custom-portrait.jpg',
        },
      },
    })
    expect(screen.getByText('Profil attrayant et de confiance')).toBeTruthy()
  })
})
