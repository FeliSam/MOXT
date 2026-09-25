import { describe, expect, it, vi } from 'vitest'
import {
  BACKGROUND_COLORS,
  HAIR_VARIANTS,
  SKIN_COLORS,
  defaultLoreleiOptions,
  loreleiOptionsKey,
  normalizeLoreleiOptions,
  preferencesToLoreleiOptions,
  randomizeLoreleiOptions,
  serializeLoreleiPreferences,
  toCreateAvatarOptions,
} from './loreleiOptions.js'
import { loreleiSvgDataUri, loreleiSvgString } from './createLoreleiAvatar.js'
import { profileDetailsFromUser, saveDicebearAvatar } from './saveDicebearAvatar.js'

describe('loreleiOptions', () => {
  it('donne des valeurs par défaut stables pour un même userId', () => {
    const a = defaultLoreleiOptions('user-abc')
    expect(defaultLoreleiOptions('user-abc')).toEqual(a)
    expect(a.seed).toBe('user-abc')
    expect(SKIN_COLORS).toContain(a.skinColor)
    expect(HAIR_VARIANTS).toContain(a.hair)
    expect(a.glassesOn).toBe(false)
  })

  it('normalise tableaux, # et valeurs invalides', () => {
    const o = normalizeLoreleiOptions({
      seed: 'x',
      skinColor: ['#EDB98A'],
      hair: 'variant07',
      hairColor: 'nope',
      glassesProbability: 100,
    })
    expect(o.skinColor).toBe('edb98a')
    expect(o.hair).toBe('variant07')
    expect(o.hairColor).toBe('2c1b18')
    expect(o.glassesOn).toBe(true)
    expect(o.earringsOn).toBe(false)
    expect(normalizeLoreleiOptions({ hair: 'variant99' }).hair).toBe(HAIR_VARIANTS[0])
  })

  it('aller-retour préférences ↔ options', () => {
    const original = { ...defaultLoreleiOptions('rt'), glassesOn: true, glasses: 'variant03' }
    const stored = serializeLoreleiPreferences(original, {
      avatarUrl: 'https://cdn.moxt/avatars/rt/avatar.png?v=1',
      now: new Date('2026-09-25T00:00:00Z'),
    })
    expect(stored).toMatchObject({
      style: 'lorelei',
      version: 9,
      glassesOn: true,
      glasses: 'variant03',
      avatarUrl: 'https://cdn.moxt/avatars/rt/avatar.png?v=1',
      updatedAt: '2026-09-25T00:00:00.000Z',
    })
    const restored = preferencesToLoreleiOptions(stored, 'rt')
    expect(loreleiOptionsKey(restored)).toBe(loreleiOptionsKey(original))
  })

  it('retombe sur les défauts du seed si les préférences sont absentes ou étrangères', () => {
    expect(preferencesToLoreleiOptions(null, 'u1')).toEqual(defaultLoreleiOptions('u1'))
    expect(preferencesToLoreleiOptions({ style: 'avataaars' }, 'u1')).toEqual(
      defaultLoreleiOptions('u1'),
    )
  })

  it('aléatoire reste dans les catalogues et garde le seed', () => {
    let i = 0
    const seq = [0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.05, 0.95, 0.4]
    const next = randomizeLoreleiOptions(defaultLoreleiOptions('r'), {
      random: () => seq[i++ % seq.length],
    })
    expect(next.seed).toBe('r')
    expect(SKIN_COLORS).toContain(next.skinColor)
    expect(BACKGROUND_COLORS).toContain(next.backgroundColor)
    expect(next.backgroundColor).not.toBe('transparent')
  })

  it('construit les options DiceBear (tableaux + probabilités)', () => {
    const o = toCreateAvatarOptions(
      { ...defaultLoreleiOptions('z'), earringsOn: true, earrings: 'variant02' },
      { size: 128 },
    )
    expect(o.size).toBe(128)
    expect(o.skinColor).toHaveLength(1)
    expect(o.earrings).toEqual(['variant02'])
    expect(o.earringsProbability).toBe(100)
    expect(o.glassesProbability).toBe(0)
    expect(o.beardProbability).toBe(0)
    expect(o).not.toHaveProperty('glassesOn')
  })
})

describe('createLoreleiAvatar', () => {
  it('rend un SVG hors-ligne, sensible au teint', () => {
    const base = defaultLoreleiOptions('svg')
    const light = loreleiSvgString({ ...base, skinColor: 'ffdbb4' }, { size: 96 })
    const dark = loreleiSvgString({ ...base, skinColor: '4a2c1a' }, { size: 96 })
    expect(light).toContain('<svg')
    expect(light).toContain('ffdbb4')
    expect(dark).toContain('4a2c1a')
    expect(light).not.toBe(dark)
    expect(light).not.toContain('api.dicebear.com')
    expect(loreleiSvgDataUri(base, { size: 64 }).startsWith('data:image/svg+xml')).toBe(true)
  })
})

describe('saveDicebearAvatar', () => {
  const user = {
    id: 'u-42',
    firstName: 'Ada',
    lastName: 'K',
    phone: '+79990000000',
    secondaryPhone: '',
    city: 'Moscou',
    originCountry: 'BJ',
    avatarUrl: '',
  }

  it('mappe les champs profil attendus par updateProfile', () => {
    expect(profileDetailsFromUser(user, { avatarUrl: 'x' })).toMatchObject({
      firstName: 'Ada',
      lastName: 'K',
      phone: '+79990000000',
      city: 'Moscou',
      originCountry: 'BJ',
      avatarUrl: 'x',
    })
  })

  it('rend, envoie, puis enregistre avatar_url et les préférences', async () => {
    const file = { name: 'avatar.png', type: 'image/png' }
    const renderPng = vi.fn(async () => file)
    const uploadAvatar = vi.fn(async () => 'https://cdn.moxt/avatars/u-42/avatar.png?v=9')
    const persistProfile = vi.fn(async () => true)
    const persistPreferences = vi.fn(async () => {})
    const options = defaultLoreleiOptions('u-42')

    const result = await saveDicebearAvatar({
      user,
      options,
      renderPng,
      uploadAvatar,
      persistProfile,
      persistPreferences,
    })

    expect(renderPng).toHaveBeenCalledWith(options)
    expect(uploadAvatar).toHaveBeenCalledWith('u-42', file, { onProgress: undefined })
    expect(persistProfile).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: 'https://cdn.moxt/avatars/u-42/avatar.png?v=9' }),
    )
    expect(persistPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ style: 'lorelei', avatarUrl: result.avatarUrl }),
    )
    expect(result.saved).toBe(true)
  })

  it('échoue proprement sans session', async () => {
    await expect(saveDicebearAvatar({ user: null })).rejects.toThrow()
  })
})
