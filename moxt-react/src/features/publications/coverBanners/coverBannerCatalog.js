/** Stable Moxt premium empty-cover style IDs (CSS/SVG banners). */

export const COVER_STYLE_IDS = Object.freeze({
  BUSINESS_A_MESH: 'business-a-mesh',
  BUSINESS_B_EDITORIAL: 'business-b-editorial',
  BUSINESS_C_GLASS: 'business-c-glass',
  BUSINESS_D_TOPO: 'business-d-topo',
  WOMAN_A_SILK: 'woman-a-silk',
  WOMAN_B_GLASS: 'woman-b-glass',
  WOMAN_C_BLUSH: 'woman-c-blush',
  MAN_A_STEEL: 'man-a-steel',
  MAN_B_TOPO: 'man-b-topo',
  MAN_C_MESH: 'man-c-mesh',
  /** Identité « Prune » du profil perso : vagues prune + rose (défaut). */
  WOMAN_D_PRUNE: 'woman-d-prune',
  MAN_D_PRUNE: 'man-d-prune',
})

export const BUSINESS_COVER_STYLES = Object.freeze([
  COVER_STYLE_IDS.BUSINESS_A_MESH,
  COVER_STYLE_IDS.BUSINESS_B_EDITORIAL,
  COVER_STYLE_IDS.BUSINESS_C_GLASS,
  COVER_STYLE_IDS.BUSINESS_D_TOPO,
])

export const WOMAN_COVER_STYLES = Object.freeze([
  COVER_STYLE_IDS.WOMAN_D_PRUNE,
  COVER_STYLE_IDS.WOMAN_A_SILK,
  COVER_STYLE_IDS.WOMAN_B_GLASS,
  COVER_STYLE_IDS.WOMAN_C_BLUSH,
])

export const MAN_COVER_STYLES = Object.freeze([
  COVER_STYLE_IDS.MAN_D_PRUNE,
  COVER_STYLE_IDS.MAN_A_STEEL,
  COVER_STYLE_IDS.MAN_B_TOPO,
  COVER_STYLE_IDS.MAN_C_MESH,
])

export const PERSONAL_COVER_STYLES = Object.freeze([
  ...WOMAN_COVER_STYLES,
  ...MAN_COVER_STYLES,
])

export const ALL_COVER_STYLES = Object.freeze([
  ...BUSINESS_COVER_STYLES,
  ...PERSONAL_COVER_STYLES,
])

export const DEFAULT_BUSINESS_COVER_STYLE = COVER_STYLE_IDS.BUSINESS_B_EDITORIAL
// Profil perso sans style choisi : vagues prune (un style déjà enregistré reste prioritaire).
export const DEFAULT_WOMAN_COVER_STYLE = COVER_STYLE_IDS.WOMAN_D_PRUNE
export const DEFAULT_MAN_COVER_STYLE = COVER_STYLE_IDS.MAN_D_PRUNE

export const COVER_STYLE_LABELS_FR = Object.freeze({
  [COVER_STYLE_IDS.BUSINESS_A_MESH]: 'Mesh teal',
  [COVER_STYLE_IDS.BUSINESS_B_EDITORIAL]: 'Editorial dark',
  [COVER_STYLE_IDS.BUSINESS_C_GLASS]: 'Glass fintech',
  [COVER_STYLE_IDS.BUSINESS_D_TOPO]: 'Topo emerald',
  [COVER_STYLE_IDS.WOMAN_A_SILK]: 'Silk plum',
  [COVER_STYLE_IDS.WOMAN_B_GLASS]: 'Glass lavande',
  [COVER_STYLE_IDS.WOMAN_C_BLUSH]: 'Blush floral',
  [COVER_STYLE_IDS.MAN_A_STEEL]: 'Steel teal',
  [COVER_STYLE_IDS.MAN_B_TOPO]: 'Topo emerald',
  [COVER_STYLE_IDS.MAN_C_MESH]: 'Mesh midnight',
  [COVER_STYLE_IDS.WOMAN_D_PRUNE]: 'Vagues prune & rose',
  [COVER_STYLE_IDS.MAN_D_PRUNE]: 'Vagues prune nuit',
})

