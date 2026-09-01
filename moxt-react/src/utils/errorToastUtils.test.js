import { describe, expect, it, vi } from 'vitest'
import { dispatchAdminOnlyErrorToast } from './errorToastUtils.js'

describe('dispatchAdminOnlyErrorToast', () => {
  it('affiche le toast pour un admin', () => {
    const dispatch = vi.fn()
    const store = {
      getState: () => ({ auth: { user: { role: 'admin' } } }),
      dispatch,
    }
    dispatchAdminOnlyErrorToast(store, { title: 'Erreur', message: 'Détail' })
    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  it('ignore le toast pour un utilisateur standard', () => {
    const dispatch = vi.fn()
    const store = {
      getState: () => ({ auth: { user: { role: 'user' } } }),
      dispatch,
    }
    dispatchAdminOnlyErrorToast(store, { title: 'Erreur', message: 'Détail' })
    expect(dispatch).not.toHaveBeenCalled()
  })
})
