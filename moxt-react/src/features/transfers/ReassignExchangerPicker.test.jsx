import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReassignExchangerPicker } from './ReassignExchangerPicker'
import { calculateTransfer, formatMoney, rateReductionForDirection } from './transferUtils'
import { DIRECTIONS } from './transferConfig'

vi.mock('../../contexts/useLanguage', () => ({
  useLanguage: () => ({
    t: (key) => {
      const map = {
        'transfers.acceptance.quoteSend': 'Envoi',
        'transfers.acceptance.quoteReceive': 'Réception',
        'transfers.acceptance.requiresAcceptanceShort': 'pré-acceptation',
        'transfers.acceptance.reviewPricingCta': 'Voir le nouveau prix',
        'transfers.acceptance.noOtherExchanger': 'Aucun autre échangeur',
      }
      return map[key] || key
    },
  }),
}))

vi.mock('./useExchangeRate', () => ({
  useExchangeRate: () => ({
    originToRub: 6,
    rubToOrigin: 6,
    source: 'test',
    date: '2026-08-26',
  }),
}))

vi.mock('./exchangerListUtils', () => ({
  listExchangersForTransfer: () => [
    {
      id: 'EXC-1',
      name: 'RO2-SERVICES',
      feePercent: 0,
      averageDelay: '15-30 min',
      transferAcceptanceRequired: true,
      rateReductionToRu: 0,
      rateReductionFromRu: 0,
    },
    {
      id: 'EXC-2',
      name: 'Ozaa Exchange',
      feePercent: 5,
      averageDelay: '10 min',
      transferAcceptanceRequired: false,
      rateReductionToRu: 10,
      rateReductionFromRu: 0,
    },
  ],
}))

const QUOTE_EXCHANGERS = [
  {
    feePercent: 0,
    rateReductionToRu: 0,
    rateReductionFromRu: 0,
  },
  {
    feePercent: 5,
    rateReductionToRu: 10,
    rateReductionFromRu: 0,
  },
]

describe('ReassignExchangerPicker', () => {
  it('affiche le prix envoi et le prix a recevoir sous le delai de chaque echangeur', () => {
    render(
      <ReassignExchangerPicker
        businesses={[]}
        user={{ id: 'u1', originCountry: 'BJ' }}
        transfer={{
          originCountry: 'BJ',
          direction: DIRECTIONS.BJ_TO_RU,
          totalToPay: 10000,
          amountSent: 10000,
        }}
        excludeBusinessId="EXC-CURRENT"
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByText('RO2-SERVICES')).toBeVisible()
    expect(screen.getByText(/15-30 min/)).toBeVisible()
    expect(screen.getAllByText('Envoi')).toHaveLength(2)
    expect(screen.getAllByText('Réception')).toHaveLength(2)

    for (const exchanger of QUOTE_EXCHANGERS) {
      const quote = calculateTransfer(
        10000,
        DIRECTIONS.BJ_TO_RU,
        exchanger.feePercent,
        6,
        'BJ',
        rateReductionForDirection(exchanger, DIRECTIONS.BJ_TO_RU),
      )
      const sent = formatMoney(quote.amountSent, quote.currencyFrom)
      const received = formatMoney(quote.amountReceived, quote.currencyTo)
      expect(
        screen.getByText((_, node) => node?.tagName === 'SPAN' && (node.textContent || '').includes(sent)),
      ).toBeVisible()
      expect(
        screen.getByText((_, node) => node?.tagName === 'SPAN' && (node.textContent || '').includes(received)),
      ).toBeVisible()
    }
  })
})