const COVER_STYLE_SET = new Set(ALL_COVER_STYLES)

export function isCoverStyleId(value) {
  return typeof value === 'string' && COVER_STYLE_SET.has(value)
}

export function coverStyleCategory(styleId) {
  if (BUSINESS_COVER_STYLES.includes(styleId)) return 'business'
  if (WOMAN_COVER_STYLES.includes(styleId)) return 'woman'
  if (MAN_COVER_STYLES.includes(styleId)) return 'man'
  return null
}

/**
 * No dedicated gender column on profiles today.
 * Accepts future/auth metadata values; unknown → null.
 */
export function normalizeProfileGender(gender) {
  const raw = String(gender || '')
    .trim()
    .toLowerCase()
  if (!raw) return null
  if (
    ['f', 'female', 'femme', 'woman', 'w', 'madame', 'mlle', 'mme', 'she', 'her'].includes(raw)
  ) {
    return 'female'
  }
  if (['m', 'male', 'homme', 'man', 'h', 'monsieur', 'mr', 'he', 'him'].includes(raw)) {
    return 'male'
  }
  return null
}

export function defaultCoverStyleForPersonal(gender) {
  return normalizeProfileGender(gender) === 'female'
    ? DEFAULT_WOMAN_COVER_STYLE
    : DEFAULT_MAN_COVER_STYLE
}

/** Genre d'un membre d'après ses préférences (champ explicite ou éditeur d'avatar). */
export function genderFromPreferences(preferences) {
  return preferences?.gender || preferences?.avatarDicebear?.preferences?.gender || null
}

/**
 * Bannière perso du PROPRIÉTAIRE du profil (style choisi, sinon défaut selon son genre).
 * - propriétaire : ses préférences (redux) ;
 * - visiteur : les préférences publiques du membre (`memberProfile.coverStyle` / `gender`,
 *   lues dans profiles.preferences) — jamais celles du visiteur.
 */
export function resolveOwnerPersonalCover({ isOwner, ownPreferences, ownGender, memberProfile } = {}) {
  if (isOwner) {
    const gender =
      ownGender || genderFromPreferences(ownPreferences) || memberProfile?.gender || null
    return { gender, coverStyle: ownPreferences?.coverStyle || defaultCoverStyleForPersonal(gender) }
  }
  const gender = memberProfile?.gender || null
  return { gender, coverStyle: memberProfile?.coverStyle || defaultCoverStyleForPersonal(gender) }
}

export function defaultCoverStyleForCategory(category, gender) {
  if (category === 'business') return DEFAULT_BUSINESS_COVER_STYLE
  if (category === 'woman') return DEFAULT_WOMAN_COVER_STYLE
  if (category === 'man') return DEFAULT_MAN_COVER_STYLE
  return defaultCoverStyleForPersonal(gender)
}

export function stylesForCategory(category) {
  if (category === 'business') return BUSINESS_COVER_STYLES
  if (category === 'woman') return WOMAN_COVER_STYLES
  if (category === 'man') return MAN_COVER_STYLES
  return PERSONAL_COVER_STYLES
}

/** Resolve stored preference / legacy emptyCoverVariant → stable style id. */
export function resolveCoverStyleId({
  coverStyle,
  emptyCoverVariant,
  category = 'personal',
  gender,
} = {}) {
  if (isCoverStyleId(coverStyle)) return coverStyle

  if (
    emptyCoverVariant === 'editorial-dark' ||
    emptyCoverVariant === 'business-b-editorial'
  ) {
    return DEFAULT_BUSINESS_COVER_STYLE
  }

  if (category === 'business') return DEFAULT_BUSINESS_COVER_STYLE
  if (category === 'woman') return DEFAULT_WOMAN_COVER_STYLE
  if (category === 'man') return DEFAULT_MAN_COVER_STYLE

  return defaultCoverStyleForPersonal(gender)
}
