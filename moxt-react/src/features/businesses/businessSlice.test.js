import { beforeEach, describe, expect, it } from 'vitest'
import reducer, {
  addBusinessMember,
  moderateBusiness,
  saveBusiness,
  updateBusinessTransferAccounts,
} from './businessSlice'

describe('businessSlice', () => {
  beforeEach(() => localStorage.clear())

  it('cree une demande professionnelle en attente de validation', () => {
    const state = reducer(
      { items: [] },
      saveBusiness({
        ownerId: 'u1',
        name: 'Moxt Express',
        sector: 'Transport',
        country: 'BJ_RU',
        city: 'Cotonou',
        phone: '+2290190000000',
        description: 'Transport et echange entre le Benin et la Russie.',
        feePercent: 2.5,
        averageDelay: '30 min',
        services: ['Colis'],
      }),
    )

    expect(state.items[0].status).toBe('pending_review')
    expect(state.items[0].ownerId).toBe('u1')
  })

  it('met a jour le profil existant du meme proprietaire', () => {
    const first = reducer(
      { items: [] },
      saveBusiness({
        ownerId: 'u1',
        name: 'Premier nom',
        sector: 'Transport',
        country: 'BJ',
        city: 'Cotonou',
        phone: '+2290190000000',
        description: 'Une description suffisamment longue.',
        feePercent: 2.5,
        averageDelay: '30 min',
      }),
    )
    const updated = reducer(first, saveBusiness({ ...first.items[0], name: 'Nouveau nom' }))

    expect(updated.items).toHaveLength(1)
    expect(updated.items[0].name).toBe('Nouveau nom')
  })

  it('permet une moderation explicite du statut', () => {
    const state = reducer(
      { items: [{ id: 'b1', status: 'pending_review' }] },
      moderateBusiness({ id: 'b1', status: 'verified' }),
    )
    expect(state.items[0].status).toBe('verified')
  })

  it('conserve les paramètres des entreprises de transfert', () => {
    const state = reducer(
      { items: [] },
      saveBusiness({
        ownerId: 'u1',
        name: 'Moxt Change',
        sector: 'finance',
        country: 'RU',
        city: 'Moscou',
        phone: '+79000000000',
        description: 'Service professionnel de transfert entre la Russie et le Bénin.',
        feePercent: 2,
        averageDelay: '20 min',
        currencies: ['XOF', 'RUB'],
        exchangeMethods: ['Sberbank', 'MTN MoMo'],
        services: ['Transfert'],
      }),
    )
    expect(state.items[0]).toMatchObject({
      currencies: ['XOF', 'RUB'],
      exchangeMethods: ['Sberbank', 'MTN MoMo'],
    })
  })

  it('ajoute un membre rattaché à une entreprise', () => {
    const state = reducer(
      { items: [], members: [] },
      addBusinessMember({ businessId: 'b1', email: 'agent@moxt.test', role: 'agent' }),
    )
    expect(state.members[0]).toMatchObject({ businessId: 'b1', role: 'agent', status: 'active' })
  })

  it('permet au proprietaire de configurer les coordonnees de reception transfert', () => {
    const created = reducer(
      { items: [] },
      saveBusiness({
        ownerId: 'u1',
        name: 'Moxt Change',
        sector: 'finance',
        country: 'RU',
        city: 'Moscou',
        phone: '+79000000000',
        description: 'Service professionnel de transfert entre la Russie et le Benin.',
        feePercent: 2,
        averageDelay: '20 min',
        services: ['Transfert'],
      }),
    )
    const business = created.items[0]
    const updated = reducer(
      created,
      updateBusinessTransferAccounts({
        businessId: business.id,
        ownerId: 'u1',
        accounts: [
          {
            label: 'MTN principal',
            method: 'MTN MoMo',
            recipientName: 'Moxt Change',
            phone: '+2290190000000',
            instructions: 'Mettre la reference MOXT en commentaire.',
          },
        ],
      }),
    )

    expect(updated.items[0].transferAccounts[0]).toMatchObject({
      label: 'MTN principal',
      method: 'MTN MoMo',
      recipientName: 'Moxt Change',
      phone: '+2290190000000',
      active: true,
    })
  })
})
