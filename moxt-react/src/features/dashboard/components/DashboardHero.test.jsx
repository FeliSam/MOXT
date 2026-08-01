import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { DashboardHero } from './DashboardHero'

vi.mock('../../../contexts/useLanguage', () => ({
  useLanguage: () => ({
    t: (key, vars) => {
      const map = {
        'dashboard.hero.welcome': `Bienvenue ${vars?.name || ''}`,
        'dashboard.hero.createTransfer': 'Créer un transfert',
        'dashboard.hero.install': "Installer l'App",
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
  it('affiche les CTA Accueil en boutons (transfert, installer, guide)', () => {
    render(
      <MemoryRouter>
        <DashboardHero user={{ firstName: 'Amina', verified: true }} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /Bienvenue Amina/i })).toBeInTheDocument()
    expect(screen.queryByText(/Tous vos services essentiels/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Créer un transfert/i })).toHaveAttribute('href', '/transfers')
    expect(screen.getByRole('link', { name: /Installer l'App/i })).toHaveAttribute('href', '/install')
    expect(screen.getByRole('link', { name: /^Guide$/i })).toHaveAttribute('href', '/guide')
  })
})
