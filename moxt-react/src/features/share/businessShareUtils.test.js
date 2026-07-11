import { describe, expect, it } from 'vitest'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  buildBusinessShareUrlFromValues,
} from './businessShareUtils'

describe('businessShareUtils', () => {
  it('ajoute une version au lien pour regenerer le QR apres modification', () => {
    const first = buildBusinessShareUrl({
      id: 'BIZ-1',
      name: 'Alpha',
      updatedAt: '2026-07-11T10:00:00.000Z',
    })
    const second = buildBusinessShareUrl({
      id: 'BIZ-1',
      name: 'Beta',
      updatedAt: '2026-07-11T11:00:00.000Z',
    })

    expect(first).toContain('/businesses/BIZ-1/publications/listings?v=')
    expect(second).not.toBe(first)
  })

  it('genere un texte de partage avec les coordonnees a jour', () => {
    const text = buildBusinessShareText({
      name: 'Felix Store',
      primaryActivity: 'logistics',
      city: 'Moscou',
      phone: '+79000000000',
      email: 'contact@felix.store',
      description: 'Transport de colis fiable.',
    })

    expect(text).toContain('Felix Store')
    expect(text).toContain('Moscou')
    expect(text).toContain('+79000000000')
    expect(text).toContain('contact@felix.store')
  })

  it('reflete les brouillons du formulaire entreprise', () => {
    const url = buildBusinessShareUrlFromValues({
      id: 'BIZ-2',
      name: 'Nouveau nom',
      city: 'Kazan',
      phone: '+79001112233',
    })

    expect(url).toContain('BIZ-2')
    expect(url).toContain('v=')
  })
})
