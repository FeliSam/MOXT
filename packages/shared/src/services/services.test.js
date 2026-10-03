import { describe, expect, it } from 'vitest'
import { createFakeClient } from './testClient.js'
import {
  fetchNotificationInbox,
  markAllNotificationsRead,
  subscribeToNotifications,
} from './notificationsService.js'
import { businessFromRemoteRow, fetchBusinesses, findOwnedBusiness } from './businessesService.js'
import {
  fetchBusinessPublications,
  fetchCatalogUserPublications,
  fetchPublicUserPublications,
  fetchUserPublications,
  summarizeUserPublications,
} from './publicationsService.js'
import { fetchActiveStatuses, fetchFeedPosts, fetchPublicFeedCatalog, groupStatusesByAuthor } from './feedService.js'
import { buildInboxRows, fetchInbox } from './inboxService.js'
import { fetchPublisherSubscriptions, selectUserSubscriptionList } from './subscriptionsService.js'
import { fetchUserFavorites, mergeFavorites } from './favoritesService.js'
import { fetchParcelBrowse, PARCELS_PUBLIC_LIMIT } from './parcelsService.js'

const me = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'

const opsOf = (client, table) => client.calls.filter((call) => call.table === table).map((call) => call.ops)

describe('notificationsService', () => {
  it('même requête que le web + compteur non lues', async () => {
    const client = createFakeClient({
      notifications: [
        { id: 'n1', user_id: me, type: 'system', read: false, created_at: '2026-09-02' },
        { id: 'n2', user_id: me, type: 'message', read: false, created_at: '2026-09-03' },
        { id: 'n3', user_id: me, type: 'parcel', read: true, created_at: '2026-09-01' },
        { id: 'n4', user_id: me, type: 'system', read: false, archived: true, created_at: '2026-09-04' },
      ],
    })
    const inbox = await fetchNotificationInbox(client, me)
    expect(inbox.items).toHaveLength(3)
    expect(inbox.visible.map((item) => item.id)).toEqual(['n1', 'n3'])
    expect(inbox.unreadCount).toBe(1)
    expect(opsOf(client, 'notifications')[0]).toEqual([
      ['select', '*'],
      ['eq', 'user_id', me],
      ['order', 'created_at', { ascending: false }],
      ['limit', 50],
    ])
  })

  it('temps réel INSERT + UPDATE filtré sur user_id, désabonnement', () => {
    const client = createFakeClient()
    const received = []
    const stop = subscribeToNotifications(client, me, (item) => received.push(item))
    const [channel] = client.channels
    expect(channel.handlers.map((h) => h.filter.event)).toEqual(['INSERT', 'UPDATE'])
    expect(channel.handlers[0].filter.filter).toBe(`user_id=eq.${me}`)
    channel.handlers[0].handler({ new: { id: 'n9', user_id: me, title: 'Nouveau' } })
    expect(received[0]).toMatchObject({ id: 'n9', title: 'Nouveau', read: false })
    stop()
    expect(channel.removed).toBe(true)
  })

  it('marque tout lu comme le middleware web', async () => {
    const client = createFakeClient()
    await markAllNotificationsRead(client, me)
    const ops = opsOf(client, 'notifications')[0]
    expect(ops[0][0]).toBe('update')
    expect(ops[0][1].read).toBe(true)
    expect(ops[1]).toEqual(['eq', 'user_id', me])
  })
})

describe('businessesService', () => {
  it('fusionne publiques + possédées, payload compris', async () => {
    const client = createFakeClient({
      businesses: [
        { id: 'b1', owner_id: me, name: 'Moxt Cargo', payload: { hours: '9h-18h', city: 'Moscou' } },
      ],
    })
    const list = await fetchBusinesses(client, me)
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ ownerId: me, name: 'Moxt Cargo', hours: '9h-18h', city: 'Moscou' })
    expect(findOwnedBusiness(list, me)?.id).toBe('b1')
    expect(opsOf(client, 'businesses')[1]).toEqual([['select', '*'], ['eq', 'owner_id', me]])
    expect(businessFromRemoteRow(null)).toBeNull()
  })
})

