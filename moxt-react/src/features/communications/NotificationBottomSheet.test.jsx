import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { NotificationBottomSheet } from './NotificationBottomSheet'

vi.mock('../../../contexts/useLanguage', () => ({
  useLanguage: () => ({ language: 'fr', t: (key) => key }),
}))

function renderSheet(props = {}) {
  const store = configureStore({
    reducer: {
      communications: (state = { notifications: [] }) => state,
      auth: (state = { user: { id: 'u1' } }) => state,
    },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <NotificationBottomSheet
          open={true}
          onClose={vi.fn()}
          currentUserId="u1"
          notification={{
            id: 'n1',
            title: 'Offre spéciale MOXT',
            message: 'Profitez de frais réduits sur vos transferts ce week-end.',
            badgeText: 'PROMO',
            badgeColor: 'amber',
            badgeIcon: 'gift',
            priority: 'high',
            displayMode: 'sheet',
            actionLabel: 'Découvrir l’offre',
            link: '/transfers',
            read: false,
            createdAt: '2026-10-17T12:00:00Z',
          }}
          {...props}
        />
      </MemoryRouter>
    </Provider>,
  )
}

describe('NotificationBottomSheet', () => {
  it('affiche le titre, le message, et le badge personnalisé', () => {
    renderSheet()
    expect(screen.getByText('Offre spéciale MOXT')).toBeTruthy()
    expect(
      screen.getByText('Profitez de frais réduits sur vos transferts ce week-end.'),
    ).toBeTruthy()
    expect(screen.getByText('PROMO')).toBeTruthy()
    expect(screen.getByText('Urgent')).toBeTruthy()
    expect(screen.getByText('Découvrir l’offre')).toBeTruthy()
    expect(screen.getByText('Marquer comme lue')).toBeTruthy()
  })

  it('appelle onClose quand on clique sur le bouton fermer', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    renderSheet({ onClose })
    const closeBtns = screen.getAllByLabelText('Fermer')
    fireEvent.click(closeBtns[1])
    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('ne rend rien si open est false', () => {
    const { container } = renderSheet({ open: false })
    expect(container.innerHTML).toBe('')
  })

  it('affiche la bannière image si imageUrl est fournie', () => {
    renderSheet({
      notification: {
        id: 'n2',
        title: 'Promotion avec image',
        message: 'Regardez notre nouvelle offre.',
        imageUrl: 'https://example.com/promo.jpg',
      },
    })
    const img = screen.getByRole('img', { name: 'Promotion avec image' })
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('https://example.com/promo.jpg')
  })
})

