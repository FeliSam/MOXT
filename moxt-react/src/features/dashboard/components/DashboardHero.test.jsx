import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { DashboardHero } from './DashboardHero'

vi.mock('../../../contexts/useLanguage', () => ({
  useLanguage: () => ({
    t: (key, vars) => {
      const map = {
        'dashboard.hero.welcome': `Bienvenue ${vars?.name || ''}`,
        'dashboard.hero.install': "Installer l'App",
        'dashboard.hero.guide': 'Guide',
      }
      return map[key] || key
    },
  }),
}))

describe('DashboardHero', () => {
  it('affiche un hero minimal (salutation, install, guide) sans sous-titre', () => {
    render(
      <MemoryRouter>
        <DashboardHero user={{ firstName: 'Amina', verified: true }} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /Bienvenue Amina/i })).toBeInTheDocument()
    expect(screen.queryByText(/Envoyez de l’argent/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Créer un transfert/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Installer l'App/i })).toHaveAttribute('href', '/install')
    expect(screen.getByRole('link', { name: /^Guide$/i })).toHaveAttribute('href', '/guide')
  })
})
