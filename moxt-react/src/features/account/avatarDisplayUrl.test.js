import { describe, expect, it } from 'vitest'
import { avatarDisplayUrl } from './avatarDisplayUrl.js'

describe('avatarDisplayUrl', () => {
  it('transforme les URLs publiques Supabase', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/avatars/user/avatar.jpg'
    expect(avatarDisplayUrl(url, { width: 72 })).toBe(
      'https://xyz.supabase.co/storage/v1/render/image/public/avatars/user/avatar.jpg?width=72&height=72&resize=cover',
    )
  })

  it('laisse les autres URLs intactes', () => {
    expect(avatarDisplayUrl('https://cdn.example/a.png')).toBe('https://cdn.example/a.png')
    expect(avatarDisplayUrl(null)).toBe(null)
  })
})
