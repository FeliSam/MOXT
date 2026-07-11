import { useMemo, useState } from 'react'
import { HiQrCode } from 'react-icons/hi2'
import { Modal } from '../../components/ui/Modal'
import { buildAbsoluteUrl } from '../../utils/siteUrl'
import { QrSharePanel } from './QrSharePanel'

export function ProfileQrShareButton({
  className = '',
  subtitle,
  title,
  type = 'user',
  targetPath,
  verified = false,
  city,
  sector,
  logoUrl,
}) {
  const [open, setOpen] = useState(false)
  const shareUrl = useMemo(() => buildAbsoluteUrl(targetPath), [targetPath])
  const isBusiness = type === 'business'

  return (
    <>
      <button
        type="button"
        className={`grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-accent)] shadow-[var(--shadow-card)] transition hover:border-brand-200 hover:bg-[var(--app-surface-muted)] dark:hover:border-brand-800 ${className}`}
        onClick={() => setOpen(true)}
        aria-label={isBusiness ? 'Afficher le QR code entreprise' : 'Afficher le QR code du profil'}
        title="QR code à partager"
      >
        <HiQrCode className="text-lg" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isBusiness ? 'QR code entreprise' : 'QR code profil'}
        size="default"
      >
        <QrSharePanel
          variant={isBusiness ? 'business' : 'profile'}
          title={title}
          subtitle={subtitle}
          avatarUrl={logoUrl}
          verified={verified}
          city={city}
          sector={sector}
          shareUrl={shareUrl}
          shareTitle={isBusiness ? `${title} sur MOXT` : `Publications de ${title}`}
          shareText={
            isBusiness
              ? `Découvrez ${title} sur MOXT.`
              : `Consultez les publications de ${title} sur MOXT.`
          }
          qrSize={240}
        />
      </Modal>
    </>
  )
}
