import { describe, expect, it } from 'vitest'
import { searchTypeMeta } from './searchTypes'

describe('searchTypeMeta', () => {
  it('attribue une couleur distincte aux principaux domaines', () => {
    expect(searchTypeMeta('parcel')).toMatchObject({ label: 'Colis', tone: 'warning' })
    expect(searchTypeMeta('business')).toMatchObject({ label: 'Entreprise', tone: 'success' })
    expect(searchTypeMeta('listing')).toMatchObject({ label: 'Marketplace', tone: 'violet' })
    expect(searchTypeMeta('job')).toMatchObject({ label: 'Job', tone: 'info' })
    expect(searchTypeMeta('event')).toMatchObject({ label: 'Événement', tone: 'rose' })
  })
})
