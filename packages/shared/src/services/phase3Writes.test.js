import { describe, expect, it } from 'vitest'
import { createFakeClient } from './testClient.js'
import { archiveStatus, deletePublication, republishStatus, setPublicationStatus, updatePublicationFields } from './publicationMutations.js'
import { incrementEntityView } from './viewsService.js'
import { buildAuthorNotice, createAuthorNotification, newsPostPath } from './authorNotifications.js'
import { askMoxti, recentAssistantHistory } from './assistantService.js'
import { buildBusinessContactSnapshot, openContactConversation, participantKey } from './contactService.js'
import { buildPersonalDocumentPath, personalDocumentRow, submitVerificationRequest, updateAccountPreferences } from './accountWrites.js'
import { buildPost, createParcel, createP2POffer, parcelRequestRow, STAR_GIFT_AMOUNTS } from './contentWrites.js'
import { archiveNotification } from './notificationsService.js'
import { advanceP2pOrder, withP2pProof } from './p2pOrderWrites.js'

const me = '11111111-1111-4111-8111-111111111111'
const owner = '22222222-2222-4222-8222-222222222222'

describe('publicationMutations', () => {
  it('archive et republie avec les statuts du web', async () => {
    expect(archiveStatus()).toBe('archived')
    expect(republishStatus('listing')).toBe('active')
    expect(republishStatus('event')).toBe('published')
    expect(republishStatus('post')).toBe('published')
    const client = createFakeClient()
    await setPublicationStatus(client, 'listing', 'L1', 'archived', new Date('2026-09-01T00:00:00Z'))
    await setPublicationStatus(client, 'post', 'P1', 'archived', new Date('2026-09-01T00:00:00Z'))
    await deletePublication(client, 'video', 'V1')
    expect(client.calls[0]).toMatchObject({ table: 'listings' })
    expect(client.calls[0].ops[0][1]).toEqual({ status: 'archived' })
    expect(client.calls[1].ops[0][1].updated_at).toBe('2026-09-01T00:00:00.000Z')
    expect(client.calls[2].ops[0][0]).toBe('delete')
  })

  it('enregistre les photos et fusionne le payload', async () => {
    const client = createFakeClient()
    await updatePublicationFields(
      client,
      'listing',
      'L1',
      { title: 'Lampe', images: ['https://cdn.example/a.jpg'], payload: { city: 'Moscou' } },
      new Date('2026-09-02T00:00:00Z'),
    )
    const patch = client.calls[0].ops[0][1]
    expect(patch.title).toBe('Lampe')
    expect(patch.images).toEqual(['https://cdn.example/a.jpg'])
    expect(patch.payload.images).toEqual(['https://cdn.example/a.jpg'])
    expect(patch.payload.city).toBe('Moscou')
    expect(patch.updated_at).toBe('2026-09-02T00:00:00.000Z')
  })
})

describe('viewsService', () => {
  it('appelle moxt_increment_view et ignore une erreur', async () => {
    const client = createFakeClient({}, { rpc: { moxt_increment_view: { data: 4, error: null } } })
    expect(await incrementEntityView(client, 'video', 'v1')).toBe(4)
    expect(client.calls[0]).toEqual({
      rpc: 'moxt_increment_view',
      args: { p_entity_type: 'video', p_entity_id: 'v1' },
    })
    const failing = createFakeClient()
    expect(await incrementEntityView(failing, 'video', 'v1')).toBeNull()
  })
})

describe('authorNotifications', () => {
  it('ne notifie pas soi-même et reprend les textes du web', () => {
    expect(buildAuthorNotice({ kind: 'like', recipientId: me, actorId: me, actorName: 'A' })).toBeNull()
    const notice = buildAuthorNotice({
      kind: 'comment',
      recipientId: owner,
      actorId: me,
      actorName: 'Awa',
      text: 'Bravo',
      link: newsPostPath('p1'),
    })
    expect(notice).toMatchObject({
      userId: owner,
      title: 'Nouveau commentaire',
      message: 'Awa : « Bravo »',
      type: 'post',
      link: '/news/p1',
    })
  })

  it('persiste via moxt_create_notification', async () => {
    const client = createFakeClient({}, { rpc: { moxt_create_notification: { data: null, error: null } } })
    const notice = buildAuthorNotice({ kind: 'subscription', recipientId: owner, actorId: me, actorName: 'Awa' })
    await createAuthorNotification(client, notice)
    expect(client.calls[0].rpc).toBe('moxt_create_notification')
    expect(client.calls[0].args.p_user_id).toBe(owner)
    expect(client.calls[0].args.p_type).toBe('subscription')
  })
})

describe('assistantService', () => {
  it('envoie le même corps que le web à ai-assistant', async () => {
    const bodies = []
    const client = {
      functions: {
        invoke: async (name, { body }) => {
          bodies.push({ name, body })
          return { data: { text: 'Bonjour', actionIds: ['transfers'], followUps: ['Et le P2P ?'], provider: 'yandex-ai' }, error: null }
        },
      },
    }
    const answer = await askMoxti(client, {
      question: 'Comment transférer ?',
      history: [{ role: 'user', text: 'salut' }],
      language: 'fr',
    })
    expect(bodies[0].name).toBe('ai-assistant')
    expect(bodies[0].body.question).toBe('Comment transférer ?')
    expect(bodies[0].body.history).toEqual([{ role: 'user', text: 'salut' }])
    expect(bodies[0].body.candidates.some((item) => item.id === 'transfers')).toBe(true)
    expect(answer.text).toBe('Bonjour')
    expect(answer.actions[0].path).toBe('/transfers')
    expect(recentAssistantHistory([{ text: '' }, { role: 'assistant', text: 'ok' }])).toEqual([{ role: 'assistant', text: 'ok' }])
  })
})

