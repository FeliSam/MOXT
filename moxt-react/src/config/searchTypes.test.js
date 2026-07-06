import { describe, expect, it } from 'vitest'
import { searchTypeMeta } from './searchTypes'

describe('searchTypeMeta', () => {
  it('attribue une couleur distincte aux principaux domaines', () => {
    expect(searchTypeMeta('parcel')).toEqual({ label: 'Colis', tone: 'warning' })
    expect(searchTypeMeta('business')).toEqual({ label: 'Entreprise', tone: 'success' })
    expect(searchTypeMeta('listing')).toEqual({ label: 'Marketplace', tone: 'violet' })
    expect(searchTypeMeta('job')).toEqual({ label: 'Job', tone: 'info' })
    expect(searchTypeMeta('event')).toEqual({ label: 'Événement', tone: 'rose' })
  })
})
