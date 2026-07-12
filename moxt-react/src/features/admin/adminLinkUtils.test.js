import { describe, expect, it } from 'vitest'
import {
  adminDetailLink,
  disputeTargetLink,
  normalizeAdminKind,
  normalizeReportType,
  reportTargetLink,
} from './adminLinkUtils'

describe('adminLinkUtils', () => {
  it('normalise les kinds et types de signalement', () => {
    expect(normalizeAdminKind('reports')).toBe('report')
    expect(normalizeAdminKind('contestedReview')).toBe('review')
    expect(normalizeReportType('annonce')).toBe('listing')
    expect(normalizeReportType('abonne')).toBe('subscriber')
  })

  it('resout les liens de contenu admin', () => {
    expect(adminDetailLink('listings', { id: 'l1' })).toBe('/marketplace/l1')
    expect(adminDetailLink('jobs', { id: 'j1' })).toBe('/jobs/j1')
    expect(adminDetailLink('user', { id: 'u1' })).toBe('/users/u1/publications')
    expect(adminDetailLink('support', { id: 't1' })).toBe('/support')
  })

  it('resout les signalements vers la fiche concernee', () => {
    expect(reportTargetLink({ reportType: 'annonce', relatedId: 'l1' })).toBe('/marketplace/l1')
    expect(reportTargetLink({ reportType: 'emploi', relatedId: 'j1' })).toBe('/jobs/j1')
    expect(reportTargetLink({ reportType: 'abonne', relatedId: 'u1' })).toBe('/users/u1/publications')
    expect(adminDetailLink('reports', { reportType: 'evenement', relatedId: 'e1' })).toBe('/events/e1')
  })

  it('resout les litiges vers la ressource liee', () => {
    expect(disputeTargetLink({ relatedType: 'transfer', relatedId: 'tr1' })).toBe('/transfers/tr1')
    expect(disputeTargetLink({ relatedType: 'p2p_order', relatedId: 'o1' })).toBe('/p2p/orders/o1')
    expect(disputeTargetLink({ relatedType: 'parcel', relatedId: 'p1' })).toBe('/parcels/p1')
  })

  it('resout les avis vers leur cible', () => {
    expect(
      adminDetailLink('contestedReview', { targetType: 'listing', targetId: 'l9' }),
    ).toBe('/marketplace/l9')
  })
})
