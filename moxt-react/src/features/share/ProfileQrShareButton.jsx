import { useMemo, useState } from 'react'
import { HiQrCode } from 'react-icons/hi2'
import { Modal } from '../../components/ui/Modal'
import { useLanguage } from '../../contexts/useLanguage'
import { buildAbsoluteUrl } from '../../utils/siteUrl'
import { QrSharePanel } from './QrSharePanel'

export function ProfileQrShareButton({
  className = '',
  refreshKey,
  shareText: shareTextProp,
  shareUrl: shareUrlProp,
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
  const [open, setOpen] = useState(false)
  const shareUrl = useMemo(
    () => shareUrlProp || buildAbsoluteUrl(targetPath),
    [shareUrlProp, targetPath],
  )
  const isBusiness = type === 'business'
  const resolvedShareText =
    shareTextProp ||
    (isBusiness
      ? t('share.shareTexts.business', { name: title })
      : t('share.shareTexts.profile', { name: title }))

  return (
    <>
      <button
        type="button"
        className={`grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-accent)] shadow-[var(--shadow-card)] transition hover:border-brand-200 hover:bg-[var(--app-surface-muted)] dark:hover:border-brand-800 ${className}`}
        onClick={() => setOpen(true)}
        aria-label={isBusiness ? t('share.showBusinessQr') : t('share.showProfileQr')}
        title={t('share.qrToShare')}
      >
        <HiQrCode className="text-lg" />
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
          title={title}
          subtitle={subtitle}
          avatarUrl={logoUrl}
          verified={verified}
          city={city}
          sector={sector}
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
