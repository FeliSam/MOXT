import { describe, expect, it } from 'vitest'
import {
  belongsToBusiness,
  calculateBusinessCompletion,
  calculateBusinessRating,
} from './businessSelectors'

describe('belongsToBusiness', () => {
  const business = { id: 'BIZ-1', ownerId: 'USER-1' }

  it('relie les nouvelles donnees par businessId', () => {
    expect(belongsToBusiness({ businessId: 'BIZ-1', ownerId: 'USER-1' }, business)).toBe(true)
  })

  it('reste compatible avec les donnees historiques sans businessId', () => {
    expect(belongsToBusiness({ ownerId: 'USER-1' }, business)).toBe(true)
  })

  it('calcule la complétion et la note publiée', () => {
    expect(calculateBusinessCompletion({ name: 'MOXT' })).toBe(10)
    expect(
      calculateBusinessRating([
        { rating: 5, status: 'published' },
        { rating: 1, status: 'suspended' },
      ]),
    ).toEqual({ average: 5, count: 1 })
  })
})
