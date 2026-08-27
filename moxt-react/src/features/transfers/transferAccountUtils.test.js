import { describe, expect, it } from 'vitest'
import { DIRECTIONS } from './transferConfig'
import {
  buildExchangerPaymentView,
  exchangerMethodsForParty,
  normalizeTransferCountryCode,
  receivingCountryForDirection,
  receivingSlotForDirection,
  resolveBusinessReceivingAccount,
  TRANSFER_ACCOUNT_SLOTS,
} from './transferAccountUtils'

describe('transferAccountUtils', () => {
  it('normalise les codes pays invalides (index numerique, vide)', () => {
    expect(normalizeTransferCountryCode(1, 'BJ')).toBe('BJ')
    expect(normalizeTransferCountryCode('1', 'TG')).toBe('TG')
    expect(normalizeTransferCountryCode('bj', 'TG')).toBe('BJ')
    expect(normalizeTransferCountryCode('RU', 'BJ')).toBe('RU')
  })

  const accounts = [
    {
      id: 'ru-1',
      slot: TRANSFER_ACCOUNT_SLOTS.RU,
      country: 'RU',
      recipientName: 'Sber Compte',
      phone: '+79001112233',
      method: 'Sberbank',
      active: true,
    },
    {
      id: 'bj-1',
      slot: TRANSFER_ACCOUNT_SLOTS.ORIGIN,
      country: 'BJ',
      recipientName: 'MTN Compte',
      phone: '+2290190000000',
      method: 'MTN MoMo',
      active: true,
    },
  ]

  it('choisit le compte Russie pour RU vers Afrique', () => {
    expect(receivingSlotForDirection(DIRECTIONS.RU_TO_BJ)).toBe(TRANSFER_ACCOUNT_SLOTS.RU)
    expect(receivingCountryForDirection(DIRECTIONS.RU_TO_BJ, 'BJ')).toBe('RU')
    expect(resolveBusinessReceivingAccount(accounts, DIRECTIONS.RU_TO_BJ, 'BJ')?.id).toBe('ru-1')
  })

  it('choisit le compte origine pour Afrique vers Russie', () => {
    expect(receivingSlotForDirection(DIRECTIONS.BJ_TO_RU)).toBe(TRANSFER_ACCOUNT_SLOTS.ORIGIN)
    expect(receivingCountryForDirection(DIRECTIONS.BJ_TO_RU, 'BJ')).toBe('BJ')
    expect(resolveBusinessReceivingAccount(accounts, DIRECTIONS.BJ_TO_RU, 'BJ')?.id).toBe('bj-1')
  })

  it('construit la vue paiement pour le wizard', () => {
    const view = buildExchangerPaymentView({ transferAccounts: accounts }, DIRECTIONS.BJ_TO_RU, 'BJ')
    expect(view.paymentDetails?.recipientName).toBe('MTN Compte')
    expect(view.paymentAccount).toContain('MTN MoMo')
  })

  it('filtre les reseaux africains selon les comptes actifs de l echangeur', () => {
    expect(
      exchangerMethodsForParty({
        business: { transferAccounts: accounts, exchangeMethods: ['MTN MoMo', 'Moov Money', 'Sberbank'] },
        country: 'BJ',
        originCountry: 'BJ',
      }),
    ).toEqual(['MTN MoMo'])
  })

  it('aligne le compte de reception sur le moyen choisi par le client', () => {
    const withMoov = [
      ...accounts,
      {
        id: 'bj-2',
        slot: TRANSFER_ACCOUNT_SLOTS.ORIGIN,
        country: 'BJ',
        recipientName: 'Moov secondaire',
        phone: '+2290190000001',
        method: 'Moov Money',
        active: true,
      },
    ]
    expect(
      resolveBusinessReceivingAccount(withMoov, DIRECTIONS.BJ_TO_RU, 'BJ', { method: 'Moov Money' })
        ?.id,
    ).toBe('bj-2')
    expect(
      exchangerMethodsForParty({
        business: { transferAccounts: withMoov },
        country: 'BJ',
        originCountry: 'BJ',
      }),
    ).toEqual(['MTN MoMo', 'Moov Money'])
    expect(
      exchangerMethodsForParty({
        business: { transferAccounts: withMoov },
        country: 'RU',
        originCountry: 'BJ',
      }),
    ).toEqual(['Sberbank'])
  })

  it('choisit le compte par defaut dans un slot', () => {
    const withDefault = [
      ...accounts,
      {
        id: 'bj-2',
        slot: TRANSFER_ACCOUNT_SLOTS.ORIGIN,
        country: 'BJ',
        recipientName: 'Moov secondaire',
        phone: '+2290190000001',
        method: 'Moov Money',
        active: true,
        isDefault: true,
      },
    ]
    expect(resolveBusinessReceivingAccount(withDefault, DIRECTIONS.BJ_TO_RU, 'BJ')?.id).toBe('bj-2')
  })
})
