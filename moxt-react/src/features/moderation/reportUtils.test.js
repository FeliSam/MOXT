import { describe, expect, it } from 'vitest'
import {
  findActiveReport,
  reportForeignKeyForAction,
  wasActiveReportAdded,
  wasActiveReportDuplicate,
} from './reportUtils'

const listingReport = {
  id: 'REP-1',
  listingId: 'ANN-1',
  reporterId: 'user-1',
  reason: 'Suspect',
  status: 'new',
}

describe('reportUtils', () => {
  it('resolves foreign keys for content report actions', () => {
    expect(reportForeignKeyForAction('marketplace/reportListing')).toBe('listingId')
    expect(reportForeignKeyForAction('jobs/reportJob')).toBe('jobId')
    expect(reportForeignKeyForAction('events/reportEvent')).toBe('eventId')
  })

  it('detects when an active report was added', () => {
    const before = []
    const after = [listingReport]
    expect(
      wasActiveReportAdded(before, after, { listingId: 'ANN-1', reporterId: 'user-1' }, 'listingId'),
    ).toBe(true)
  })

  it('detects duplicate active reports', () => {
    const reports = [listingReport]
    expect(
      wasActiveReportDuplicate(
        reports,
        reports,
        { listingId: 'ANN-1', reporterId: 'user-1' },
        'listingId',
      ),
    ).toBe(true)
  })

  it('finds active reports by foreign key and reporter', () => {
    expect(
      findActiveReport([listingReport], { listingId: 'ANN-1', reporterId: 'user-1' }, 'listingId'),
    ).toEqual(listingReport)
    expect(
      findActiveReport([listingReport], { listingId: 'ANN-2', reporterId: 'user-1' }, 'listingId'),
    ).toBeNull()
  })
})
