import { useMemo, useState } from 'react'
import { HiQrCode } from 'react-icons/hi2'
import { useSelector } from 'react-redux'
import { Modal } from '../../components/ui/Modal'
import { selectAccountPreferences } from '../account/accountSlice'
import { useLanguage } from '../../contexts/useLanguage'
import { resolveMediaDisplayUrl } from '../../services/media/mediaUrlUtils'
import { buildAbsoluteUrl } from '../../utils/siteUrl'
import { QrSharePanel } from './QrSharePanel'

/**
 * Bouton QR posé sur la couverture (PublicProfileHero shareSlot) : même rendu pour
 * la fiche entreprise, le profil public perso et « Mes publications ».
 * Pastille 44 px (zone tactile), blanche en clair, sombre translucide en sombre.
 */
const COVER_BUTTON_CLASS =
  'size-11 rounded-2xl border border-black/10 bg-white/95 text-slate-900 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.45)] backdrop-blur-md hover:bg-white active:scale-95 dark:border-white/20 dark:bg-slate-950/75 dark:text-white dark:hover:bg-slate-900/90'

const DEFAULT_BUTTON_CLASS =
  'rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-accent)] shadow-[var(--shadow-card)] hover:border-brand-200 hover:bg-[var(--app-surface-muted)] dark:hover:border-brand-800'

export function ProfileQrShareButton({
  activityVisibility: activityVisibilityProp,
  appearance = 'default',
  className = '',
  hint,
  isOwnProfile = true,
  refreshKey,
  shareText: shareTextProp,
  shareUrl: shareUrlProp,
  size = 'md',
  subtitle,
  title,
  type = 'user',
  targetPath,
  verified = false,
  city,
  sector,
  logoUrl,
}) {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const preferences = useSelector((state) =>
    user ? selectAccountPreferences(state, user.id) : null,
  )
  const [open, setOpen] = useState(false)
  const isCover = appearance === 'cover'
  const sizeClass = isCover ? '' : size === 'sm' ? 'size-8 text-base' : 'size-10 text-lg'
  const iconClass = isCover ? 'size-6' : size === 'sm' ? 'text-base' : 'text-lg'
  const shareUrl = useMemo(
    () => shareUrlProp || buildAbsoluteUrl(targetPath),
    [shareUrlProp, targetPath],
  )
  const resolvedLogoUrl = logoUrl ? resolveMediaDisplayUrl(logoUrl) || logoUrl : ''
  const isBusiness = type === 'business'
  // L’avertissement « profil privé » ne concerne que le propriétaire : pas de repli
  // sur les préférences du visiteur quand il consulte le profil de quelqu’un d’autre.
  const activityVisibility =
    activityVisibilityProp ||
    (!isBusiness && isOwnProfile ? preferences?.activityVisibility : undefined)
  const resolvedShareText =
    shareTextProp ||
    (isBusiness
      ? t('share.shareTexts.business', { name: title })
      : t('share.shareTexts.profile', { name: title }))

  return (
    <>
      <button
        type="button"
        className={`grid ${sizeClass} shrink-0 place-items-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-2 ${
          isCover ? COVER_BUTTON_CLASS : DEFAULT_BUTTON_CLASS
        } ${className}`}
        onClick={() => setOpen(true)}
        aria-label={isBusiness ? t('share.showBusinessQr') : t('share.showProfileQr')}
        aria-haspopup="dialog"
        title={t('share.qrToShare')}
      >
        <HiQrCode className={iconClass} aria-hidden="true" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isBusiness ? t('share.qrBusiness') : t('share.qrProfile')}
        size="default"
      >
        <QrSharePanel
          key={refreshKey || shareUrl}
          variant={isBusiness ? 'business' : 'profile'}
          activityVisibility={activityVisibility}
          title={title}
          subtitle={subtitle}
          avatarUrl={resolvedLogoUrl}
          verified={verified}
          city={city}
          sector={sector}
          hint={hint}
          shareUrl={shareUrl}
          shareTitle={
            isBusiness
              ? t('share.shareTitles.onMoxt', { name: title })
              : t('share.shareTitles.publications', { name: title })
          }
          shareText={resolvedShareText}
          qrSize={240}
        />
      </Modal>
    </>
  )
}
