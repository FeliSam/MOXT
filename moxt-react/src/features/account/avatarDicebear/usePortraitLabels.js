import { useLanguage } from '../../../contexts/useLanguage'

/** Libellé traduit, repli sur le libellé FR du manifeste. */
export function usePortraitLabels() {
  const { t } = useLanguage()
  const label = (key, fallback) => {
    const full = `profile.avatarEditor.${key}`
    const value = t(full)
    return value && value !== full ? value : fallback
  }
  return {
    toneLabel: (tone) => label(`tones.${tone.id}`, tone.label_fr),
    hairLabel: (hair) => label(`hairstyles.${hair.id}`, hair.label_fr),
  }
}
