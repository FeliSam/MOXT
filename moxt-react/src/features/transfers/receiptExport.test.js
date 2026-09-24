import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}))

import {
  buildReceiptHtml,
  buildReceiptModel,
  downloadBlob,
  downloadReceiptPdf,
  printReceipt,
  receiptLines,
  receiptStatusLabel,
} from './receiptExport'

const sampleTransfer = {
  id: 'MXT-TEST',
  status: 'pending_payment',
  direction: 'BJ_TO_RU',
  currencyFrom: 'XOF',
  currencyTo: 'RUB',
  amountSent: 10000,
  fees: 250,
  feePercent: 2.5,
  totalToPay: 10250,
  amountReceived: 1000,
  createdAt: '2026-09-24T10:00:00.000Z',
  sender: { firstName: 'Ada', lastName: 'Lovelace' },
  recipient: { firstName: 'Alan', lastName: 'Turing' },
  exchanger: { name: 'Change Express' },
  timeline: [
    { status: 'pending_payment', at: '2026-09-24T10:00:00.000Z' },
    { status: 'completed', at: '2026-09-24T12:00:00.000Z' },
  ],
}

describe('receiptExport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('maps raw statuses to French human-readable labels', () => {
    expect(receiptStatusLabel('completed')).toBe('Terminé')
    expect(receiptStatusLabel('pending_business_acceptance')).toBe('En attente d’acceptation')
    expect(receiptStatusLabel('pending_payment')).toBe('Paiement attendu')
    expect(receiptStatusLabel('payment_declared')).toBe('Paiement déclaré')
  })

  it('builds receipt lines with reference id and readable status', () => {
    const lines = receiptLines(sampleTransfer, (key, vars) =>
      vars?.id ? `Reference: ${vars.id}` : key,
    )
    expect(lines.some((line) => String(line).includes('MXT-TEST'))).toBe(true)
    expect(lines.some((line) => String(line).includes('pending_payment'))).toBe(false)
    expect(lines.some((line) => String(line).includes('Paiement attendu'))).toBe(true)
  })

  it('builds premium Style D HTML without raw status codes or print-primary CTA', () => {
    const { html, model } = buildReceiptHtml(sampleTransfer, (key) => key)
    expect(model.title).toBe('Réçu de transfert')
    expect(model.statusLabel).toBe('Paiement attendu')
    expect(html).toContain('Réçu de transfert')
    expect(html).toContain('Total payé')
    expect(html).toContain('Montant reçu')
    expect(html).toContain('Expéditeur')
    expect(html).toContain('Destinataire')
    expect(html).toContain('Entreprise')
    expect(html).toContain('Direction')
    expect(html).toContain('Document généré par MOXT')
    expect(html).toContain('--cream')
    expect(html).not.toContain('pending_payment')
    expect(html).not.toContain('pending_business_acceptance')
    expect(html).not.toContain('Enregistrer au format PDF')
  })

  it('buildReceiptModel exposes totals and timeline labels', () => {
    const model = buildReceiptModel(
      { ...sampleTransfer, status: 'completed' },
      (key) => key,
    )
    expect(model.statusLabel).toBe('Terminé')
    expect(model.timeline.length).toBe(2)
    expect(model.timeline.every((row) => !String(row.label).includes('_'))).toBe(true)
  })

  it('downloadReceiptPdf creates an html blob download on web', async () => {
    const click = vi.fn()
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = createElement(tag)
      if (tag === 'a') {
        el.click = click
      }
      return el
    })
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()

    await downloadReceiptPdf(
      {
        ...sampleTransfer,
        id: 'MXT-1',
        status: 'completed',
        timeline: [],
      },
      (key) => key,
    )

    expect(click).toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalled()
    const blob = URL.createObjectURL.mock.calls[0][0]
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toContain('text/html')
    const text = await blob.text()
    expect(text).toContain('Terminé')
    expect(text).toContain('Document généré par MOXT')
  })

  it('printReceipt falls back to download when window.open is blocked', async () => {
    window.open = vi.fn(() => null)
    const result = await downloadBlob(new Blob(['x'], { type: 'text/plain' }), 't.txt')
    expect(['anchor', 'shared', 'saved']).toContain(result)

    const click = vi.fn()
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = createElement(tag)
      if (tag === 'a') el.click = click
      return el
    })
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()

    await printReceipt(
      {
        ...sampleTransfer,
        id: 'MXT-2',
        status: 'completed',
        timeline: [],
      },
      (key) => key,
    )
    expect(click).toHaveBeenCalled()
  })
})
