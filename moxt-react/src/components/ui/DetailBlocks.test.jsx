import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DetailFacts, DetailMetrics, TrustPanel } from './DetailBlocks'

describe('DetailBlocks', () => {
  it('affiche les métriques, caractéristiques et conseils de confiance', () => {
    render(
      <>
        <DetailMetrics items={[{ label: 'Localisation', value: 'Cotonou' }]} />
        <DetailFacts items={[{ label: 'Statut', value: 'Active' }]} />
        <TrustPanel items={['Vérifiez le propriétaire.']} />
      </>,
    )

    expect(screen.getByText('Cotonou')).toBeVisible()
    expect(screen.getByText('Active')).toBeVisible()
    expect(screen.getByText('Vérifiez le propriétaire.')).toBeVisible()
  })
})
