import { describe, expect, it } from 'vitest'
import { parseDeepLinkPath } from './deepLinks'

describe('parseDeepLinkPath', () => {
  it('extrait un chemin https', () => {
    expect(parseDeepLinkPath('https://moxt.app/transfers/abc')).toBe('/transfers/abc')
  })

  it('ignore la racine web', () => {
    expect(parseDeepLinkPath('https://localhost/')).toBeNull()
  })

  it('convertit com.moxt.app:// en chemin router', () => {
    expect(parseDeepLinkPath('com.moxt.app://transfers/abc')).toBe('/transfers/abc')
  })

  it('convertit moxt://app/ en dashboard', () => {
    expect(parseDeepLinkPath('moxt://app/dashboard')).toBe('/dashboard')
  })
})
