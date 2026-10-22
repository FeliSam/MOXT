import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { MarketplaceFeedBanner } from './MarketplaceFeedBanner'

vi.mock('../../contexts/useLanguage', () => ({
  useLanguage: () => ({ language: 'fr', t: (key) => key }),
}))

vi.mock('../../services/appReleaseService', () => ({
  appReleaseService: {
    getActiveRelease: vi.fn().mockResolvedValue({
      platform: 'android',
      downloadUrl: 'https://example.com/test-moxt.apk',
    }),
  },
}))

vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'b1',
                title: 'Super Promo Moxt Partenaire',
                message: 'Profitez de 20% de remise chez notre partenaire officiel.',
                badge_text: 'SPONSOR',
                badge_color: 'amber',
                badge_icon: 'gift',
                action_label: 'Voir l’offre',
                link: '/businesses',
                target_filter: {
                  imageUrl: 'https://example.com/banner.jpg',
                  showInMarketplace: true,
                },
              },
            ],
            error: null,
          }),
        })),
      })),
    })),
  },
}))

function renderBanner(props = {}) {
  const store = configureStore({
    reducer: {
      auth: (state = { user: { id: 'u1' } }) => state,
      marketplace: (state = {}) => state,
      ui: (state = {}) => state,
    },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <MarketplaceFeedBanner bannerIndex={0} {...props} />
      </MemoryRouter>
    </Provider>,
  )
}

describe('MarketplaceFeedBanner', () => {
  it('affiche la bannière de diffusion administrateur lorsqu’elle est disponible', async () => {
    renderBanner()
    expect(await screen.findByText('Super Promo Moxt Partenaire')).toBeTruthy()
    expect(
      screen.getByText('Profitez de 20% de remise chez notre partenaire officiel.'),
    ).toBeTruthy()
    expect(screen.getByText('SPONSOR')).toBeTruthy()
    expect(screen.getByText('Voir l’offre')).toBeTruthy()
  })
})
