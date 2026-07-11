import { describe, expect, it } from 'vitest'
import { generateBusinessPresentation } from './generateBusinessPresentation'

describe('generateBusinessPresentation', () => {
  it('compose un texte avec nom, activité et contacts', () => {
    const text = generateBusinessPresentation({
      name: 'Felix Store',
      primaryActivity: 'logistics',
      city: 'Moscou',
      serviceZones: 'Moscou et région',
      phone: '+7 900 000 00 01',
      email: 'contact@felix.store',
      telegram: 'felixstore',
      scheduleSummary: 'Lun–Ven 9h–18h',
    })

    expect(text).toContain('Felix Store')
    expect(text).toContain('colis et logistique')
    expect(text).toContain('contact@felix.store')
    expect(text).toContain('Telegram @felixstore')
    expect(text).toContain('Lun–Ven 9h–18h')
  })

  it('inclut les frais uniquement pour le transfert', () => {
    const text = generateBusinessPresentation({
      name: 'Moxt Change',
      primaryActivity: 'transfer',
      phone: '+79000000000',
      services: ['Transfert'],
      feePercent: 2.5,
      averageDelay: '30 min',
    })

    expect(text).toContain('Frais de transfert : 2.5')
    expect(text).toContain('Délai moyen : 30 min')
  })
})
