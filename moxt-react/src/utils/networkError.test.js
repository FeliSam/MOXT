import { describe, expect, it } from 'vitest'
import { isNetworkError } from './networkError'

describe('isNetworkError', () => {
  it('detects chunk and fetch failures', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)
    expect(
      isNetworkError(Object.assign(new Error('Loading chunk 3 failed'), { name: 'ChunkLoadError' })),
    ).toBe(true)
    expect(isNetworkError(new Error('Importing a module script failed'))).toBe(true)
  })

  it('ignores unrelated errors while online', () => {
    expect(isNetworkError(new Error('Cannot read properties of undefined'))).toBe(false)
  })
})
