import { describe, expect, it } from 'vitest'
import { avatarDisplayUrl } from './avatarDisplayUrl.js'

describe('avatarDisplayUrl', () => {
  it('transforme les URLs publiques Supabase', () => {
    const url = 'https://xyz.supabase.co/storage/v1/object/public/avatars/user/avatar.jpg'
    expect(avatarDisplayUrl(url, { width: 72 })).toBe(
      'https://xyz.supabase.co/storage/v1/render/image/public/avatars/user/avatar.jpg?width=72&height=72&resize=cover',
    )
  })

  it('conserve le cache-bust lors de la transformation Supabase', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/avatars/user/avatar.jpg?v=1734567890'
    expect(avatarDisplayUrl(url, { width: 72 })).toBe(
      'https://xyz.supabase.co/storage/v1/render/image/public/avatars/user/avatar.jpg?v=1734567890&width=72&height=72&resize=cover',
    )
  })

  it('laisse les autres URLs intactes', () => {
    expect(avatarDisplayUrl('https://cdn.example/a.png')).toBe('https://cdn.example/a.png')
    expect(avatarDisplayUrl(null)).toBe(null)
  })
  it('sert les portraits de la bibliothèque en fichiers statiques (vignette ≤ 256 px)', () => {
    const url = 'https://cdn.moxtapp.ru/avatars/portraits/v1/m-t3-m-waves.jpg'
    expect(avatarDisplayUrl(url, { width: 160 })).toBe(
      'https://cdn.moxtapp.ru/avatars/portraits/v1/thumbs/m-t3-m-waves.jpg',
    )
    expect(avatarDisplayUrl(url, { width: 512 })).toBe(url)
  })
})
