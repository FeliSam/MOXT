import { describe, expect, it, beforeEach } from 'vitest'
import { readAuthBootstrapCache, writeAuthBootstrapCache, clearAuthBootstrapCache } from './authBootstrapCache.js'

describe('authBootstrapCache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('relit une session bootstrap si le token Supabase est présent', () => {
    localStorage.setItem(
      'sb-test-auth-token',
      JSON.stringify({ access_token: 'tok', refresh_token: 'ref' }),
    )
    writeAuthBootstrapCache({
      user: { id: 'user-1', firstName: 'Ada' },
      token: 'tok',
    })
    expect(readAuthBootstrapCache()?.user.id).toBe('user-1')
  })

  it('purge le cache si plus de token Supabase', () => {
    writeAuthBootstrapCache({
      user: { id: 'user-1' },
      token: 'tok',
    })
    clearAuthBootstrapCache()
    localStorage.setItem(
      'sb-test-auth-token',
      JSON.stringify({ access_token: 'tok' }),
    )
    writeAuthBootstrapCache({
      user: { id: 'user-1' },
      token: 'tok',
    })
    localStorage.clear()
    expect(readAuthBootstrapCache()).toBeNull()
  })
})
