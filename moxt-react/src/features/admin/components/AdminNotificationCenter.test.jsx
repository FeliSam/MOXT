import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'
import { AdminNotificationCenter } from './AdminNotificationCenter'

vi.mock('../../../contexts/useLanguage', () => ({
  useLanguage: () => ({ language: 'fr', t: (key) => key }),
}))

vi.mock('../../../services/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: { recipientCount: 2 }, error: null }),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [] }),
        })),
      })),
    })),
  },
}))

function renderCenter() {
  const store = configureStore({
    reducer: {
      administration: () => ({
        users: [
          { id: 'u1', firstName: 'Alice', lastName: 'Dupont', role: 'user', country: 'RU', status: 'active' },
          { id: 'u2', firstName: 'Bob', lastName: 'Pro', role: 'professional', country: 'CM', status: 'active' },
          { id: 'u3', firstName: 'Charlie', lastName: 'Mod', role: 'moderator', country: 'RU', status: 'active' },
        ],
      }),
      auth: () => ({ user: { id: 'admin1', role: 'admin' } }),
      ui: (state = {}) => state,
    },
  })

  return render(
    <Provider store={store}>
      <AdminNotificationCenter />
    </Provider>,
  )
}

describe('AdminNotificationCenter', () => {
  it('affiche le formulaire de composition et calcule l’audience estimée', () => {
    renderCenter()
    expect(screen.getByText('Centre de diffusions & alertes')).toBeTruthy()
    // By default target is 'all', so 3 active users
    expect(screen.getAllByText('Audience estimée : 3 utilisateur(s)').length).toBeGreaterThan(0)
  })

  it('filtre l’audience estimée par rôle', () => {
    renderCenter()
    const rolePill = screen.getByText('Par rôle utilisateur')
    fireEvent.click(rolePill)
    // By default selected role is 'user' -> 1 user (Alice)
    expect(screen.getAllByText('Audience estimée : 1 utilisateur(s)').length).toBeGreaterThan(0)

    // Switch to 'Professionnels' -> 1 user (Bob)
    const proBtn = screen.getByText('Professionnels')
    fireEvent.click(proBtn)
    expect(screen.getAllByText('Audience estimée : 1 utilisateur(s)').length).toBeGreaterThan(0)
  })

  it('permet de saisir titre et message et de personnaliser le badge', () => {
    renderCenter()
    const titleInput = screen.getByPlaceholderText('Ex: Nouvelle fonctionnalité disponible !')
    fireEvent.change(titleInput, { target: { value: 'Mise à jour v2.0' } })
    expect(titleInput.value).toBe('Mise à jour v2.0')

    const badgeInput = screen.getByPlaceholderText('Ex: NOUVEAU, PROMO, INFO, FLASH')
    fireEvent.change(badgeInput, { target: { value: 'flash' } })
    expect(badgeInput.value).toBe('FLASH')

    // Live preview updates
    expect(screen.getAllByText('Mise à jour v2.0').length).toBeGreaterThan(0)
    expect(screen.getAllByText('FLASH').length).toBeGreaterThan(0)
  })

  it('permet de basculer entre l’aperçu Carte et l’aperçu Tiroir (Sheet)', () => {
    renderCenter()
    const sheetTab = screen.getByText('Tiroir (Sheet)')
    fireEvent.click(sheetTab)
    expect(screen.getByText('Tiroir (Sheet)')).toBeTruthy()

    const cardTab = screen.getByText('Carte')
    fireEvent.click(cardTab)
    expect(screen.getByText('Carte')).toBeTruthy()
  })
})
