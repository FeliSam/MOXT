import { useState } from 'react'
import { FiDownload, FiLoader } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { renderShareBadge } from './badgeCanvas'

function slugify(value = 'moxt') {
  return (
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'moxt'
  )
}

export function DownloadBadgeButton({ variant, title, subtitle, city, verified, qrUrl, avatarUrl, className = '' }) {
  const { t } = useLanguage()
  const [status, setStatus] = useState('idle')

  async function handleDownload() {
    if (status === 'loading') return
    setStatus('loading')
    try {
      const blob = await renderShareBadge({
        variant: variant === 'business' ? 'business' : 'personal',
        title,
        subtitle,
        city,
        verified,
        qrUrl,
        avatarUrl,
        tagline: {
          line1: t('share.badge.taglineLine1'),
          line2:
            variant === 'business' ? t('share.badge.taglineLine2Business') : t('share.badge.taglineLine2Personal'),
        },
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `moxt-badge-${slugify(title)}.png`
      link.click()
      URL.revokeObjectURL(url)
      setStatus('idle')
    } catch {
      setStatus('error')
      window.setTimeout(() => setStatus('idle'), 2500)
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className={`!border-transparent !bg-white !text-slate-950 hover:!bg-slate-100 ${className}`}
      icon={status === 'loading' ? FiLoader : FiDownload}
      onClick={handleDownload}
      disabled={status === 'loading'}
    >
      {status === 'loading'
        ? t('share.badge.generating')
        : status === 'error'
          ? t('share.badge.error')
          : t('share.badge.download')}
    </Button>
  )
}
