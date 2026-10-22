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

  it('recherche des articles récents et retourne les cartes avec images', async () => {
    const state = {
      posts: {
        items: [
          {
            id: 'post-1',
            title: 'Guide des formalités consulaires en Russie',
            text: 'Toutes les démarches pour renouveler son visa étudiant ou de travail...',
            authorName: 'Équipe Moxt',
            imageUrl: 'https://cdn.moxtapp.ru/posts/visa-guide.jpg',
            createdAt: '2026-10-15T12:00:00Z',
          },
        ],
      },
    }
    const response = await localAssistantProvider.respond({
      question: 'Quels sont les derniers articles du fil ?',
      searchIndex: [],
      state,
    })
    expect(response.text).toContain('formalités consulaires')
    expect(response.cards).toBeDefined()
    expect(response.cards[0].type).toBe('post')
    expect(response.cards[0].imageUrl).toContain('posts/visa-guide.jpg')
    expect(response.actions[0].path).toBe('/news?post=post-1')
  })

  it('recherche des annonces marketplace et retourne cartes avec photos et prix', async () => {
    const state = {
      marketplace: {
        items: [
          {
            id: 'ann-1',
            title: 'iPhone 15 Pro Max 256GB',
            price: 105000,
            currency: 'RUB',
            city: 'Moscou',
            images: ['https://cdn.moxtapp.ru/listings/iphone.jpg'],
          },
        ],
      },
    }
    const response = await localAssistantProvider.respond({
      question: 'Je cherche un iphone sur la marketplace',
      searchIndex: [],
      state,
    })
    expect(response.text).toContain('iPhone 15 Pro Max')
    expect(response.cards).toBeDefined()
    expect(response.cards[0].type).toBe('listing')
    expect(response.cards[0].badgeText).toContain('105000')
    expect(response.cards[0].imageUrl).toContain('listings/iphone.jpg')
    expect(response.actions[0].path).toBe('/marketplace/ann-1')
  })

  it('retourne les détails complets et la carte pour le dernier transfert', async () => {
    const state = {
      transfers: {
        items: [
          {
            id: 'MXT-2026',
            userId: 'user-77',
            amountSent: 25000,
            currencyFrom: 'RUB',
            amountReceived: 187500,
            currencyTo: 'XOF',
            direction: 'Bénin',
            originCountry: 'Russie',
            status: 'payment_declared',
            exchanger: { name: 'Transfert Direct' },
            createdAt: '2026-10-17T18:00:00Z',
          },
        ],
      },
    }
    const response = await localAssistantProvider.respond({
      question: 'Où en est mon dernier transfert ?',
      searchIndex: [],
      state,
      user: { id: 'user-77' },
    })
    expect(response.text).toContain('MXT-2026')
    expect(response.text).toContain('25000 RUB')
    expect(response.text).toContain('187500 XOF')
    expect(response.cards[0].type).toBe('transfer')
    expect(response.cards[0].badgeText).toBe('Paiement déclaré')
    expect(response.cards[0].path).toBe('/transfers/MXT-2026')
  })

  it('propose les changeurs disponibles lors d’une demande de nouveau transfert sans mélanger les cartes', async () => {
    const state = {
      businesses: {
        items: [
          {
            id: 'biz-1',
            name: 'Moxt Express Exchange',
            category: 'exchange',
            city: 'Moscou',
            country: 'Russie',
            rating: 4.9,
            feePercent: 1.5,
            status: 'active',
          },
        ],
      },
      marketplace: {
        items: [
          { id: 'item-99', title: 'iPhone 14', price: 60000, currency: 'RUB' },
        ],
      },
      posts: {
        items: [
          { id: 'post-99', title: 'Nouvelle politique de sécurité', text: 'Important...' },
        ],
      },
    }

    const response = await localAssistantProvider.respond({
      question: 'Je veux faire un transfert, propose moi les changeurs disponibles',
      searchIndex: [],
      state,
    })

    expect(response.text).toContain('changeur')
    expect(response.text).toContain('Moxt Express Exchange')
    expect(response.cards.length).toBeGreaterThan(0)
    expect(response.cards.every((c) => c.type === 'exchanger')).toBe(true)
    expect(response.cards.some((c) => c.type === 'listing')).toBe(false)
    expect(response.cards.some((c) => c.type === 'post')).toBe(false)
    expect(response.actions.some((a) => a.path === '/transfers/new')).toBe(true)
  })

  it('ne retourne aucune carte pour une question générale d’administration ou de profil', async () => {
    const state = {
      marketplace: {
        items: [{ id: 'item-1', title: 'Vélo', price: 5000 }],
      },
    }
    const response = await localAssistantProvider.respond({
      question: 'Comment puis-je modifier mon adresse email et mon mot de passe ?',
      searchIndex: [],
      state,
    })
    expect(response.cards).toEqual([])
  })
})

