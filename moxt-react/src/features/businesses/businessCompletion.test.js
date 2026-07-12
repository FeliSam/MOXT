import { describe, expect, it } from 'vitest'
import { calculateBusinessCompletion, getBusinessCompletionStatus } from './businessCompletion'

describe('businessCompletion', () => {
  it('calcule le pourcentage et liste les éléments manquants', () => {
    const status = getBusinessCompletionStatus({ name: 'MOXT' }, [])
    expect(status.percent).toBeGreaterThan(0)
    expect(status.missing.some((item) => item.key === 'sector')).toBe(true)
    expect(status.missing.some((item) => item.key === 'name')).toBe(false)
  })

  it('ignore le délai moyen sans module Transfert', () => {
    const business = {
      name: 'MOXT',
      sector: 'Services',
      country: 'RU',
      city: 'Moscou',
      phone: '+7900',
      description: 'Desc',
      services: ['Marketplace'],
      status: 'pending_review',
    }
    const status = getBusinessCompletionStatus(business, [{ id: 'd1' }])
    expect(status.items.some((item) => item.key === 'averageDelay')).toBe(false)
    expect(status.missing.map((item) => item.key)).toEqual(['verified'])
  })

  it('atteint 100 % quand tout est complété et validé', () => {
    const business = {
      name: 'MOXT',
      sector: 'Services',
      country: 'RU',
      city: 'Moscou',
      phone: '+7900',
      description: 'Desc',
      services: ['Transfert'],
      averageDelay: '15 min',
      status: 'verified',
    }
    expect(calculateBusinessCompletion(business, [{ id: 'd1' }])).toBe(100)
  })
})
