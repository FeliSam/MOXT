import { beforeEach, describe, expect, it } from 'vitest'
import reducer, {
  addListingQuestion,
  answerListingQuestion,
  createListing,
  deleteListing,
  duplicateListing,
  expireListings,
  reportListing,
  incrementListingContact,
  incrementListingShare,
  normalizeListing,
  receiveRemoteListing,
  toggleListingFavorite,
  updateListing,
  updateListingStatus,
} from './marketplaceSlice'
import { listingFromRemoteRow } from './marketplaceRemote'

const listing = {
  ownerId: 'owner',
  sellerName: 'Vendeur',
  type: 'product',
  category: 'Telephone',
  title: 'Telephone neuf',
  description: 'Un telephone neuf avec tous ses accessoires.',
  price: 100000,
  currency: 'XOF',
  city: 'Cotonou',
  contact: '+2290190000000',
}

describe('marketplaceSlice', () => {
  beforeEach(() => localStorage.clear())

  it('cree une annonce active', () => {
    const state = reducer({ items: [] }, createListing(listing))
    expect(state.items[0].status).toBe('active')
    expect(state.items[0].country).toBe('RU')
    expect(state.items[0].currency).toBe('RUB')
  })

  it("supprime l'état produit d'une annonce alimentaire", () => {
    const state = reducer(
      { items: [] },
      createListing({
        ...listing,
        type: 'food',
        category: 'food_prepared',
        condition: 'used',
        weight: '500 g',
        ingredients: 'Riz',
      }),
    )

    expect(state.items[0].condition).toBeNull()
    expect(state.items[0].weight).toBe('500 g')
  })

  it('duplique une annonce en brouillon sans reprendre ses interactions', () => {
    const created = reducer({ items: [] }, createListing(listing))
    const source = {
      ...created.items[0],
      views: 12,
      favorites: ['u1'],
      questions: [{ id: 'q1' }],
    }
    const state = reducer(
      { ...created, items: [source] },
      duplicateListing({ listing: source, ownerId: listing.ownerId }),
    )

    expect(state.items[0].status).toBe('draft')
    expect(state.items[0].title).toContain('Copie de')
    expect(state.items[0].views).toBe(0)
    expect(state.items[0].favorites).toEqual([])
    expect(state.items[0].questions).toEqual([])
  })

  it('normalise une ancienne annonce avant affichage', () => {
    const normalized = normalizeListing({
      id: 'legacy',
      title: 'Ancienne annonce',
      views: undefined,
      contact: '8 900 000 00 01',
    })

    expect(normalized.deliveryOptions).toEqual(['pickup'])
    expect(normalized.paymentMethods).toEqual(['À convenir dans la messagerie'])
    expect(normalized.favorites).toEqual([])
    expect(normalized.questions).toEqual([])
    expect(normalized.stock).toBe(1)
    expect(normalized.country).toBe('RU')
    expect(normalized.contact).toBe('89000000001')
  })

  it('ajoute puis retire un favori sans doublon', () => {
    const created = reducer({ items: [] }, createListing(listing))
    const id = created.items[0].id
    const favorite = reducer(created, toggleListingFavorite({ listingId: id, userId: 'u1' }))
    const removed = reducer(favorite, toggleListingFavorite({ listingId: id, userId: 'u1' }))
    expect(favorite.items[0].favorites).toEqual(['u1'])
    expect(removed.items[0].favorites).toEqual([])
  })

  it('historise les statuts et évite les signalements actifs en double', () => {
    const created = reducer({ items: [], reports: [] }, createListing(listing))
    const id = created.items[0].id
    const sold = reducer(
      created,
      updateListingStatus({ id, status: 'sold', actorId: listing.ownerId }),
    )
    const reported = reducer(
      sold,
      reportListing({ listingId: id, reporterId: 'u2', reason: 'Suspect' }),
    )
    const duplicate = reducer(
      reported,
      reportListing({ listingId: id, reporterId: 'u2', reason: 'Encore' }),
    )

    expect(sold.items[0].history.at(-1).status).toBe('sold')
    expect(duplicate.reports).toHaveLength(1)
  })
  it('modifie, expire et supprime uniquement pour le propriétaire', () => {
    const created = reducer({ items: [], reports: [] }, createListing(listing))
    const id = created.items[0].id
    const updated = reducer(
      created,
      updateListing({ id, ownerId: 'owner', changes: { title: 'Titre modifié', price: 12 } }),
    )
    const expired = reducer(
      {
        ...updated,
        items: [{ ...updated.items[0], expiresAt: '2020-01-01T00:00:00.000Z' }],
      },
      expireListings('2021-01-01T00:00:00.000Z'),
    )
    const untouched = reducer(expired, deleteListing({ id, ownerId: 'intrus' }))
    const removed = reducer(untouched, deleteListing({ id, ownerId: 'owner' }))

    expect(updated.items[0].title).toBe('Titre modifié')
    expect(expired.items[0].status).toBe('expired')
    expect(untouched.items).toHaveLength(1)
    expect(removed.items).toHaveLength(0)
  })

  it('enregistre les interactions enrichies et reste compatible avec une ancienne annonce', () => {
    const legacy = {
      items: [{ ...listing, id: 'legacy', favorites: undefined, views: undefined }],
      reports: [],
    }
    const viewed = reducer(legacy, { type: 'marketplace/incrementListingView', payload: 'legacy' })
    const contacted = reducer(viewed, incrementListingContact('legacy'))
    const shared = reducer(contacted, incrementListingShare('legacy'))
    const questioned = reducer(
      shared,
      addListingQuestion({
        listingId: 'legacy',
        authorId: 'u1',
        authorName: 'Utilisateur',
        text: 'Le produit est-il encore disponible ?',
      }),
    )
    const favorite = reducer(
      questioned,
      toggleListingFavorite({ listingId: 'legacy', userId: 'u1' }),
    )

    expect(favorite.items[0].views).toBe(1)
    expect(favorite.items[0].contactCount).toBe(1)
    expect(favorite.items[0].shareCount).toBe(1)
    expect(favorite.items[0].questions).toHaveLength(1)
    expect(favorite.items[0].favorites).toEqual(['u1'])
  })

  it('permet au vendeur de répondre à une question publique', () => {
    const created = reducer({ items: [] }, createListing(listing))
    const id = created.items[0].id
    const withQuestion = reducer(
      created,
      addListingQuestion({
        listingId: id,
        authorId: 'buyer',
        authorName: 'Acheteur',
        text: 'Est-ce encore disponible ?',
      }),
    )
    const answered = reducer(
      withQuestion,
      answerListingQuestion({
        listingId: id,
        questionId: withQuestion.items[0].questions[0].id,
        ownerId: listing.ownerId,
        answer: 'Oui, toujours disponible.',
      }),
    )

    expect(answered.items[0].questions[0].answer).toBe('Oui, toujours disponible.')
    expect(answered.items[0].questions[0].answeredAt).toBeTruthy()
  })

  it('fusionne une annonce distante sans créer de doublon', () => {
    const remote = listingFromRemoteRow({
      id: 'ANN-REMOTE',
      owner_id: 'owner',
      title: 'Annonce partagée',
      status: 'active',
      city: 'Moscou',
      images: ['https://example.test/image.webp'],
      payload: {
        id: 'ANN-REMOTE',
        ownerId: 'owner',
        title: 'Ancien titre',
        description: 'Une annonce visible sur plusieurs appareils.',
        contact: '+79000000000',
      },
    })

    const first = reducer({ items: [] }, receiveRemoteListing(remote))
    const updated = reducer(
      first,
      receiveRemoteListing({ ...remote, title: 'Annonce mise à jour' }),
    )

    expect(updated.items).toHaveLength(1)
    expect(updated.items[0].title).toBe('Annonce mise à jour')
    expect(updated.items[0].ownerId).toBe('owner')
  })
})
