import { describe, expect, it } from 'vitest'
import { resolveRelatedSnapshot } from './relatedSnapshot'

describe('resolveRelatedSnapshot', () => {
  it('hydrate une vraie annonce plutôt qu’un snapshot au nom du pair', () => {
    const snapshot = resolveRelatedSnapshot(
      {
        marketplace: {
          items: [
            {
              id: 'LST-1',
              title: 'Vélo urbain',
              price: 100,
              currency: 'EUR',
              images: ['https://img.example/velo.jpg'],
              city: 'Cotonou',
              category: 'Vélo',
              status: 'active',
            },
          ],
        },
      },
      {
        relatedType: 'general',
        relatedId: 'LST-1',
        relatedPath: '/marketplace/LST-1',
        relatedSnapshot: {
          type: 'general',
          id: 'LST-1',
          title: 'Christelle DEDEWANOU',
          path: '/marketplace/LST-1',
        },
        title: 'Christelle DEDEWANOU',
        participantProfiles: {
          peer: { firstName: 'Christelle', lastName: 'DEDEWANOU' },
        },
      },
    )

    expect(snapshot.type).toBe('listing')
    expect(snapshot.title).toBe('Vélo urbain')
    expect(snapshot.imageUrl).toBe('https://img.example/velo.jpg')
  })
})