describe('publicationsService', () => {
  it('interroge chaque table par propriétaire, dont p2p_offers (Autres)', async () => {
    const client = createFakeClient({
      listings: [{ id: 'l1', owner_id: me, status: 'active' }, { id: 'l2', owner_id: me, status: 'sold' }],
      parcels: [{ id: 'p1', owner_id: me, status: 'active', departure_date: '2000-01-01' }],
      posts: [{ id: 'po', author_id: me, status: 'published' }],
      p2p_offers: [{ id: 'o1', owner_id: me, status: 'active', payload: { note: 'x' } }],
    })
    const { publications, errors } = await fetchUserPublications(client, me)
    expect(errors).toEqual([])
    expect(client.calls.map((call) => call.table)).toEqual(['listings', 'parcels', 'jobs', 'events', 'videos', 'posts', 'p2p_offers'])
    expect(opsOf(client, 'posts')[0][1]).toEqual(['eq', 'author_id', me])
    expect(publications.others[0].note).toBe('x')
    const summary = summarizeUserPublications(publications)
    expect(summary.archiveCounts).toEqual({ active: 3, archived: 2 })
    expect(summary.activeTypeCounts.other).toBe(1)
  })

  it('profil public authentifié : fenêtres du catalogue web, posts vides si la requête échoue', async () => {
    const client = createFakeClient(
      {
        listings: [
          { id: 'l1', owner_id: me, status: 'sold' },
          { id: 'l2', owner_id: other, status: 'active' },
        ],
        parcels: [{ id: 'p1', owner_id: me, status: 'completed' }],
        posts: [{ id: 'po', author_id: me, status: 'published' }],
        p2p_offers: [{ id: 'o1', owner_id: me, status: 'active' }],
      },
      { errors: { posts: 'invalid input syntax for type uuid' } },
    )
    const { publications, errors } = await fetchCatalogUserPublications(client, me, { viewerId: 'not-a-uuid' })
    expect(errors.map((item) => item.table)).toEqual(['posts'])
    expect(publications.posts).toEqual([])
    expect(publications.listings.map((item) => item.id)).toEqual(['l1'])
    expect(publications.parcels.map((item) => item.id)).toEqual(['p1'])
    expect(publications.others.map((item) => item.id)).toEqual(['o1'])
    expect(opsOf(client, 'listings')[0]).toEqual([
      ['select', '*'],
      ['order', 'created_at', { ascending: false }],
      ['limit', 500],
    ])
    expect(opsOf(client, 'parcels')[0][2]).toEqual(['limit', 50])
    expect(opsOf(client, 'posts')[0]).toEqual([
      ['select', '*'],
      ['or', 'status.eq.published,author_id.eq.not-a-uuid'],
      ['order', 'last_shared_at', { ascending: false, nullsFirst: false }],
      ['order', 'created_at', { ascending: false }],
      ['limit', 40],
    ])
  })

  it('profil public : mêmes statuts que l’aperçu web, sans offres P2P', async () => {
    const client = createFakeClient({
      listings: [{ id: 'l1', owner_id: me, status: 'active' }],
      posts: [{ id: 'po', author_id: me, status: 'published' }],
    })
    const { publications, errors } = await fetchPublicUserPublications(client, me)
    expect(errors).toEqual([])
    expect(client.calls.map((call) => call.table)).toEqual(['listings', 'parcels', 'jobs', 'events', 'videos', 'posts'])
    expect(opsOf(client, 'listings')[0]).toEqual([
      ['select', '*'],
      ['eq', 'owner_id', me],
      ['eq', 'status', 'active'],
    ])
    expect(opsOf(client, 'parcels')[0]).toEqual([
      ['select', '*'],
      ['eq', 'owner_id', me],
      ['in', 'status', ['active', 'full']],
    ])
    expect(publications.others).toEqual([])
    expect(publications.listings.map((item) => item.id)).toEqual(['l1'])
  })
})

