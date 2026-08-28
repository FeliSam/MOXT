import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../platform/capacitor.js', () => ({
  isNative: true,
}))

const getByMediaId = vi.fn()
const touchAccess = vi.fn()
const saveBlobToDisk = vi.fn()

vi.mock('./mobileMediaCache.js', () => ({
  mobileMediaCache: {
    getByMediaId: (...args) => getByMediaId(...args),
    touchAccess: (...args) => touchAccess(...args),
    saveBlobToDisk: (...args) => saveBlobToDisk(...args),
  },
}))

import {
  cacheMediaBlob,
  deriveMediaCacheId,
  resolveCachedMediaUrl,
} from './cachedMediaResolver.js'

describe('cachedMediaResolver', () => {
  beforeEach(() => {
    getByMediaId.mockReset()
    touchAccess.mockReset()
    saveBlobToDisk.mockReset()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        blob: async () => new Blob(['img'], { type: 'image/jpeg' }),
      })),
    )
  })

  it('derive un id stable depuis bucket+path', () => {
    expect(
      deriveMediaCacheId({ legacyBucket: 'avatars', legacyPath: 'uid-1/avatar.jpg' }),
    ).toBe('public_avatars_uid-1_avatar.jpg')
  })

  it('retourne le cache hit sans re-fetch', async () => {
    getByMediaId.mockResolvedValue({ local_uri: 'capacitor://localhost/cache/a.jpg' })
    const url = await resolveCachedMediaUrl({
      legacyBucket: 'transfers',
      legacyPath: 'u1/t1/proof.jpg',
      remoteUrl: 'https://cdn.example/proof.jpg?sig=1',
      kind: 'proof',
    })
    expect(url).toBe('capacitor://localhost/cache/a.jpg')
    expect(touchAccess).toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(saveBlobToDisk).not.toHaveBeenCalled()
  })

  it('télécharge et enregistre sur miss', async () => {
    getByMediaId.mockResolvedValue(null)
    saveBlobToDisk.mockResolvedValue('capacitor://localhost/cache/b.jpg')
    const url = await resolveCachedMediaUrl({
      mediaId: 'media-1',
      objectKey: 'public/listings/x.jpg',
      remoteUrl: 'https://cdn.example/x.jpg',
      kind: 'image',
    })
    expect(fetch).toHaveBeenCalledWith('https://cdn.example/x.jpg')
    expect(saveBlobToDisk).toHaveBeenCalled()
    expect(url).toBe('capacitor://localhost/cache/b.jpg')
  })

  it('cacheMediaBlob délègue à saveBlobToDisk', async () => {
    saveBlobToDisk.mockResolvedValue('capacitor://localhost/cache/c.pdf')
    const uri = await cacheMediaBlob({
      legacyBucket: 'transfers',
      legacyPath: 'u/t/proof.pdf',
      blob: new Blob(['pdf'], { type: 'application/pdf' }),
      kind: 'proof',
    })
    expect(uri).toBe('capacitor://localhost/cache/c.pdf')
    expect(saveBlobToDisk).toHaveBeenCalled()
  })
})
