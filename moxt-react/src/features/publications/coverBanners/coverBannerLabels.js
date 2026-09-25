/** Libellés affichés dans les bannières (FR par défaut ; traduits via coverBanner.* ). */
export const COVER_BANNER_LABELS_FR = {
  profile: 'Profil',
  yourProfile: 'Votre profil',
  onMoxt: 'Présent sur Moxt',
  yourNetwork: 'Votre réseau',
  yourBusinessNetwork: 'Votre réseau business',
}

export function coverBannerLabels(t) {
  return Object.fromEntries(
    Object.entries(COVER_BANNER_LABELS_FR).map(([key, fallback]) => {
      const value = typeof t === 'function' ? t(`coverBanner.${key}`) : null
      return [key, value && value !== `coverBanner.${key}` ? value : fallback]
    }),
  )
}
