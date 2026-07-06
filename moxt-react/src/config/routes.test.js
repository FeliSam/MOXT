import { describe, expect, it } from 'vitest'
import {
  MARKETPLACE_LEGACY_PATHS,
  MY_LISTINGS_LEGACY_PATHS,
  ROUTES,
  SIMPLE_LEGACY_REDIRECTS,
} from './routes'

describe('route conventions', () => {
  it('utilise des chemins canoniques uniques', () => {
    const paths = Object.values(ROUTES)
    expect(new Set(paths).size).toBe(paths.length)
    paths.forEach((path) => expect(path).toMatch(/^\//))
  })

  it('ne déclare aucun alias historique en double', () => {
    const aliases = [
      ...SIMPLE_LEGACY_REDIRECTS.map(([path]) => path),
      ...MARKETPLACE_LEGACY_PATHS.map((path) => `/${path}`),
      ...MY_LISTINGS_LEGACY_PATHS.map((path) => `/${path}`),
    ]
    expect(new Set(aliases).size).toBe(aliases.length)
  })
})
