import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}))

import { downloadBlob, downloadReceiptPdf, printReceipt, receiptLines } from './receiptExport'

describe('receiptExport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('builds receipt lines with reference id', () => {
    const lines = receiptLines(
      {
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
        timeline: [],
      },
      (key, vars) => (vars?.id ? `Reference: ${vars.id}` : key),
    )
    expect(lines.some((line) => String(line).includes('MXT-TEST'))).toBe(true)
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
        id: 'MXT-1',
        status: 'completed',
        direction: 'BJ_TO_RU',
        currencyFrom: 'XOF',
        currencyTo: 'RUB',
        amountSent: 1,
        fees: 0,
        feePercent: 0,
        totalToPay: 1,
        amountReceived: 1,
        createdAt: '2026-09-24T10:00:00.000Z',
        sender: { firstName: 'A', lastName: 'B' },
        recipient: { firstName: 'C', lastName: 'D' },
        exchanger: { name: 'Biz' },
        timeline: [],
      },
      (key) => key,
    )

    expect(click).toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalled()
    const blob = URL.createObjectURL.mock.calls[0][0]
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toContain('text/html')
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
        id: 'MXT-2',
        status: 'completed',
        direction: 'BJ_TO_RU',
        currencyFrom: 'XOF',
        currencyTo: 'RUB',
        amountSent: 1,
        fees: 0,
        feePercent: 0,
        totalToPay: 1,
        amountReceived: 1,
        createdAt: '2026-09-24T10:00:00.000Z',
        sender: { firstName: 'A', lastName: 'B' },
        recipient: { firstName: 'C', lastName: 'D' },
        exchanger: { name: 'Biz' },
        timeline: [],
      },
      (key) => key,
    )
    expect(click).toHaveBeenCalled()
  })
})
