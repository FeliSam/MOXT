import { describe, expect, it } from 'vitest'
import {
  canClientDeclarePayment,
  canRevealPaymentDetails,
  isBusinessAcceptanceBlocking,
  sanitizeTransferPaymentVisibility,
} from './transferAcceptanceUtils'
import { TRANSFER_STATUS } from './transferConfig'

describe('transferAcceptanceUtils', () => {
  it('bloque le paiement tant que la pre-acceptation nest pas resolue', () => {
    const transfer = {
      status: TRANSFER_STATUS.PENDING,
      acceptanceRequired: true,
      acceptanceResolvedAt: null,
      exchanger: { paymentDetails: { phone: '+7900' } },
    }

    expect(isBusinessAcceptanceBlocking(transfer)).toBe(true)
    expect(canRevealPaymentDetails(transfer)).toBe(false)
    expect(canClientDeclarePayment(transfer)).toBe(false)
    expect(sanitizeTransferPaymentVisibility(transfer).exchanger.paymentDetails).toBeNull()
  })

  it('debloque apres acceptation entreprise', () => {
    const transfer = {
      status: TRANSFER_STATUS.PENDING,
      acceptanceRequired: true,
      acceptanceResolvedAt: '2026-08-13T08:00:00.000Z',
      exchanger: { paymentDetails: { phone: '+7900' } },
    }

    expect(isBusinessAcceptanceBlocking(transfer)).toBe(false)
    expect(canRevealPaymentDetails(transfer)).toBe(true)
    expect(canClientDeclarePayment(transfer)).toBe(true)
  })

  it('bloque si des coordonnees en attente existent sans acceptation resolue', () => {
    const transfer = {
      status: TRANSFER_STATUS.PENDING,
      acceptanceRequired: false,
      acceptanceResolvedAt: null,
      pendingPaymentDetails: { phone: '+2290198005544' },
      exchanger: { paymentDetails: { phone: '+2290198005544' } },
    }

    expect(canRevealPaymentDetails(transfer)).toBe(false)
    expect(sanitizeTransferPaymentVisibility(transfer).exchanger.paymentDetails).toBeNull()
  })
})
