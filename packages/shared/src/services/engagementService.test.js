import { describe, expect, it } from 'vitest'
import { createFakeClient } from './testClient.js'
import {
  addComment,
  buildComment,
  buildPublisherSubscription,
  deleteComment,
  incrementVideoShare,
  removePublisherSubscription,
  toggleLike,
  toggleLikeList,
  upsertPublisherSubscription,
} from './engagementService.js'

const me = '11111111-1111-4111-8111-111111111111'
const ok = { data: null, error: null }

describe('engagementService — RPC du web', () => {
  it("j'aime : un RPC par type avec le bon paramètre", async () => {
    const client = createFakeClient({}, { rpc: { moxt_video_toggle_like: ok, moxt_listing_toggle_like: ok, moxt_post_toggle_like: ok } })
    await toggleLike(client, 'video', 'VID-1')
    await toggleLike(client, 'listing', 'LST-1')
    await toggleLike(client, 'post', 'PST-1')
    expect(client.calls).toEqual([
      { rpc: 'moxt_video_toggle_like', args: { p_video_id: 'VID-1' } },
      { rpc: 'moxt_listing_toggle_like', args: { p_listing_id: 'LST-1' } },
      { rpc: 'moxt_post_toggle_like', args: { p_post_id: 'PST-1' } },
    ])
  })

  it('commentaires : ajout et suppression, format du web', async () => {
    const client = createFakeClient({}, { rpc: { moxt_post_add_comment: ok, moxt_video_delete_comment: ok } })
    const comment = buildComment({ authorId: me, authorName: 'Test', text: '  Bonjour  ' }, new Date('2026-09-28T10:00:00Z'))
    expect(comment).toMatchObject({ authorId: me, authorName: 'Test', authorAvatarUrl: '', text: 'Bonjour', createdAt: '2026-09-28T10:00:00.000Z' })
    expect(comment.id).toMatch(/^CMT-[0-9A-Z-]+$/)
    await addComment(client, 'post', 'PST-1', comment)
    await deleteComment(client, 'video', 'VID-1', comment.id)
    expect(client.calls).toEqual([
      { rpc: 'moxt_post_add_comment', args: { p_post_id: 'PST-1', p_comment: comment } },
      { rpc: 'moxt_video_delete_comment', args: { p_video_id: 'VID-1', p_comment_id: comment.id } },
    ])
  })

  it("remonte l'erreur du RPC et refuse les types inconnus", async () => {
    const client = createFakeClient({}, { rpc: { moxt_video_increment_share: ok } })
    await expect(toggleLike(client, 'video', 'VID-1')).rejects.toMatchObject({ message: 'rpc absente' })
    await expect(toggleLike(client, 'job', 'J-1')).rejects.toThrow(/non pris en charge/)
    await incrementVideoShare(client, 'VID-2')
    expect(client.calls.at(-1)).toEqual({ rpc: 'moxt_video_increment_share', args: { p_video_id: 'VID-2' } })
  })

  it('bascule optimiste des j’aime', () => {
    expect(toggleLikeList(['a'], me)).toEqual(['a', me])
    expect(toggleLikeList(['a', me], me)).toEqual(['a'])
    expect(toggleLikeList(undefined, me)).toEqual([me])
  })
})

describe('engagementService — abonnements', () => {
  it("garde l'id et la date d'une ligne existante puis upsert sur id", async () => {
    const client = createFakeClient({ publisher_subscriptions: [{ id: 'SUB-OLD', created_at: '2026-01-01T00:00:00.000Z' }] })
    const sub = buildPublisherSubscription(
      { userId: me, publisherType: 'business', publisherId: 'BIZ-1', publisherName: 'Biz', publisherPath: '/businesses/BIZ-1' },
      new Date('2026-09-28T10:00:00Z'),
    )
    expect(sub).toMatchObject({ notifyPref: 'all', createdAt: '2026-09-28T10:00:00.000Z', updatedAt: '2026-09-28T10:00:00.000Z' })
    expect(sub.id).toMatch(/^SUB-/)
    const saved = await upsertPublisherSubscription(client, sub)
    expect(saved).toMatchObject({ id: 'SUB-OLD', createdAt: '2026-01-01T00:00:00.000Z' })
    const [lookup, write] = client.calls.map((call) => call.ops)
    expect(lookup).toEqual([
      ['select', 'id, created_at'],
      ['eq', 'subscriber_id', me],
      ['eq', 'publisher_type', 'business'],
      ['eq', 'publisher_id', 'BIZ-1'],
      ['maybeSingle'],
    ])
    expect(write).toEqual([
      [
        'upsert',
        {
          id: 'SUB-OLD',
          subscriber_id: me,
          publisher_type: 'business',
          publisher_id: 'BIZ-1',
          notify_pref: 'all',
          publisher_name: 'Biz',
          publisher_path: '/businesses/BIZ-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-09-28T10:00:00.000Z',
        },
        { onConflict: 'id' },
      ],
    ])
  })

  it('désabonnement : delete filtré comme le web', async () => {
    const client = createFakeClient({})
    await removePublisherSubscription(client, { userId: me, publisherType: 'business', publisherId: 'BIZ-1' })
    expect(client.calls[0]).toEqual({
      table: 'publisher_subscriptions',
      ops: [['delete'], ['eq', 'subscriber_id', me], ['eq', 'publisher_type', 'business'], ['eq', 'publisher_id', 'BIZ-1']],
    })
  })
})
