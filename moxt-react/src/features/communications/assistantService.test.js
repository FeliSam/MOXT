import { describe, expect, it } from 'vitest'
import { localAssistantProvider } from './assistantProvider'

describe('assistant MOXT', () => {
  it('répond avec une aide adaptée au module demandé', async () => {
    const transfer = await localAssistantProvider.respond({
      question: 'Comment faire un transfert ?',
      searchIndex: [],
    })
    expect(transfer.text).toMatch(/transfert/i)
    expect(transfer.actions.some((action) => action.path === '/transfers/new')).toBe(true)

    const parcel = await localAssistantProvider.respond({
      question: 'Je cherche un colis',
      searchIndex: [],
    })
    expect(parcel.text).toMatch(/colis/i)
    expect(parcel.actions.some((action) => action.path === '/parcels')).toBe(true)
  })
})
