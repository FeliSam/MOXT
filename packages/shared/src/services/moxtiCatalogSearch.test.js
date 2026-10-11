import { describe, expect, it } from 'vitest'

import { createFakeClient } from './testClient.js'
import { parseMoxtiCatalogQuery, searchMoxtiCatalog } from './moxtiCatalogSearch.js'

const NOW = new Date('2026-10-03T12:00:00')

function catalog() {
  return {
    listings: [
      { id: 'iphone-cher', title: 'iPhone 15', status: 'active', price: 90000, currency: 'RUB', city: 'Moscou', images: ['https://cdn.example/iphone15.jpg'] },
      { id: 'iphone-pas-cher', title: 'iPhone 13', status: 'active', price: 45000, currency: 'RUB', city: 'Kazan', category: 'Téléphones' },
      { id: 'iphone-vendu', title: 'iPhone 12', status: 'sold', price: 10000, currency: 'RUB' },
      { id: 'samsung', title: 'Samsung A54', status: 'active', price: 20000, currency: 'RUB' },
    ],
    parcels: [
      {
        id: 'moscou',
        status: 'active',
        origin: 'Cotonou',
        destination: 'Moscow',
        price_per_kg: 15,
        currency: 'RUB',
        remaining_kg: 8,
        departure_date: '2026-10-20',
        owner_name: 'Awa',
      },
      {
        id: 'passe',
        status: 'active',
        origin: 'Cotonou',
        destination: 'Moscou',
        price_per_kg: 1,
        remaining_kg: 8,
        departure_date: '2026-09-01',
      },
    ],
    businesses: [
      { id: 'cheap', name: 'Change Cotonou', status: 'verified', city: 'Cotonou', country: 'BJ', fee_percent: 2, rating: 4.8, services: ['transfert'] },
      { id: 'gone', name: 'Ancien Bénin', status: 'verified', country: 'BJ', fee_percent: 1, deleted_by_user_at: '2026-01-01' },
      { id: 'moscou-biz', name: 'Bureau Moscou', status: 'active', city: 'Moscou', fee_percent: 5 },
    ],
    p2p_offers: [
      { id: 'xof', status: 'active', amount: 50000, from_currency: 'RUB', to_currency: 'XOF', rate: 7.2 },
      { id: 'usd', status: 'active', amount: 100, from_currency: 'USD', to_currency: 'EUR', rate: 0.9 },
    ],
    events: [
      { id: 'week', title: 'Soirée samedi', status: 'published', city: 'Moscou', price: 500, currency: 'RUB', start_at: '2026-10-03T18:00:00' },
      { id: 'free', title: 'Atelier dimanche', status: 'published', city: 'Kazan', price: 0, currency: 'RUB', start_at: '2026-10-04T11:00:00' },
      { id: 'later', title: 'Concert novembre', status: 'published', city: 'Moscou', price: 100, start_at: '2026-11-20T18:00:00' },
    ],
    jobs: [
      { id: 'cook', title: 'Cuisinier', status: 'active', location: 'Moscou', salary: '80000 RUB', sector: 'Restaurant' },
      { id: 'closed', title: 'Cuisinier senior', status: 'closed', salary: '1000 RUB' },
    ],
  }
}

describe('parseMoxtiCatalogQuery', () => {
  it('reconnaît les recherches catalogue et ignore les questions de mode d’emploi', () => {
    expect(parseMoxtiCatalogQuery('je cherche un iPhone')?.kinds).toEqual(['listing'])
    expect(parseMoxtiCatalogQuery('je cherche un iPhone')?.tokens).toEqual(['iphone'])
    expect(parseMoxtiCatalogQuery('colis pour Moscou')?.kinds).toEqual(['parcel'])
    expect(parseMoxtiCatalogQuery('transfert vers le Bénin')?.kinds).toEqual(['business', 'p2p'])
    expect(parseMoxtiCatalogQuery('événement ce weekend')?.weekend).toBe(true)
    expect(parseMoxtiCatalogQuery('Comment effectuer un transfert d’argent ?')).toBeNull()
    expect(parseMoxtiCatalogQuery('Comment publier une annonce sur le marketplace ?')).toBeNull()
  })
})

describe('searchMoxtiCatalog', () => {
  it('renvoie une liste d’annonces triée par prix croissant, sans les vendues', async () => {
    const client = createFakeClient(catalog())
    const result = await searchMoxtiCatalog(client, { question: 'je cherche un iPhone', language: 'fr', now: NOW })
    expect(result.searched).toBe(true)
    expect(result.cards.map((card) => card.id)).toEqual(['iphone-pas-cher', 'iphone-cher'])
    expect(result.cards.map((card) => card.price)).toEqual([45000, 90000])
    expect(result.cards[0].path).toBe('/marketplace/iphone-pas-cher')
    expect(result.cards[0].path.startsWith('http')).toBe(false)
    expect(result.cards[1].image).toBe('https://cdn.example/iphone15.jpg')
    expect(result.intro).toContain('2 résultats')
    expect(client.calls.some((call) => call.table === 'listings')).toBe(true)
  })

  it('renvoie une seule carte colis quand un seul trajet correspond', async () => {
    const client = createFakeClient(catalog())
    const result = await searchMoxtiCatalog(client, { question: 'colis pour Moscou', language: 'fr', now: NOW })
    expect(result.cards).toHaveLength(1)
    expect(result.cards[0]).toMatchObject({
      kind: 'parcel',
      id: 'moscou',
      path: '/parcels/moscou',
      price: 15,
    })
    expect(result.cards[0].subtitle).toContain('Moscow')
    expect(result.intro).toBe('Voici le résultat correspondant :')
  })

  it('trie échangeurs et offres P2P vers le Bénin par prix', async () => {
    const client = createFakeClient(catalog())
    const result = await searchMoxtiCatalog(client, { question: 'transfert vers le Bénin', language: 'fr', now: NOW })
    expect(result.cards.map((card) => card.id)).toEqual(['cheap', 'xof'])
    expect(result.cards.map((card) => card.price)).toEqual([2, 7.2])
    expect(result.cards[0].path).toBe('/businesses/cheap')
    expect(result.cards[1].path).toBe('/p2p/xof')
  })

  it('limite les événements au week-end en cours, du moins cher au plus cher', async () => {
    const client = createFakeClient(catalog())
    const result = await searchMoxtiCatalog(client, { question: 'événement ce weekend', language: 'fr', now: NOW })
    expect(result.cards.map((card) => card.id)).toEqual(['free', 'week'])
    expect(result.cards[0].path).toBe('/events/free')
    expect(result.cards.every((card) => card.path.startsWith('/events/'))).toBe(true)
  })

  it('inclut les emplois actifs', async () => {
    const client = createFakeClient(catalog())
    const result = await searchMoxtiCatalog(client, { question: 'je cherche un emploi de cuisinier', language: 'fr', now: NOW })
    expect(result.cards.map((card) => card.id)).toEqual(['cook'])
    expect(result.cards[0].path).toBe('/jobs/cook')
    expect(result.cards[0].price).toBe(80000)
  })

  it('ne interroge pas la base pour une question hors catalogue', async () => {
    const client = createFakeClient(catalog())
    const result = await searchMoxtiCatalog(client, { question: 'Comment vérifier mon identité ?', now: NOW })
    expect(result.searched).toBe(false)
    expect(result.cards).toEqual([])
    expect(client.calls).toEqual([])
  })
})