describe('fetchPublicFeedCatalog', () => {
  it('charge les tables du fil invité web, posts compris, sans offres P2P', async () => {
    const client = createFakeClient({
      posts: [{ id: 'po', status: 'published', message: 'Bonjour', images: ['https://cdn.example/a.jpg'] }],
      p2p_offers: [{ id: 'o1', status: 'active' }],
    })
    const catalog = await fetchPublicFeedCatalog(client, { limit: 80 })
    expect(opsOf(client, 'posts')[0]).toEqual([
      ['select', '*'],
      ['order', 'updated_at', { ascending: false }],
      ['limit', 80],
      ['eq', 'status', 'published'],
    ])
    expect(client.calls.some((call) => call.table === 'p2p_offers')).toBe(false)
    expect(catalog.posts[0].images).toEqual(['https://cdn.example/a.jpg'])
    expect(catalog.p2pOffers).toEqual([])
    expect(catalog.listings).toEqual([])
  })
})

describe('fetchBusinessPublications', () => {
  it('mêmes tables et statuts publics que l’aperçu entreprise du web', async () => {
    const client = createFakeClient({
      listings: [{ id: 'l1', business_id: 'B1', status: 'active', title: 'Lot' }],
      videos: [{ id: 'v1', business_id: 'B1', status: 'active' }],
    })
    const { publications, errors } = await fetchBusinessPublications(client, 'B1')
    expect(errors).toEqual([])
    expect(client.calls.map((call) => call.table)).toEqual(['listings', 'parcels', 'jobs', 'events', 'videos'])
    expect(opsOf(client, 'parcels')[0]).toEqual([['select', '*'], ['eq', 'business_id', 'B1'], ['in', 'status', ['active', 'full']]])
    expect(opsOf(client, 'events')[0][2]).toEqual(['eq', 'status', 'published'])
    expect(publications.listings[0].title).toBe('Lot')
    expect(publications.videos).toHaveLength(1)
    expect(publications.posts).toEqual([])
  })
})

describe('feedService', () => {
  it('posts : publiées + les miennes, tri partage puis date', async () => {
    const client = createFakeClient({ posts: [{ id: 'p', author_id: me, status: 'draft' }] })
    const posts = await fetchFeedPosts(client, me)
    expect(posts[0].authorId).toBe(me)
    expect(opsOf(client, 'posts')[0]).toEqual([
      ['select', '*'],
      ['or', `status.eq.published,author_id.eq.${me}`],
      ['order', 'last_shared_at', { ascending: false, nullsFirst: false }],
      ['order', 'created_at', { ascending: false }],
      ['limit', 40],
    ])
  })

  it('statuts non expirés regroupés par auteur', async () => {
    const client = createFakeClient({
      statuses: [
        { id: 's1', author_id: other, author_name: 'Awa', viewed_by: [me] },
        { id: 's2', author_id: other, author_name: 'Awa', viewed_by: [] },
        { id: 's3', author_id: me, business_id: 'b1', author_name: 'Moxt' },
      ],
    })
    const statuses = await fetchActiveStatuses(client, { now: new Date('2026-09-28T00:00:00Z') })
    expect(opsOf(client, 'statuses')[0][1]).toEqual(['gt', 'expires_at', '2026-09-28T00:00:00.000Z'])
    const groups = groupStatusesByAuthor(statuses, me)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({ name: 'Awa', unseen: true })
    expect(groups[0].items).toHaveLength(2)
  })
})

describe('inboxService', () => {
  it('RPC puis profils : noms et avatars des interlocuteurs comme le web', async () => {
    const client = createFakeClient(
      { profiles: [{ id: other, first_name: 'Awa', last_name: 'Koné', avatar_url: 'a.png' }] },
      {
        rpc: {
          list_my_conversations: {
            data: [
              { id: 'c1', title: 'Annonce', participant_ids: [me, other], message_count: 2, last_message_at: '2026-09-02', unread_by: { [me]: 1 } },
              { id: 'c2', title: 'Vide', participant_ids: [me, other], message_count: 0 },
            ],
            error: null,
          },
        },
      },
    )
    const { conversations } = await fetchInbox(client, me)
    const rows = buildInboxRows(conversations, me)
    expect(rows).toHaveLength(1)
    expect(rows[0].peer).toMatchObject({ name: 'Awa Koné', avatarUrl: 'a.png' })
    expect(rows[0].unread).toBe(1)
    expect(client.calls[0]).toEqual({ rpc: 'list_my_conversations', args: { p_limit: 80 } })
  })
})

