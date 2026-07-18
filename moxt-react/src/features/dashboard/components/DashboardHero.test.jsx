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
        'dashboard.hero.news': 'Actualités',
      }
      return map[key] || key
    },
  }),
}))

vi.mock('../../transfers/DashboardTransferCalculator', () => ({
  DashboardTransferCalculator: () => <div data-testid="transfer-calculator" />,
}))

describe('DashboardHero', () => {
  it('propose Actualités comme action secondaire', () => {
    render(
      <MemoryRouter>
        <DashboardHero user={{ firstName: 'Amina', verified: true }} onOpenCalculator={() => undefined} />
      </MemoryRouter>,
    )

    const news = screen.getByRole('link', { name: /Actualités/i })
    expect(news).toHaveAttribute('href', '/news')
    expect(screen.getByRole('link', { name: /Créer un transfert/i })).toHaveAttribute('href', '/transfers')
  })
})
