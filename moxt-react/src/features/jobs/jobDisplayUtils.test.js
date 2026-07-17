import { describe, expect, it } from 'vitest'
import { jobContractLabel, jobSectorLabel } from './jobDisplayUtils'

function makeT(dict) {
  return (key) => dict[key] ?? key
}

const t = makeT({
  'jobs.labels.empty': 'Non renseigné',
  'jobs.sectors.tech': 'Technology & IT',
  'jobs.sectors.commerce': 'Commerce & sales',
  'jobs.contracts.fullTime': 'Full-time',
  'jobs.contracts.partTime': 'Part-time',
  'jobs.contracts.internship': 'Internship',
})

describe('jobSectorLabel', () => {
  it('maps known French sector identifiers to localized labels', () => {
    expect(jobSectorLabel(t, 'Technologie & informatique')).toBe('Technology & IT')
    expect(jobSectorLabel(t, 'Commerce & vente')).toBe('Commerce & sales')
  })

  it('falls back to the raw value for unknown sectors', () => {
    expect(jobSectorLabel(t, 'Support')).toBe('Support')
  })

  it('returns the empty label when value is missing', () => {
    expect(jobSectorLabel(t, '')).toBe('Non renseigné')
    expect(jobSectorLabel(t, null)).toBe('Non renseigné')
  })
})

describe('jobContractLabel', () => {
  it('maps contract codes to localized labels', () => {
    expect(jobContractLabel(t, 'full_time')).toBe('Full-time')
    expect(jobContractLabel(t, 'part_time')).toBe('Part-time')
  })

  it('maps French contract labels as aliases', () => {
    expect(jobContractLabel(t, 'Temps plein')).toBe('Full-time')
    expect(jobContractLabel(t, 'Stage')).toBe('Internship')
  })

  it('falls back to the raw value for unknown contracts', () => {
    expect(jobContractLabel(t, 'custom_gigs')).toBe('custom_gigs')
  })

  it('returns the empty label when value is missing', () => {
    expect(jobContractLabel(t, undefined)).toBe('Non renseigné')
  })
})
