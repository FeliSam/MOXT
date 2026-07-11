import { describe, expect, it } from 'vitest'
import { generatePostMessage } from './postTemplates'

describe('generatePostMessage — business', () => {
  const base = {
    name: 'Felix Store',
    primaryActivity: 'logistics',
    city: 'Moscou',
    country: 'RU',
    phone: '+7 900 000 00 01',
    email: 'contact@felix.store',
    description:
      'Felix Store — colis et logistique.\nZone d\'intervention : Moscou et région.\nContact : tél. +7 900 000 00 01 · contact@felix.store.',
  }

  it('evite de repeter secteur, ville et contacts deja dans la description', () => {
    const message = generatePostMessage('business', base, 'Félix')

    expect(message).toContain('Félix ici')
    expect(message).toContain('Felix Store')
    expect(message).toContain('spécialisée en colis et logistique')
    expect(message.match(/📞/g)?.length ?? 0).toBeLessThanOrEqual(1)
    expect(message.match(/Moscou/g)?.length ?? 0).toBeLessThanOrEqual(2)
    expect(message).not.toContain('N\'hésitez pas à nous contacter')
  })

  it('ajoute les coordonnees si elles ne sont pas dans la description', () => {
    const message = generatePostMessage(
      'business',
      {
        ...base,
        description: 'Transport de colis fiable entre la Russie et l\'Afrique.',
      },
      'Félix',
    )

    expect(message).toContain('📞')
    expect(message).toContain('contact@felix.store')
    expect(message).toContain('📍')
  })
})
