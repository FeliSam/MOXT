import { describe, expect, it } from 'vitest'
import { translate } from '@moxt/shared/i18n/translate.js'
import { localAssistantProvider } from './assistantProvider'

describe('localAssistantProvider', () => {
  it('retourne des liens issus des données locales', async () => {
    const response = await localAssistantProvider.respond({
      question: 'Je cherche Atelier Cotonou',
      searchIndex: [
        {
          title: 'Atelier Cotonou',
          subtitle: 'Formation',
          typeLabel: 'Événement',
          path: '/events/e1',
        },
      ],
    })
    expect(response.actions[0].path).toBe('/events/e1')
    expect(response.sources).toEqual(['Événement: Atelier Cotonou'])
  })

  it('localise les réponses selon la langue active', async () => {
    const t = (key, vars) => translate('en', key, vars)
    const response = await localAssistantProvider.respond({
      question: 'How do I send a parcel?',
      searchIndex: [],
      language: 'en',
      t,
    })
    expect(response.text).toMatch(/parcel/i)
    expect(response.actions.some((action) => action.path === '/parcels')).toBe(true)
    expect(response.actions.some((action) => action.label === 'View trips')).toBe(true)
  })
})
