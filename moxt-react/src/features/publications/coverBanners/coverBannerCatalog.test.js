import { describe, expect, it } from 'vitest'
import {
  COVER_STYLE_IDS,
  DEFAULT_BUSINESS_COVER_STYLE,
  DEFAULT_MAN_COVER_STYLE,
  DEFAULT_WOMAN_COVER_STYLE,
  MAN_COVER_STYLES,
  WOMAN_COVER_STYLES,
  coverStyleCategory,
  defaultCoverStyleForPersonal,
  isCoverStyleId,
  normalizeProfileGender,
  resolveCoverStyleId,
} from './coverBannerCatalog'

describe('coverBannerCatalog', () => {
  it('defaults business to editorial (B)', () => {
    expect(DEFAULT_BUSINESS_COVER_STYLE).toBe(COVER_STYLE_IDS.BUSINESS_B_EDITORIAL)
    expect(
      resolveCoverStyleId({ category: 'business', emptyCoverVariant: 'editorial-dark' }),
    ).toBe(COVER_STYLE_IDS.BUSINESS_B_EDITORIAL)
  })

  it('defaults woman / man personal styles to the prune waves', () => {
    expect(DEFAULT_WOMAN_COVER_STYLE).toBe(COVER_STYLE_IDS.WOMAN_D_PRUNE)
    expect(DEFAULT_MAN_COVER_STYLE).toBe(COVER_STYLE_IDS.MAN_D_PRUNE)
    expect(defaultCoverStyleForPersonal('female')).toBe(COVER_STYLE_IDS.WOMAN_D_PRUNE)
    expect(defaultCoverStyleForPersonal('male')).toBe(COVER_STYLE_IDS.MAN_D_PRUNE)
    expect(defaultCoverStyleForPersonal(undefined)).toBe(COVER_STYLE_IDS.MAN_D_PRUNE)
  })

  it('keeps an explicitly chosen personal style and lists prune first', () => {
    expect(
      resolveCoverStyleId({ coverStyle: COVER_STYLE_IDS.WOMAN_A_SILK, category: 'personal' }),
    ).toBe(COVER_STYLE_IDS.WOMAN_A_SILK)
    expect(
      resolveCoverStyleId({ coverStyle: COVER_STYLE_IDS.MAN_C_MESH, category: 'personal' }),
    ).toBe(COVER_STYLE_IDS.MAN_C_MESH)
    expect(WOMAN_COVER_STYLES[0]).toBe(COVER_STYLE_IDS.WOMAN_D_PRUNE)
    expect(MAN_COVER_STYLES[0]).toBe(COVER_STYLE_IDS.MAN_D_PRUNE)
    expect(coverStyleCategory(COVER_STYLE_IDS.WOMAN_D_PRUNE)).toBe('woman')
    expect(coverStyleCategory(COVER_STYLE_IDS.MAN_D_PRUNE)).toBe('man')
  })

  it('normalizes gender aliases and keeps unknown as null', () => {
    expect(normalizeProfileGender('femme')).toBe('female')
    expect(normalizeProfileGender('Homme')).toBe('male')
    expect(normalizeProfileGender('')).toBeNull()
    expect(normalizeProfileGender('other')).toBeNull()
  })

  it('accepts stored coverStyle when valid', () => {
    expect(
      resolveCoverStyleId({
        coverStyle: COVER_STYLE_IDS.BUSINESS_C_GLASS,
        category: 'business',
      }),
    ).toBe(COVER_STYLE_IDS.BUSINESS_C_GLASS)
    expect(isCoverStyleId('not-a-style')).toBe(false)
  })
})
