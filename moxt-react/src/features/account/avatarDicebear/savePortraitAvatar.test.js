import { describe, expect, it, vi } from 'vitest'
import { savePortraitAvatar } from './savePortraitAvatar'

const user = {
  id: 'u-1',
  firstName: 'Ada',
  lastName: 'L',
  phone: '+7',
  city: 'Moscou',
  avatarUrl: '',
}

describe('savePortraitAvatar', () => {
  it('avatar_url = URL CDN du portrait, préférences avatarPortrait, sans upload', async () => {
    const persistProfile = vi.fn(async () => true)
    const persistPreferences = vi.fn(async () => {})
    const result = await savePortraitAvatar({
      user,
      choice: { gender: 'f', tone: 't5', hair: 'f-braids' },
      persistProfile,
      persistPreferences,
    })
    const url = 'https://cdn.moxtapp.ru/avatars/portraits/v1/f-t5-f-braids.jpg'
    expect(result).toEqual({
      avatarUrl: url,
      preferences: { gender: 'f', tone: 't5', hair: 'f-braids', v: 1 },
      saved: true,
    })
    expect(persistProfile).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Ada', avatarUrl: url, city: 'Moscou' }),
    )
    expect(persistPreferences).toHaveBeenCalledWith({
      gender: 'f',
      tone: 't5',
      hair: 'f-braids',
      v: 1,
    })
  })

  it('préférences best-effort ; session requise', async () => {
    const result = await savePortraitAvatar({
      user,
      choice: { gender: 'm', tone: 't1', hair: 'm-short' },
      persistProfile: async () => false,
      persistPreferences: async () => {
        throw new Error('offline')
      },
    })
    expect(result.saved).toBe(false)
    await expect(
      savePortraitAvatar({
        user: null,
        choice: {},
        persistProfile: vi.fn(),
        persistPreferences: vi.fn(),
      }),
    ).rejects.toThrow()
  })
})