describe('subscriptionsService', () => {
  it('limite 200, userId = subscriber_id, mes abonnements', async () => {
    const client = createFakeClient({
      publisher_subscriptions: [
        { id: 's1', subscriber_id: me, publisher_type: 'business', publisher_id: 'b1' },
        { id: 's2', subscriber_id: other, publisher_type: 'user', publisher_id: me },
      ],
    })
    const subs = await fetchPublisherSubscriptions(client)
    expect(opsOf(client, 'publisher_subscriptions')[0]).toEqual([['select', '*'], ['limit', 200]])
    expect(selectUserSubscriptionList(subs, me).map((item) => item.id)).toEqual(['s1'])
  })
})

describe('favoritesService', () => {
  it('retire les favoris dont la source n’est plus en ligne ou absente', () => {
    const entities = new Map([
      ['listing:l1', { id: 'l1', status: 'active', title: 'Vélo' }],
      ['listing:l2', { id: 'l2', status: 'sold' }],
      ['business:b1', { id: 'b1', status: 'verified', name: 'Moxt Cargo' }],
    ])
    const merged = mergeFavorites({
      userId: me,
      accountFavorites: [
        { id: 'f1', userId: me, relatedType: 'listing', relatedId: 'l1' },
        { id: 'f2', userId: me, relatedType: 'listing', relatedId: 'l2' },
        { id: 'f3', userId: me, relatedType: 'job', relatedId: 'gone' },
        { id: 'f4', userId: me, relatedType: 'business', relatedId: 'b1' },
      ],
      legacyListings: [{ id: 'l9', status: 'active', title: 'Ancien', favorites: [me] }],
      entities,
    })
    expect(merged.map((item) => item.id)).toEqual(['f1', 'f4', 'listing-l9'])
    expect(merged[1].title).toBe('Moxt Cargo')
  })

  it('charge favoris + entités par type', async () => {
    const client = createFakeClient({
      favorites: [{ id: 'f1', user_id: me, related_type: 'listing', related_id: 'l1' }],
      listings: [{ id: 'l1', status: 'active', title: 'Vélo' }],
    })
    const favorites = await fetchUserFavorites(client, me)
    expect(favorites.map((item) => item.title)).toEqual(['Vélo'])
  })
})

describe('parcelsService', () => {
  it('fenêtre de 50 comme le web et décompte des archives', async () => {
    const client = createFakeClient({
      parcels: [
        { id: 'p1', status: 'active', departure_date: '2999-01-01' },
        { id: 'p2', status: 'completed', departure_date: '2999-01-01' },
        { id: 'p3', status: 'active', departure_date: '2000-01-01' },
      ],
    })
    const { counts } = await fetchParcelBrowse(client)
    expect(counts).toEqual({ active: 1, archived: 2, total: 3 })
    expect(opsOf(client, 'parcels')[0].at(-1)).toEqual(['limit', PARCELS_PUBLIC_LIMIT])
  })
})

describe('accountService', () => {
  it('avis reçus sur le profil (reviews) + moyenne', async () => {
    const { fetchProfileReviews } = await import('./accountService.js')
    const client = createFakeClient({ reviews: [{ id: 'r1', rating: 4, status: 'published' }, { id: 'r2', rating: 5 }] })
    const result = await fetchProfileReviews(client, me)
    expect(result.average).toBe(4.5)
    expect(opsOf(client, 'reviews')[0]).toContainEqual(['eq', 'target_type', 'user_profile'])
  })

  it('statut de vérification depuis verification_requests', async () => {
    const { fetchVerificationStatus } = await import('./accountService.js')
    const client = createFakeClient({ verification_requests: [{ id: 'v1', status: 'pending_review', created_at: '2026-09-01' }] })
    const result = await fetchVerificationStatus(client, me)
    expect(result.latest.status).toBe('pending_review')
    expect(result.verified).toBe(false)
  })
})
