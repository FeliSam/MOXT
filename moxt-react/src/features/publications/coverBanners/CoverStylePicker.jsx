import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { useLanguage } from '../../../contexts/useLanguage'
import { BannerEditor } from './BannerEditor'
import { bannerStyleLabel } from './bannerEditorUtils'
import { COVER_STYLE_LABELS_FR } from './coverBannerCatalog'
import { MoxtCoverBanner } from './MoxtCoverBanner'

/**
 * Éditeur de bannière du propriétaire (entreprise ou profil perso) : ouvre l’éditeur premium
 * `BannerEditor` (même univers que l’éditeur d’avatar). API conservée pour les pages existantes ;
 * `title`, `hint`, `applyLabel`, `manLabel`, `womanLabel`, `activeLabel`, `closeLabel` sont
 * désormais traduits dans `profile.bannerEditor.*` et ignorés.
 */
export function CoverStylePicker({
  open,
  onClose,
  category = 'business',
  value,
  gender,
  onChange,
  labels = COVER_STYLE_LABELS_FR,
  previewName = '',
  previewAvatarUrl = '',
  onUploadPhoto = null,
}) {
  if (!open) return null
  return (
    <BannerEditor
      open
      onClose={onClose}
      category={category}
      value={value}
      gender={gender}
      onChange={onChange}
      labels={labels}
      previewName={previewName}
      previewAvatarUrl={previewAvatarUrl}
      onUploadPhoto={onUploadPhoto}
    />
  )
}

/** Aperçu compact + bouton qui ouvre l’éditeur de bannière (formulaires / configuration). */
export function CoverStylePickerField({
  category = 'business',
  value,
  gender,
  onChange,
  labels = COVER_STYLE_LABELS_FR,
  buttonLabel = 'Choisir un style Moxt',
  disabled = false,
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  return (
    <div className="grid gap-2">
      <div className="relative h-28 overflow-hidden rounded-2xl border border-[var(--app-border)]">
        <MoxtCoverBanner
          styleId={value}
          category={category}
          gender={gender}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <p className="text-xs text-[var(--app-text-muted)]">
        {t('profile.bannerEditor.currentStyle')}{' '}
        <strong>{bannerStyleLabel(t, value, labels)}</strong>
      </p>
      <Button type="button" variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>
      <CoverStylePicker
        open={open}
        onClose={() => setOpen(false)}
        category={category}
        value={value}
        gender={gender}
        onChange={onChange}
        labels={labels}
      />
    </div>
  )
}
