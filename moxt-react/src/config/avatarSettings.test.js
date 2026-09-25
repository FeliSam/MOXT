import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AVATAR_SETTINGS,
  enabledAvatarStyles,
  normalizeAvatarSettings,
  resolveAvatarModule,
} from './avatarSettings.js'
import { DEFAULT_DEV_MODULE_FLAGS, normalizeDevModuleFlags } from './devModules.js'

describe('avatarSettings — lecture des réglages admin', () => {
  it('défauts = comportement actuel (ligne absente, null, valeurs invalides)', () => {
    expect(normalizeAvatarSettings()).toEqual(DEFAULT_AVATAR_SETTINGS)
    expect(normalizeAvatarSettings(null)).toEqual(DEFAULT_AVATAR_SETTINGS)
    expect(normalizeAvatarSettings([])).toEqual(DEFAULT_AVATAR_SETTINGS)
    expect(
      normalizeAvatarSettings({
        promptMaxShows: 'abc',
        promptDelaySeconds: '',
        defaultStyle: 'photo',
      }),
    ).toEqual(DEFAULT_AVATAR_SETTINGS)
    expect(DEFAULT_AVATAR_SETTINGS).toMatchObject({
      portraitEnabled: true,
      loreleiEnabled: true,
      photoEnabled: true,
      defaultStyle: 'portrait',
      promptEnabled: true,
      promptMaxShows: 3,
      promptIntervalHours: 12,
      promptDelaySeconds: 3.5,
      badgeEnabled: true,
    })
  })

  it('le module avatar est actif par défaut dans la liste des modules', () => {
    expect(DEFAULT_DEV_MODULE_FLAGS.avatar).toBe(true)
    expect(normalizeDevModuleFlags({}).avatar).toBe(true)
    expect(normalizeDevModuleFlags({ avatar: false }).avatar).toBe(false)
  })

  it('borne les nombres (max 1–10, intervalle 0–720 h, délai 0–30 s au dixième)', () => {
    expect(
      normalizeAvatarSettings({
        promptMaxShows: 99,
        promptIntervalHours: -4,
        promptDelaySeconds: 7.25,
      }),
    ).toMatchObject({ promptMaxShows: 10, promptIntervalHours: 0, promptDelaySeconds: 7.3 })
    expect(normalizeAvatarSettings({ promptMaxShows: 0, promptIntervalHours: '48' })).toMatchObject(
      {
        promptMaxShows: 1,
        promptIntervalHours: 48,
      },
    )
  })

  it('garde au moins un style actif et un style par défaut disponible', () => {
    expect(
      normalizeAvatarSettings({
        portraitEnabled: false,
        loreleiEnabled: false,
        photoEnabled: false,
      }),
    ).toMatchObject({ portraitEnabled: true, defaultStyle: 'portrait' })
    const onlyLorelei = normalizeAvatarSettings({
      portraitEnabled: false,
      defaultStyle: 'portrait',
    })
    expect(onlyLorelei.defaultStyle).toBe('lorelei')
    expect(enabledAvatarStyles(onlyLorelei)).toEqual(['lorelei'])
    expect(normalizeAvatarSettings({ defaultStyle: 'lorelei' }).defaultStyle).toBe('lorelei')
  })
})

describe('resolveAvatarModule — respect des toggles', () => {
  it('défauts : éditeur 2 styles, photo, invitation 3× / 12 h / 3,5 s, badge', () => {
    expect(resolveAvatarModule()).toMatchObject({
      enabled: true,
      styles: ['portrait', 'lorelei'],
      editorAvailable: true,
      defaultStyle: 'portrait',
      photoEnabled: true,
      promptEnabled: true,
      promptMaxShows: 3,
      promptIntervalMs: 12 * 60 * 60 * 1000,
      promptDelayMs: 3500,
      badgeEnabled: true,
    })
  })

  it('module coupé : pas d’éditeur, pas d’invitation, pas de badge', () => {
    const mod = resolveAvatarModule({ moduleEnabled: false, settings: DEFAULT_AVATAR_SETTINGS })
    expect(mod).toMatchObject({
      enabled: false,
      styles: [],
      editorAvailable: false,
      photoEnabled: false,
      promptEnabled: false,
      badgeEnabled: false,
    })
  })

  it('toggles individuels : invitation, badge, photo', () => {
    expect(resolveAvatarModule({ settings: { promptEnabled: false } }).promptEnabled).toBe(false)
    expect(resolveAvatarModule({ settings: { badgeEnabled: false } }).badgeEnabled).toBe(false)
    expect(resolveAvatarModule({ settings: { photoEnabled: false } }).photoEnabled).toBe(false)
  })

  it('photo seule : pas d’éditeur généré donc pas d’invitation', () => {
    const mod = resolveAvatarModule({
      settings: { portraitEnabled: false, loreleiEnabled: false, photoEnabled: true },
    })
    expect(mod.editorAvailable).toBe(false)
    expect(mod.promptEnabled).toBe(false)
  })

  it('max d’affichages, intervalle et délai configurables', () => {
    const mod = resolveAvatarModule({
      settings: { promptMaxShows: 5, promptIntervalHours: 2, promptDelaySeconds: 1.5 },
    })
    expect(mod.promptMaxShows).toBe(5)
    expect(mod.promptIntervalMs).toBe(2 * 60 * 60 * 1000)
    expect(mod.promptDelayMs).toBe(1500)
  })
})
