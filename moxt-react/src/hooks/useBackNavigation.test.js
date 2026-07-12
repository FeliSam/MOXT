import { describe, expect, it } from 'vitest'
import { canNavigateBack, resolveBackTarget } from './useBackNavigation'

describe('useBackNavigation', () => {
  it('utilise state.from en priorité', () => {
    expect(
      resolveBackTarget({ pathname: '/jobs/J1', key: 'abc', state: { from: '/favorites' } }),
    ).toEqual({ type: 'path', to: '/favorites' })
  })

  it('recule dans l’historique si la page n’est pas une entrée directe', () => {
    expect(
      resolveBackTarget({ pathname: '/jobs/J1', key: 'step-2', state: null }),
    ).toEqual({ type: 'delta', delta: -1 })
    expect(canNavigateBack({ key: 'step-2', state: null })).toBe(true)
  })

  it('retombe sur le back de routeMeta si entrée directe', () => {
    expect(
      resolveBackTarget({ pathname: '/marketplace/L1', key: 'default', state: null }),
    ).toEqual({ type: 'path', to: '/marketplace' })
    expect(
      resolveBackTarget({ pathname: '/profile/information', key: 'default', state: null }),
    ).toEqual({ type: 'path', to: '/profile' })
  })

  it('accepte un repli explicite', () => {
    expect(
      resolveBackTarget(
        { pathname: '/transfers/MXT-1', key: 'default', state: null },
        '/transfers/history',
      ),
    ).toEqual({ type: 'path', to: '/transfers/history' })
  })
})
