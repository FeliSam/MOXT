import { describe, expect, it } from 'vitest'
import {
  isGeneratedAvatar,
  isLibraryPortrait,
  isLoreleiAvatarUrl,
  libraryPortraitDisplayUrl,
  parseLibraryPortraitUrl,
} from './portraitLibrary'

const PORTRAIT = 'https://cdn.moxtapp.ru/avatars/portraits/v1/f-t1-f-bun.jpg'

describe('portraitLibrary', () => {
  it('isLibraryPortrait : portraits CDN (et miroir Object Storage) uniquement', () => {
    expect(isLibraryPortrait(PORTRAIT)).toBe(true)
    expect(
      isLibraryPortrait(
        'https://storage.yandexcloud.net/moxt-public/avatars/portraits/v1/m-t2-m-buzz.jpg',
      ),
    ).toBe(true)
    expect(isLibraryPortrait('https://cdn.moxtapp.ru/avatars/u-1/avatar.jpg')).toBe(false)
    expect(isLibraryPortrait('https://evil.example/avatars/portraits/v1/f-t1-f-bun.jpg')).toBe(
      false,
    )
    expect(isLibraryPortrait('')).toBe(false)
    expect(isLibraryPortrait(null)).toBe(false)
  })

  it('parse l’identifiant et choisit la vignette selon la taille', () => {
    expect(parseLibraryPortraitUrl(`${PORTRAIT}?v=2`)).toEqual({ version: 'v1', id: 'f-t1-f-bun' })
    expect(libraryPortraitDisplayUrl(PORTRAIT, { width: 160 })).toBe(
      'https://cdn.moxtapp.ru/avatars/portraits/v1/thumbs/f-t1-f-bun.jpg',
    )
    expect(libraryPortraitDisplayUrl(PORTRAIT, { width: 400 })).toBe(PORTRAIT)
  })

  it('isGeneratedAvatar : portrait, illustré (lorelei.png ou préférences) — jamais une photo', () => {
    const photo = 'https://storage.yandexcloud.net/moxt-public/public/avatars/u-1/avatar.jpg?v=1'
    const lorelei = 'https://storage.yandexcloud.net/moxt-public/public/avatars/u-1/lorelei.png?v=9'
    expect(isLoreleiAvatarUrl(lorelei)).toBe(true)
    expect(isGeneratedAvatar(PORTRAIT)).toBe(true)
    expect(isGeneratedAvatar(lorelei)).toBe(true)
    expect(isGeneratedAvatar(photo)).toBe(false)
    expect(isGeneratedAvatar(photo, { loreleiUrl: photo.replace('?v=1', '?v=1') })).toBe(true)
    expect(isGeneratedAvatar(photo, { loreleiUrl: 'https://x/avatars/u-1/avatar.png?v=0' })).toBe(
      false,
    )
  })
})
