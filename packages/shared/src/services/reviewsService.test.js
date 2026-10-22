import { describe, expect, it } from 'vitest'
import { createFakeClient } from './testClient.js'
import { buildReview, fetchReviewsForTargetScope, reviewToRemoteRow, syncReview } from './reviewsService.js'
import { fetchPublicProfile, mapRemoteProfile } from './profileService.js'

const me = '11111111-1111-4111-8111-111111111111'

describe('reviewsService', () => {
  it('construit un avis au format du web', () => {
    const review = buildReview(
      { targetType: 'business', targetId: 'BIZ-1', authorId: me, authorName: 'A', rating: 9, comment: '  Très bien  ' },
      new Date('2026-09-28T10:00:00Z'),
    )
    expect(review).toMatchObject({ rating: 5, comment: 'Très bien', status: 'published', disputeStatus: 'none', createdAt: '2026-09-28T10:00:00.000Z' })
    expect(review.id).toMatch(/^REV-/)
    expect(reviewToRemoteRow(review)).toMatchObject({ id: review.id, target_type: 'business', target_id: 'BIZ-1', author_id: me, rating: 5, reply_text: null })
  })

  it("upsert sur id avec l'auteur de la session", async () => {
    const client = createFakeClient({ reviews: [] })
    client.auth = { getUser: async () => ({ data: { user: { id: me } }, error: null }) }
    const review = buildReview({ targetType: 'business', targetId: 'BIZ-1', authorId: 'autre', rating: 4, comment: 'Correct' })
    await expect(syncReview(client, review)).resolves.toBe(review.id)
    expect(client.calls[0].ops[0]).toEqual(['upsert', expect.objectContaining({ id: review.id, author_id: me }), { onConflict: 'id' }])
  })

  it('met à jour l’avis existant en cas de conflit auteur + cible', async () => {
    const ops = []
    const client = {
      from: () => {
        const chain = {
          upsert: () => { ops.push('upsert'); return Promise.resolve({ error: { code: '23505', message: 'duplicate key' } }) },
          select: () => chain,
          eq: () => chain,
          maybeSingle: () => { ops.push('maybeSingle'); return Promise.resolve({ data: { id: 'REV-OLD' }, error: null }) },
          update: (values) => { ops.push(['update', values.rating]); return { eq: () => Promise.resolve({ error: null }) } },
        }
        return chain
      },
    }
    const review = buildReview({ targetType: 'business', targetId: 'BIZ-1', authorId: me, rating: 3, comment: 'Moyen' })
    await expect(syncReview(client, review)).resolves.toBe('REV-OLD')
    expect(ops).toEqual(['upsert', 'maybeSingle', ['update', 3]])
  })

  it('charge les avis de la cible, du propriétaire et des publications liées', async () => {
    const client = createFakeClient({ reviews: [{ id: 'R1', target_type: 'business', target_id: 'BIZ-1', rating: 5 }] })
    const reviews = await fetchReviewsForTargetScope(client, {
      profileTargetType: 'business',
      profileTargetId: 'BIZ-1',
      ownerProfileId: me,
      publicationIds: { listing: ['L1'], parcel: [] },
    })
    expect(reviews).toEqual([expect.objectContaining({ id: 'R1', targetType: 'business', rating: 5 })])
    expect(client.calls).toHaveLength(3)
    expect(client.calls[2].ops).toContainEqual(['in', 'target_id', ['L1']])
  })
})

describe('profileService', () => {
  it('reprend seulement la bannière et le genre des préférences', async () => {
    expect(mapRemoteProfile({ first_name: 'S', status: 'verified', preferences: { coverStyle: 'man-c-mesh', gender: 'male', theme: 'dark' } })).toMatchObject({
      firstName: 'S',
      verified: true,
      coverStyle: 'man-c-mesh',
      gender: 'male',
    })
    const client = createFakeClient({ profiles: [{ first_name: 'S', preferences: null }] })
    await expect(fetchPublicProfile(client, me)).resolves.toMatchObject({ firstName: 'S', coverStyle: null })
    expect(client.calls[0].ops[0][1]).toMatch(/preferences$/)
  })
})
