import { describe, expect, it } from 'vitest'
import { COVER_STYLE_IDS, resolveOwnerPersonalCover } from './coverBanners/coverBannerCatalog'
import { profileInitials } from './profileInitials'
import { mapRemoteProfile } from './usePublicationProfile'

describe('bannière du propriétaire du profil', () => {
  it('visiteur : suit le style choisi par le propriétaire, jamais celui du visiteur', () => {
    const cover = resolveOwnerPersonalCover({
      isOwner: false,
      ownPreferences: { coverStyle: COVER_STYLE_IDS.MAN_A_STEEL },
      ownGender: 'male',
      memberProfile: { coverStyle: COVER_STYLE_IDS.WOMAN_C_BLUSH, gender: 'f' },
    })
    expect(cover.coverStyle).toBe(COVER_STYLE_IDS.WOMAN_C_BLUSH)
    expect(cover.gender).toBe('f')
  })

  it('visiteur : sans style choisi, défaut selon le genre du propriétaire (pas du visiteur)', () => {
    const cover = resolveOwnerPersonalCover({
      isOwner: false,
      ownPreferences: { coverStyle: COVER_STYLE_IDS.MAN_A_STEEL },
      ownGender: 'male',
      memberProfile: mapRemoteProfile({
        first_name: 'Awa',
        preferences: { avatarDicebear: { preferences: { gender: 'f' } } },
      }),
    })
    expect(cover.coverStyle).toBe(COVER_STYLE_IDS.WOMAN_D_PRUNE)
  })

  it('propriétaire : ses propres préférences', () => {
    expect(
      resolveOwnerPersonalCover({ isOwner: true, ownPreferences: { coverStyle: COVER_STYLE_IDS.MAN_B_TOPO } }).coverStyle,
    ).toBe(COVER_STYLE_IDS.MAN_B_TOPO)
    expect(resolveOwnerPersonalCover({ isOwner: true, ownGender: 'female' }).coverStyle).toBe(
      COVER_STYLE_IDS.WOMAN_D_PRUNE,
    )
  })

  it('mapRemoteProfile ne reprend que le style et le genre des préférences', () => {
    const profile = mapRemoteProfile({
      first_name: 'Awa',
      preferences: { coverStyle: COVER_STYLE_IDS.WOMAN_A_SILK, emailNotifications: false, gender: 'female' },
    })
    expect(profile).toMatchObject({ coverStyle: COVER_STYLE_IDS.WOMAN_A_SILK, gender: 'female' })
    expect(profile.emailNotifications).toBeUndefined()
    expect(mapRemoteProfile({ first_name: 'X' })).toMatchObject({ coverStyle: null, gender: null })
  })
})

describe('profileInitials', () => {
  it('même règle partout : 2 premiers caractères du nom complet', () => {
    expect(profileInitials('Рикардо Оке')).toBe('РИ')
    expect(profileInitials('  ada lovelace')).toBe('AD')
    expect(profileInitials('', 'Moxt Logistique')).toBe('MO')
    expect(profileInitials('')).toBe('?')
  })
})