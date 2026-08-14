import { describe, expect, it } from 'vitest'
import { TRANSFER_STATUS, TRANSFER_TIMELINE_EVENT } from '../transferConfig'
import {
  buildTransferTimelineItems,
  isBusinessAcceptedTimelineEvent,
  resolveTransferTimelineLabel,
  shouldShowTransferTimelineEvent,
} from './transferTimelineUtils'

const t = (key) =>
  ({
    'transfers.timeline.pendingAcceptance': 'Demande envoyée à l’échangeur',
    'transfers.timeline.businessAccepted': 'Demande acceptée par l’entreprise',
    'transfers.timeline.pending': 'Transfert créé, paiement attendu',
    'transfers.timeline.declared': 'Paiement déclaré par le client',
  })[key] || key

describe('transferTimelineUtils', () => {
  it('detects business acceptance timeline entries', () => {
    expect(
      isBusinessAcceptedTimelineEvent({ status: TRANSFER_TIMELINE_EVENT.BUSINESS_ACCEPTED }),
    ).toBe(true)
    expect(
      isBusinessAcceptedTimelineEvent({
        status: TRANSFER_STATUS.PENDING,
        note: 'business_accepted',
      }),
    ).toBe(true)
    expect(isBusinessAcceptedTimelineEvent({ status: TRANSFER_STATUS.PENDING })).toBe(false)
  })

  it('shows acceptance steps only when pre-acceptance is enabled on the transfer', () => {
    const acceptanceTransfer = { acceptanceRequired: true }
    const directTransfer = { acceptanceRequired: false }

    expect(
      shouldShowTransferTimelineEvent(acceptanceTransfer, {
        status: TRANSFER_STATUS.PENDING_ACCEPTANCE,
      }),
    ).toBe(true)
    expect(
      shouldShowTransferTimelineEvent(directTransfer, {
        status: TRANSFER_STATUS.PENDING_ACCEPTANCE,
      }),
    ).toBe(false)
    expect(
      shouldShowTransferTimelineEvent(directTransfer, {
        status: TRANSFER_TIMELINE_EVENT.BUSINESS_ACCEPTED,
      }),
    ).toBe(false)
    expect(
      shouldShowTransferTimelineEvent(directTransfer, {
        status: TRANSFER_STATUS.PENDING,
      }),
    ).toBe(true)
  })

  it('builds timeline items with the business acceptance label', () => {
    const transfer = {
      acceptanceRequired: true,
      timeline: [
        { status: TRANSFER_STATUS.PENDING_ACCEPTANCE, at: '2026-08-13T17:37:00.000Z' },
        { status: TRANSFER_TIMELINE_EVENT.BUSINESS_ACCEPTED, at: '2026-08-13T17:39:00.000Z' },
        { status: TRANSFER_STATUS.DECLARED, at: '2026-08-13T17:44:00.000Z' },
      ],
    }

    expect(buildTransferTimelineItems(transfer, t, (value) => value)).toEqual([
      {
        label: 'Demande envoyée à l’échangeur',
        date: '2026-08-13T17:37:00.000Z',
      },
      {
        label: 'Demande acceptée par l’entreprise',
        date: '2026-08-13T17:39:00.000Z',
      },
      {
        label: 'Paiement déclaré par le client',
        date: '2026-08-13T17:44:00.000Z',
      },
    ])
  })

  it('resolves legacy acceptance entries stored as pending + note', () => {
    expect(
      resolveTransferTimelineLabel(
        { status: TRANSFER_STATUS.PENDING, note: 'business_accepted' },
        t,
      ),
    ).toBe('Demande acceptée par l’entreprise')
  })
})
