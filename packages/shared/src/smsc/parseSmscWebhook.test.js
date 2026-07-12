import { describe, expect, it } from 'vitest'
import { parseSmscWebhookPayload, readSmscField } from './parseSmscWebhook.js'

describe('parseSmscWebhookPayload', () => {
  it('parse un SMS entrant', () => {
    const event = parseSmscWebhookPayload({
      phone: '79001234567',
      mes: 'OUI',
      id: '998877',
      to: '79007654321',
    })
    expect(event).toMatchObject({
      kind: 'incoming',
      smscId: '998877',
      fromPhone: '79001234567',
      toPhone: '79007654321',
      message: 'OUI',
    })
  })

  it('parse un statut de livraison', () => {
    const event = parseSmscWebhookPayload({
      phone: '79001234567',
      status: 'delivered',
      id: '112233',
      ts: '1752300000',
    })
    expect(event).toMatchObject({
      kind: 'status',
      smscId: '112233',
      fromPhone: '79001234567',
      deliveryStatus: 'delivered',
      eventTime: '1752300000',
    })
  })

  it('retourne null si payload incomplet', () => {
    expect(parseSmscWebhookPayload({ phone: '7900' })).toBeNull()
  })
})

describe('readSmscField', () => {
  it('lit la première clé disponible', () => {
    expect(readSmscField({ mes: 'hello', message: 'world' }, 'mes', 'message')).toBe('hello')
  })
})
