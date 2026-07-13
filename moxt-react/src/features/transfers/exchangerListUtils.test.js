import { describe, expect, it } from 'vitest'
import { DIRECTIONS } from './transferConfig'
import {
  businessToExchangerOption,
  exchangerMatchesUserCountry,
  listExchangersForTransfer,
  resolveExchangerCountry,
  resolveExchangerDisplayCountry,
  resolveExchangerForDetail,
  resolveExchangerOriginCountry,
  resolveUserTransferCountry,
} from './exchangerListUtils'

const ruBusiness = {
  id: 'BIZ-RU',
  ownerId: 'owner-ru',
  name: 'Change Moscou',
  status: 'verified',
  services: ['Transfert'],
  country: 'RU',
  rating: 4.8,
  feePercent: 2.5,
  logoUrl: 'https://cdn.example/logo-ru.png',
  transferAccounts: [{ slot: 'ru', country: 'RU', active: true, isDefault: true }],
}

const bjBusiness = {
  id: 'BIZ-BJ',
  ownerId: 'owner-bj',
  name: 'Change Cotonou',
  status: 'active',
  services: ['Transfert'],
  country: 'RU',
  rating: 4.5,
  logoUrl: 'https://cdn.example/logo-bj.png',
  transferAccounts: [{ slot: 'origin', country: 'BJ', active: true, isDefault: true }],
}

const tgBusiness = {
  id: 'BIZ-TG',
  ownerId: 'owner-tg',
  name: 'Change Lomé',
  status: 'active',
  services: ['Transfert'],
  country: 'RU',
  rating: 4.2,
  transferAccounts: [{ slot: 'origin', country: 'TG', active: true, isDefault: true }],
}

const cmBusiness = {
  id: 'BIZ-CM',
  ownerId: 'owner-cm',
  name: 'Change Douala',
  status: 'active',
  services: ['Transfert'],
  country: 'RU',
  rating: 4.4,
  transferAccounts: [{ slot: 'origin', country: 'CM', active: true, isDefault: true }],
}

describe('exchangerListUtils', () => {
  it('résout le pays transfert de l utilisateur', () => {
    expect(resolveUserTransferCountry({ country: 'RU', originCountry: 'BJ' }, 'BJ')).toBe('RU')
    expect(resolveUserTransferCountry({ country: 'BJ', originCountry: 'BJ' }, 'BJ')).toBe('BJ')
    expect(resolveUserTransferCountry({ country: 'RU', originCountry: 'TG' }, 'BJ')).toBe('RU')
  })

  it('ignore business.country (localisation RU) pour le pays partenaire', () => {
    expect(resolveExchangerOriginCountry(bjBusiness, 'BJ')).toBe('BJ')
    expect(resolveExchangerCountry(ruBusiness, 'RU', 'BJ')).toBe('RU')
    expect(resolveExchangerCountry(bjBusiness, 'BJ', 'BJ')).toBe('BJ')
  })

  it('filtre les échangeurs du pays utilisateur uniquement', () => {
    const rows = listExchangersForTransfer({
      businesses: [ruBusiness, bjBusiness, tgBusiness],
      user: { id: 'u1', country: 'RU', originCountry: 'BJ' },
      originCountry: 'BJ',
      direction: DIRECTIONS.RU_TO_BJ,
      excludeOwnerId: 'u1',
    })

    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('BIZ-RU')
    expect(rows[0].country).toBe('RU')
  })

  it('un membre béninois ne voit pas les échangeurs togolais', () => {
    expect(exchangerMatchesUserCountry(bjBusiness, 'BJ', 'BJ')).toBe(true)
    expect(exchangerMatchesUserCountry(tgBusiness, 'BJ', 'BJ')).toBe(false)

    const rows = listExchangersForTransfer({
      businesses: [bjBusiness, tgBusiness],
      user: { id: 'u2', country: 'RU', originCountry: 'BJ' },
      originCountry: 'BJ',
      direction: DIRECTIONS.BJ_TO_RU,
    })

    expect(rows.map((row) => row.id)).toEqual(['BIZ-BJ'])
    expect(businessToExchangerOption(bjBusiness, 'BJ', 'BJ').country).toBe('BJ')
  })

  it('un membre camerounais ne voit pas les échangeurs béninois sur la page transfert', () => {
    const rows = listExchangersForTransfer({
      businesses: [bjBusiness, cmBusiness, tgBusiness],
      user: { id: 'u-cm', country: 'RU', originCountry: 'CM' },
      originCountry: 'CM',
      direction: DIRECTIONS.BJ_TO_RU,
      excludeOwnerId: 'u-cm',
    })

    expect(rows.map((row) => row.id)).toEqual(['BIZ-CM'])
  })

  it('exclut les échangeurs sans compte de transfert configuré', () => {
    const rows = listExchangersForTransfer({
      businesses: [
        {
          ...bjBusiness,
          id: 'BIZ-EMPTY',
          transferAccounts: [],
        },
      ],
      user: { id: 'u2', country: 'RU', originCountry: 'BJ' },
      originCountry: 'BJ',
      direction: DIRECTIONS.BJ_TO_RU,
    })

    expect(rows).toHaveLength(0)
  })

  it('affiche le drapeau du pays d origine quand les comptes RU et origine coexistent', () => {
    const dualBusiness = {
      ...bjBusiness,
      id: 'BIZ-DUAL',
      transferAccounts: [
        { slot: 'ru', country: 'RU', active: true },
        { slot: 'origin', country: 'BJ', active: true, isDefault: true },
      ],
    }

    expect(resolveExchangerDisplayCountry(dualBusiness, 'BJ')).toBe('BJ')
    expect(resolveExchangerCountry(dualBusiness, 'RU', 'BJ')).toBe('RU')
  })

  it('peut lister tous les échangeurs sans filtre pays', () => {
    const rows = listExchangersForTransfer({
      businesses: [bjBusiness, tgBusiness],
      user: { id: 'u2', country: 'RU', originCountry: 'BJ' },
      originCountry: 'BJ',
      includeAllCountries: true,
    })

    expect(rows.map((row) => row.id).sort()).toEqual(['BIZ-BJ', 'BIZ-TG'])
  })

  it('ouvre la fiche détail d un échangeur hors pays quand scope=all', () => {
    const resolved = resolveExchangerForDetail({
      businesses: [bjBusiness, tgBusiness],
      exchangerId: 'BIZ-TG',
      user: { id: 'u2', country: 'RU', originCountry: 'BJ' },
      originCountry: 'BJ',
      allowAllCountries: true,
    })

    expect(resolved?.exchanger?.id).toBe('BIZ-TG')
  })

  it('refuse la fiche détail hors pays sans scope=all', () => {
    const resolved = resolveExchangerForDetail({
      businesses: [bjBusiness, tgBusiness],
      exchangerId: 'BIZ-TG',
      user: { id: 'u2', country: 'RU', originCountry: 'BJ' },
      originCountry: 'BJ',
    })

    expect(resolved).toBeNull()
  })
})
