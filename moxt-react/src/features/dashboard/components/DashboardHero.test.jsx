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
        'dashboard.hero.subtitle': 'Transferts, colis, ventes, jobs et événements.',
        'dashboard.hero.createTransfer': 'Créer un transfert',
        'dashboard.hero.marketplace': 'Marketplace',
      }
      return map[key] || key
    },
  }),
}))

vi.mock('../../transfers/DashboardTransferCalculator', () => ({
  DashboardTransferCalculator: () => <div data-testid="transfer-calculator" />,
}))

describe('DashboardHero', () => {
  it('propose Marketplace comme action secondaire', () => {
    render(
      <MemoryRouter>
        <DashboardHero user={{ firstName: 'Amina', verified: true }} onOpenCalculator={() => undefined} />
      </MemoryRouter>,
    )

    const marketplace = screen.getByRole('link', { name: /Marketplace/i })
    expect(marketplace).toHaveAttribute('href', '/marketplace')
    expect(screen.getByRole('link', { name: /Créer un transfert/i })).toHaveAttribute('href', '/transfers')
  })
})
