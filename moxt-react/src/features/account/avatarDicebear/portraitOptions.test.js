import { describe, expect, it } from 'vitest'
import {
  GENDERS,
  PORTRAIT_MANIFEST,
  TONES,
  choiceFromPortraitUrl,
  defaultPortraitChoice,
  findPortrait,
  hairstylesFor,
  initialPortraitChoice,
  normalizePortraitChoice,
  randomPortraitChoice,
  serializePortraitPreferences,
  withGender,
} from './portraitOptions'

describe('portraitOptions — manifeste embarqué', () => {
  it('couvre les 60 combinaisons genre × teint × coiffure', () => {
    expect(PORTRAIT_MANIFEST.baseUrl).toBe('https://cdn.moxtapp.ru/avatars/portraits/v1/')
    expect(TONES).toHaveLength(6)
    let count = 0
    for (const gender of GENDERS) {
      expect(hairstylesFor(gender)).toHaveLength(5)
      for (const tone of TONES) {
        for (const hair of hairstylesFor(gender)) {
          const item = findPortrait({ gender, tone: tone.id, hair: hair.id })
          expect(item?.url).toBe(`${PORTRAIT_MANIFEST.baseUrl}${gender}-${tone.id}-${hair.id}.jpg`)
          expect(item?.thumbUrl).toBe(
            `${PORTRAIT_MANIFEST.baseUrl}thumbs/${gender}-${tone.id}-${hair.id}.jpg`,
          )
          count += 1
        }
      }
    }
    expect(count).toBe(60)
  })

  it('lookup : combinaison incohérente → null', () => {
    expect(findPortrait({ gender: 'm', tone: 't1', hair: 'f-bun' })).toBeNull()
    expect(findPortrait({ gender: 'f', tone: 't9', hair: 'f-bun' })).toBeNull()
  })

  it('normalise un choix invalide vers un portrait existant', () => {
    const fixed = normalizePortraitChoice({ gender: 'x', tone: 'zz', hair: 'm-fade' })
    expect(findPortrait(fixed)).not.toBeNull()
    expect(fixed.gender).toBe('f')
  })
})

describe('portraitOptions — valeur par défaut', () => {
  it('est déterministe pour un même userId et toujours valide', () => {
    const a = defaultPortraitChoice('3f0c9a2e-user-1')
    expect(defaultPortraitChoice('3f0c9a2e-user-1')).toEqual(a)
    expect(findPortrait(a)).not.toBeNull()
  })

  it('varie selon les utilisateurs (genres et teints couverts)', () => {
    const picks = Array.from({ length: 200 }, (_, i) => defaultPortraitChoice(`user-${i}`))
    expect(new Set(picks.map((p) => p.gender)).size).toBe(2)
    expect(new Set(picks.map((p) => p.tone)).size).toBe(6)
    for (const p of picks) expect(findPortrait(p)).not.toBeNull()
  })

  it('restaure le choix depuis avatar_url, puis les préférences, sinon le hash', () => {
    const url = 'https://cdn.moxtapp.ru/avatars/portraits/v1/m-t4-m-fade.jpg'
    expect(choiceFromPortraitUrl(url)).toEqual({ gender: 'm', tone: 't4', hair: 'm-fade' })
    expect(initialPortraitChoice({ avatarUrl: url, userId: 'u' })).toEqual({
      gender: 'm',
      tone: 't4',
      hair: 'm-fade',
    })
    expect(
      initialPortraitChoice({
        prefs: { gender: 'f', tone: 't2', hair: 'f-bob', v: 1 },
        avatarUrl: 'https://x/p.jpg',
        userId: 'u',
      }),
    ).toEqual({ gender: 'f', tone: 't2', hair: 'f-bob' })
    expect(initialPortraitChoice({ userId: 'abc' })).toEqual(defaultPortraitChoice('abc'))
  })

  it('sérialise pour preferences.avatarPortrait', () => {
    expect(serializePortraitPreferences({ gender: 'm', tone: 't6', hair: 'm-buzz' })).toEqual({
      gender: 'm',
      tone: 't6',
      hair: 'm-buzz',
      v: 1,
    })
  })

  it('changer de genre garde le rang de coiffure ; aléatoire reste valide', () => {
    expect(withGender({ gender: 'f', tone: 't3', hair: 'f-curls' }, 'm')).toEqual({
      gender: 'm',
      tone: 't3',
      hair: 'm-fade',
    })
    let i = 0
    const seq = [0.9, 0.1, 0.5, 0.3]
    const r = randomPortraitChoice({ random: () => seq[i++ % seq.length] })
    expect(findPortrait(r)).not.toBeNull()
  })
})
