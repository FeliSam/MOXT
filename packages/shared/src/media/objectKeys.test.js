import { describe, expect, it } from 'vitest'
import {
  buildPublicMediaUrl,
  legacyPathToObjectKey,
  objectKeyVisibility,
} from './objectKeys.js'

describe('objectKeys', () => {
  it('mappe un avatar Supabase vers public/avatars', () => {
    expect(legacyPathToObjectKey('avatars', 'uid-1/avatar.jpg')).toBe(
      'public/avatars/uid-1/avatar.jpg',
    )
  })

  it('mappe listings vers public/listings', () => {
    expect(legacyPathToObjectKey('listings', 'uid/list/L-1/0.jpg')).toBe(
      'public/listings/uid/list/L-1/0.jpg',
    )
  })

  it('mappe videos vers public/videos', () => {
    expect(legacyPathToObjectKey('videos', 'uid-1/BIZ-1/VID-1.mp4')).toBe(
      'public/videos/uid-1/BIZ-1/VID-1.mp4',
    )
  })

  it('mappe documents privés', () => {
    expect(legacyPathToObjectKey('documents', 'uid/identity/x.pdf')).toBe(
      'private/documents/uid/identity/x.pdf',
    )
  })

  it('détecte la visibilité', () => {
    expect(objectKeyVisibility('public/avatars/x.jpg')).toBe('public')
    expect(objectKeyVisibility('private/documents/x.pdf')).toBe('private')
  })

  it('construit une URL CDN', () => {
    expect(buildPublicMediaUrl('public/avatars/u/a.jpg', 'https://cdn.moxtapp.ru')).toBe(
      'https://cdn.moxtapp.ru/public/avatars/u/a.jpg',
    )
  })
})
