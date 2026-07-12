import { describe, expect, it } from 'vitest'
import { DIRECTIONS } from './transferConfig'
import {
  businessToExchangerOption,
  listExchangersForTransfer,
  resolveExchangerCountry,
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
  country: 'BJ',
  rating: 4.5,
  logoUrl: 'https://cdn.example/logo-bj.png',
  transferAccounts: [{ slot: 'origin', country: 'BJ', active: true, isDefault: true }],
}

describe('exchangerListUtils', () => {
  it('résout le pays transfert de l utilisateur', () => {
    expect(resolveUserTransferCountry({ country: 'RU', originCountry: 'BJ' }, 'BJ')).toBe('RU')
    expect(resolveUserTransferCountry({ country: 'BJ', originCountry: 'BJ' }, 'BJ')).toBe('BJ')
  })

  it('filtre les échangeurs du pays utilisateur uniquement', () => {
    const rows = listExchangersForTransfer({
      businesses: [ruBusiness, bjBusiness],
      user: { id: 'u1', country: 'RU', originCountry: 'BJ' },
      originCountry: 'BJ',
      direction: DIRECTIONS.RU_TO_BJ,
      excludeOwnerId: 'u1',
    })

    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('BIZ-RU')
    expect(rows[0].logoUrl).toContain('logo-ru')
  })

  it('classe les échangeurs du pays utilisateur en premier', () => {
    const mixedRu = {
      ...ruBusiness,
      id: 'BIZ-RU-2',
      name: 'Zeta Change',
      rating: 3,
    }
    const rows = listExchangersForTransfer({
      businesses: [mixedRu, { ...ruBusiness, id: 'BIZ-RU-1', name: 'Alpha Change', rating: 5 }],
      user: { id: 'u1', country: 'RU', originCountry: 'BJ' },
      originCountry: 'BJ',
      direction: DIRECTIONS.RU_TO_BJ,
    })

    expect(rows[0].name).toBe('Alpha Change')
    expect(resolveExchangerCountry(ruBusiness, 'BJ')).toBe('RU')
    expect(businessToExchangerOption(ruBusiness, 'BJ').country).toBe('RU')
  })
})
