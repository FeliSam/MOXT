import {
  BUSINESS_COVER_STYLES,
  COVER_STYLE_LABELS_FR,
  MAN_COVER_STYLES,
  WOMAN_COVER_STYLES,
  normalizeProfileGender,
} from './coverBannerCatalog'

/** Onglet Femme / Homme présélectionné : genre connu, sinon famille du style actuel. */
export function initialBannerGenderTab(gender, value) {
  const known = normalizeProfileGender(gender)
  if (known === 'female') return 'woman'
  if (known === 'male') return 'man'
  return value && WOMAN_COVER_STYLES.includes(value) ? 'woman' : 'man'
}

/** Styles proposés : 4 pour une entreprise, 3 par onglet pour un profil perso. */
export function bannerStylesFor(category, genderTab) {
  if (category === 'business') return BUSINESS_COVER_STYLES
  return genderTab === 'woman' ? WOMAN_COVER_STYLES : MAN_COVER_STYLES
}

/** Style initial du brouillon : la valeur si elle est proposée, sinon le premier style de la liste. */
export function initialBannerDraft(category, genderTab, value) {
  const styles = bannerStylesFor(category, genderTab)
  return styles.includes(value) ? value : styles[0]
}

/** Style aléatoire toujours différent de l’actuel (liste ≥ 2). */
export function randomBannerStyle(styles, current, random = Math.random) {
  const pool = styles.filter((id) => id !== current)
  if (!pool.length) return current
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
}

/** Libellé traduit `profile.bannerEditor.styles.<id>` avec repli sur les noms FR du catalogue. */
export function bannerStyleLabel(t, styleId, labels = COVER_STYLE_LABELS_FR) {
  const key = `profile.bannerEditor.styles.${styleId}`
  const value = typeof t === 'function' ? t(key) : ''
  if (value && value !== key) return value
  return labels?.[styleId] || COVER_STYLE_LABELS_FR[styleId] || styleId
}
