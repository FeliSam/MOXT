import { describe, expect, it } from 'vitest'
import { shouldHoldNativeHomeForAuth, shouldRedirectNativeHome } from './nativeHomeRedirect'

describe('shouldRedirectNativeHome', () => {
  it('envoie un utilisateur connecté vers le dashboard au cold start natif', () => {
    expect(
      shouldRedirectNativeHome({
        native: true,
        pathname: '/',
        userId: 'u1',
        status: 'authenticated',
      }),
    ).toBe(true)
  })

  it('ne redirige pas le web, les invités, ni pendant le restore auth', () => {
    expect(
      shouldRedirectNativeHome({
        native: false,
        pathname: '/',
        userId: 'u1',
        status: 'authenticated',
      }),
    ).toBe(false)
    expect(
      shouldRedirectNativeHome({
        native: true,
        pathname: '/',
        userId: null,
        status: 'anonymous',
      }),
    ).toBe(false)
    expect(
      shouldRedirectNativeHome({
        native: true,
        pathname: '/',
        userId: 'u1',
        status: 'loading',
      }),
    ).toBe(false)
    expect(
      shouldRedirectNativeHome({
        native: true,
        pathname: '/marketplace',
        userId: 'u1',
        status: 'authenticated',
      }),
    ).toBe(false)
  })
})

describe('shouldHoldNativeHomeForAuth', () => {
  it('couvre / d un splash natif pendant le restore session', () => {
    expect(shouldHoldNativeHomeForAuth({ native: true, pathname: '/', status: 'loading' })).toBe(
      true,
    )
    expect(shouldHoldNativeHomeForAuth({ native: true, pathname: '/', status: 'anonymous' })).toBe(
      false,
    )
    expect(shouldHoldNativeHomeForAuth({ native: false, pathname: '/', status: 'loading' })).toBe(
      false,
    )
  })
})
