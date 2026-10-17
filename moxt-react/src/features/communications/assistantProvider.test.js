import { beforeAll, describe, expect, it } from 'vitest'
import { ensureLocaleLoaded, translate } from '@moxt/shared/i18n/translate.js'
import { localAssistantProvider } from './assistantProvider'

beforeAll(() => ensureLocaleLoaded('en'))

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

  it('identifie et groupe les articles ayant le même nom', async () => {
    const state = {
      marketplace: {
        items: [
          { id: 'item-1', title: 'iPhone 15 Pro', price: 95000, currency: 'RUB' },
          { id: 'item-2', title: 'iPhone 15 Pro', price: 92000, currency: 'RUB' },
          { id: 'item-3', title: 'MacBook Air M2', price: 110000, currency: 'RUB' },
        ],
      },
    }
    const response = await localAssistantProvider.respond({
      question: 'lister toutes les articles qui ont un meme noms',
      searchIndex: [],
      state,
    })
    expect(response.text).toContain('1 groupe(s)')
    expect(response.text).toContain('iPhone 15 Pro')
    expect(response.actions.some((a) => a.path === '/marketplace/item-1')).toBe(true)
    expect(response.actions.some((a) => a.path === '/marketplace/item-2')).toBe(true)
  })

  it('trouve les transferts de l’utilisateur', async () => {
    const state = {
      transfers: {
        items: [
          { id: 'MXT-100', userId: 'user-42', amountSent: 50000, currencyFrom: 'RUB', status: 'completed' },
          { id: 'MXT-101', userId: 'other-user', amountSent: 20000, currencyFrom: 'RUB', status: 'pending' },
        ],
      },
    }
    const response = await localAssistantProvider.respond({
      question: 'trouve mon dernier transfert effectue',
      searchIndex: [],
      state,
      user: { id: 'user-42' },
    })
    expect(response.text).toContain('1 transfert(s)')
    expect(response.text).toContain('50000 RUB')
    expect(response.actions[0].path).toBe('/transfers/MXT-100')
  })

  it('liste les jobs disponibles', async () => {
    const state = {
      jobs: {
        items: [
          { id: 'job-1', title: 'Développeur Full Stack', company: 'Moxt Tech', city: 'Moscou' },
        ],
      },
    }
    const response = await localAssistantProvider.respond({
      question: 'liste les offres de jobs',
      searchIndex: [],
      state,
    })
    expect(response.text).toContain('Développeur Full Stack')
    expect(response.actions[0].path).toBe('/jobs/job-1')
  })
})
