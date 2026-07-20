import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { DashboardHero } from './DashboardHero'

vi.mock('../../../contexts/useLanguage', () => ({
  useLanguage: () => ({
    t: (key, vars) => {
      const map = {
        'dashboard.hero.welcome': `Bienvenue ${vars?.name || ''}`,
        'dashboard.hero.title': 'Tous vos services essentiels, réunis.',
        'dashboard.hero.subtitleShort': 'Envoyez de l’argent, trouvez un colis ou une annonce.',
        'dashboard.hero.createTransfer': 'Créer un transfert',
        'dashboard.hero.news': 'Actualités',
        'dashboard.hero.guide': 'Guide',
      }
      return map[key] || key
    },
  }),
}))

vi.mock('../../transfers/DashboardTransferCalculator', () => ({
  DashboardTransferCalculator: () => <div data-testid="transfer-calculator" />,
}))

describe('DashboardHero', () => {
  it('affiche les CTA Accueil en boutons (transfert, actualités, guide)', () => {
    render(
      <MemoryRouter>
        <DashboardHero user={{ firstName: 'Amina', verified: true }} onOpenCalculator={() => undefined} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /Créer un transfert/i })).toHaveAttribute('href', '/transfers')
    expect(screen.getByRole('link', { name: /Actualités/i })).toHaveAttribute('href', '/news')
    expect(screen.getByRole('link', { name: /^Guide$/i })).toHaveAttribute('href', '/guide')
  })
})
