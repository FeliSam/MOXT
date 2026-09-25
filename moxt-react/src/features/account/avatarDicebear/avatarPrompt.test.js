import { beforeEach, describe, expect, it } from 'vitest'
import {
  AVATAR_PROMPT_INTERVAL_MS,
  hasCustomAvatar,
  mergePromptStates,
  promptDonePreferences,
  readLocalPromptState,
  recordPromptShown,
  shouldShowAvatarPrompt,
  writeLocalPromptState,
} from './avatarPrompt'

const user = { id: 'u-1', avatarUrl: '' }
const NOW = Date.parse('2026-09-25T10:00:00Z')
const H = 60 * 60 * 1000
const at = (ms) => new Date(ms).toISOString()

describe('avatarPrompt — règles d’affichage', () => {
  beforeEach(() => localStorage.clear())

  it('0 affichage : invite un utilisateur sans avatar', () => {
    expect(shouldShowAvatarPrompt({ user, state: null, now: NOW })).toBe(true)
  })

  it('1 et 2 affichages : réinvite après 12 h, pas avant', () => {
    for (const shown of [1, 2]) {
      expect(
        shouldShowAvatarPrompt({ user, state: { shown, lastShownAt: at(NOW - 13 * H) }, now: NOW }),
      ).toBe(true)
      expect(
        shouldShowAvatarPrompt({ user, state: { shown, lastShownAt: at(NOW - 11 * H) }, now: NOW }),
      ).toBe(false)
    }
    expect(AVATAR_PROMPT_INTERVAL_MS).toBe(12 * H)
  })

  it('3 affichages : plus jamais', () => {
    expect(
      shouldShowAvatarPrompt({
        user,
        state: { shown: 3, lastShownAt: at(NOW - 72 * H) },
        now: NOW,
      }),
    ).toBe(false)
  })

  it('done, avatar existant, même session, onboarding : jamais', () => {
    expect(shouldShowAvatarPrompt({ user, state: { shown: 0, done: true }, now: NOW })).toBe(false)
    expect(
      shouldShowAvatarPrompt({ user: { id: 'u', avatarUrl: 'https://x/a.jpg' }, now: NOW }),
    ).toBe(false)
    expect(
      shouldShowAvatarPrompt({ user, prefs: { avatarPortrait: { gender: 'f' } }, now: NOW }),
    ).toBe(false)
    expect(
      shouldShowAvatarPrompt({
        user,
        prefs: { avatarDicebear: { avatarUrl: 'https://x' } },
        now: NOW,
      }),
    ).toBe(false)
    expect(shouldShowAvatarPrompt({ user, now: NOW, shownThisSession: true })).toBe(false)
    expect(shouldShowAvatarPrompt({ user, now: NOW, blocked: true })).toBe(false)
    expect(shouldShowAvatarPrompt({ user: null, now: NOW })).toBe(false)
  })

  it('séquence complète : 3 affichages espacés de 12 h puis arrêt', () => {
    let state = null
    let now = NOW
    let shows = 0
    for (let i = 0; i < 6; i += 1) {
      if (shouldShowAvatarPrompt({ user, state, now })) {
        state = recordPromptShown(state, now)
        shows += 1
      }
      now += 13 * H
    }
    expect(shows).toBe(3)
    expect(state.shown).toBe(3)
  })

  it('fusion serveur / local : compteur max, date la plus récente, done', () => {
    const merged = mergePromptStates(
      { shown: 1, lastShownAt: at(NOW - 20 * H) },
      { shown: 2, lastShownAt: at(NOW - 2 * H), done: false },
      null,
    )
    expect(merged).toEqual({ shown: 2, lastShownAt: at(NOW - 2 * H), done: false })
    expect(mergePromptStates({ done: true }, { shown: 1 }).done).toBe(true)
  })

  it('miroir local + done à l’enregistrement', () => {
    writeLocalPromptState('u-1', { shown: 1, lastShownAt: at(NOW) })
    expect(readLocalPromptState('u-1')).toEqual({ shown: 1, lastShownAt: at(NOW), done: false })
    expect(promptDonePreferences('u-1', { shown: 2 })).toEqual({
      avatarPrompt: { shown: 2, lastShownAt: at(NOW), done: true },
    })
    expect(readLocalPromptState('u-1').done).toBe(true)
    expect(hasCustomAvatar({ user })).toBe(false)
  })
})