describe('contactService', () => {
  it('crée une conversation entreprise avec la clé de participants', async () => {
    const client = createFakeClient({ profiles: [], conversations: [] })
    const snapshot = buildBusinessContactSnapshot({ id: 'b1', name: 'Cargo', city: 'Cotonou', logoUrl: 'logo' })
    const result = await openContactConversation(client, {
      createdBy: me,
      ownerId: owner,
      relatedType: 'business',
      relatedId: 'b1',
      relatedSnapshot: snapshot,
    })
    expect(participantKey([owner, me])).toBe(`${me}:${owner}`)
    expect(result.created).toBe(true)
    expect(result.contextAlreadyLinked).toBe(false)
    const upsert = client.calls.find((call) => call.table === 'conversations' && call.ops.some((op) => op[0] === 'upsert'))
    const row = upsert.ops.find((op) => op[0] === 'upsert')[1]
    expect(row.participant_key).toBe(`${me}:${owner}`)
    expect(row.related_type).toBe('business')
    expect(row.related_snapshot.title).toBe('Cargo')
    expect(row.related_contexts).toHaveLength(1)
  })
})

describe('accountWrites', () => {
  it('adresse un document et enregistre la préférence de bannière', async () => {
    expect(buildPersonalDocumentPath(me, 'identity_passport', 'passeport.pdf', 10)).toBe(
      `${me}/identity_passport/10-passeport.pdf`,
    )
    expect(personalDocumentRow({ id: 'd1', userId: me, category: 'selfie', name: 's.jpg', storagePath: 'p' }).storage_path).toBe('p')
    const client = createFakeClient()
    const prefs = await updateAccountPreferences(client, me, { coverStyle: 'woman-d-prune' }, { language: 'fr' })
    expect(prefs.coverStyle).toBe('woman-d-prune')
    expect(client.calls[0].ops[0][1].preferences.language).toBe('fr')
  })

  it('insère la demande de vérification', async () => {
    const client = createFakeClient()
    const request = await submitVerificationRequest(client, { userId: me, level: 'identity', documentIds: ['d1'] })
    expect(request.status).toBe('pending_review')
    expect(client.calls[0].table).toBe('verification_requests')
    expect(client.calls[0].ops[0][0]).toBe('insert')
    expect(client.calls[0].ops[0][1].document_ids).toEqual(['d1'])
  })
})

describe('contentWrites', () => {
  it('prépare une offre P2P, un colis et une réservation comme le web', async () => {
    const client = createFakeClient()
    const offer = await createP2POffer(client, {
      ownerId: me,
      ownerName: 'Awa',
      amount: 10000,
      fromCurrency: 'RUB',
      toCurrency: 'XOF',
      rate: 7,
    })
    expect(offer.status).toBe('active')
    expect(client.calls[0].table).toBe('p2p_offers')
    const parcel = await createParcel(client, {
      ownerId: me,
      origin: 'Moscou',
      destination: 'Cotonou',
      departureDate: '2026-10-01',
      capacityKg: 5,
      pricePerKg: 500,
    })
    expect(parcel.remainingKg).toBe(5)
    expect(client.calls[1].table).toBe('parcels')
    const request = parcelRequestRow({ parcelId: parcel.id, userId: owner, ownerId: me, kg: 2, requesterName: 'Ken' })
    expect(request.status).toBe('submitted')
    expect(request.kg).toBe(2)
    expect(buildPost({ authorId: me, message: 'Salut' }).status).toBe('published')
    expect(STAR_GIFT_AMOUNTS).toEqual([5, 10, 25, 50])
  })
})

describe('p2pOrderWrites', () => {
  it('suit les mêmes étapes que le web', () => {
    const created = { status: 'created', sellerId: 'seller', proofs: [], timeline: [] }
    const accepted = advanceP2pOrder(created, 'seller_accepted', null, new Date('2026-09-01T00:00:00Z'))
    expect(accepted.status).toBe('seller_accepted')
    expect(accepted.paymentDueAt).toBeTruthy()
    const waiting = advanceP2pOrder(accepted, 'waiting_payment')
    expect(() => advanceP2pOrder(waiting, 'completed')).toThrow(/preuve/)
    const proved = withP2pProof(waiting, { userId: 'seller', name: 'recu.jpg' })
    expect(advanceP2pOrder(proved, 'completed').status).toBe('completed')
  })
})

describe('archiveNotification', () => {
  it('archive comme le middleware web', async () => {
    const client = createFakeClient()
    await archiveNotification(client, { id: 'n1', userId: me })
    expect(client.calls[0].ops[0][1].archived).toBe(true)
    expect(client.calls[0].ops[2]).toEqual(['eq', 'user_id', me])
  })
})
