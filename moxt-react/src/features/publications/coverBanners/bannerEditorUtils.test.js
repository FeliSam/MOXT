import { describe, expect, it } from 'vitest'
import {
  bannerStyleLabel,
  bannerStylesFor,
  initialBannerDraft,
  initialBannerGenderTab,
  randomBannerStyle,
} from './bannerEditorUtils'
import {
  BUSINESS_COVER_STYLES,
  COVER_STYLE_IDS,
  MAN_COVER_STYLES,
  WOMAN_COVER_STYLES,
} from './coverBannerCatalog'

describe('bannerEditorUtils', () => {
  it('présélectionne l’onglet selon le genre, sinon selon le style actuel', () => {
    expect(initialBannerGenderTab('femme', COVER_STYLE_IDS.MAN_A_STEEL)).toBe('woman')
    expect(initialBannerGenderTab('male', COVER_STYLE_IDS.WOMAN_A_SILK)).toBe('man')
    expect(initialBannerGenderTab(null, COVER_STYLE_IDS.WOMAN_B_GLASS)).toBe('woman')
    expect(initialBannerGenderTab(undefined, undefined)).toBe('man')
  })

  it('propose 4 styles entreprise et 3 + 3 styles perso', () => {
    expect(bannerStylesFor('business', 'woman')).toEqual(BUSINESS_COVER_STYLES)
    expect(bannerStylesFor('personal', 'woman')).toEqual(WOMAN_COVER_STYLES)
    expect(bannerStylesFor('personal', 'man')).toEqual(MAN_COVER_STYLES)
    expect(BUSINESS_COVER_STYLES).toHaveLength(4)
  })

  it('garde la valeur si elle est proposée, sinon le premier style', () => {
    expect(initialBannerDraft('business', 'man', COVER_STYLE_IDS.BUSINESS_C_GLASS)).toBe(
      COVER_STYLE_IDS.BUSINESS_C_GLASS,
    )
    expect(initialBannerDraft('business', 'man', COVER_STYLE_IDS.MAN_A_STEEL)).toBe(
      BUSINESS_COVER_STYLES[0],
    )
    expect(initialBannerDraft('personal', 'woman', null)).toBe(WOMAN_COVER_STYLES[0])
  })

  it('tire toujours un style différent de l’actuel', () => {
    for (const r of [0, 0.4, 0.99]) {
      const next = randomBannerStyle(MAN_COVER_STYLES, MAN_COVER_STYLES[0], () => r)
      expect(MAN_COVER_STYLES).toContain(next)
      expect(next).not.toBe(MAN_COVER_STYLES[0])
    }
    expect(randomBannerStyle(['only'], 'only')).toBe('only')
  })

  it('traduit le nom du style avec repli sur le catalogue FR', () => {
    const t = (key) => (key.endsWith('business-a-mesh') ? 'Teal mesh' : key)
    expect(bannerStyleLabel(t, COVER_STYLE_IDS.BUSINESS_A_MESH)).toBe('Teal mesh')
    expect(bannerStyleLabel(t, COVER_STYLE_IDS.MAN_C_MESH)).toBe('Mesh midnight')
  })
})
