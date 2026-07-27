import { describe, expect, it } from 'vitest'
import { groupActiveStatusesByAuthor } from './statusSelectors'

const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()

function status(overrides) {
  return {
    id: 'S1',
    authorId: 'U1',
    authorName: 'Amina',
    authorAvatarUrl: null,
    businessId: null,
    items: [],
    viewedBy: [],
    isOfficial: false,
    createdAt: new Date().toISOString(),
    expiresAt: future,
    ...overrides,
  }
}

describe('groupActiveStatusesByAuthor', () => {
  it('sépare le statut personnel et le statut entreprise du même auteur', () => {
    const groups = groupActiveStatusesByAuthor(
      [
        status({ id: 'S1', authorId: 'U1', authorName: 'Amina' }),
        status({
          id: 'S2',
          authorId: 'U1',
          authorName: 'Atelier Cotonou',
          businessId: 'BIZ-1',
        }),
      ],
      'U1',
    )

    expect(groups).toHaveLength(2)
    const personal = groups.find((g) => !g.businessId)
    const business = groups.find((g) => g.businessId === 'BIZ-1')
    expect(personal.items).toHaveLength(1)
    expect(business.items).toHaveLength(1)
    expect(business.authorName).toBe('Atelier Cotonou')
  })

  it('place le groupe personnel du spectateur en premier, avant son propre groupe entreprise', () => {
    const groups = groupActiveStatusesByAuthor(
      [
        status({ id: 'S1', authorId: 'U1', businessId: 'BIZ-1', authorName: 'Business' }),
        status({ id: 'S2', authorId: 'U2', authorName: 'Autre' }),
        status({ id: 'S3', authorId: 'U1', authorName: 'Moi' }),
      ],
      'U1',
    )

    expect(groups[0].authorId).toBe('U1')
    expect(groups[0].businessId).toBeNull()
  })

  it('regroupe toujours par authorId simple quand personne ne publie en tant qu’entreprise', () => {
    const groups = groupActiveStatusesByAuthor(
      [status({ id: 'S1', authorId: 'U1' }), status({ id: 'S2', authorId: 'U1' })],
      'U1',
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].items).toHaveLength(2)
  })
})
