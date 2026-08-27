import { afterEach, describe, expect, it, vi } from 'vitest'
import { readE2eHarnessSession } from './e2eSession'

describe('readE2eHarnessSession', () => {
  afterEach(() => {
    delete window.__MOXT_E2E__
    delete window.__MOXT_E2E_SESSION__
    vi.unstubAllGlobals()
  })

  it('ignore une session hors localhost', () => {
    vi.stubGlobal('location', { hostname: 'moxtapp.ru' })
    window.__MOXT_E2E_SESSION__ = { user: { id: 'u1' }, token: 't' }
    expect(readE2eHarnessSession()).toBeNull()
  })

  it('accepte une session complète sur 127.0.0.1', () => {
    vi.stubGlobal('location', { hostname: '127.0.0.1' })
    window.__MOXT_E2E__ = true
    window.__MOXT_E2E_SESSION__ = {
      user: { id: 'u1', firstName: 'Nadia', role: 'user' },
      token: 'e2e',
    }

    expect(readE2eHarnessSession()).toEqual({
      user: { id: 'u1', firstName: 'Nadia', role: 'user' },
      token: 'e2e',
    })
  })

  it('refuse un payload incomplet', () => {
    vi.stubGlobal('location', { hostname: 'localhost' })
    window.__MOXT_E2E__ = true
    window.__MOXT_E2E_SESSION__ = { token: 'e2e' }
    expect(readE2eHarnessSession()).toBeNull()
  })
})
