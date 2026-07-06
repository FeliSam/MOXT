import { describe, expect, it } from 'vitest'
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
})
