import { useMemo, useState } from 'react'
import { FiBriefcase, FiCheck, FiCopy, FiMapPin, FiShare2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { VerifiedBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { makeQrCodeUrl } from '../../utils/qrCode'

function initialsFromTitle(title = '') {
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return title.slice(0, 2).toUpperCase()
}

export function QrSharePanel({
  variant = 'profile',
  activityVisibility,
  title,
  subtitle,
  avatarUrl,
  verified = false,
  city,
  sector,
  shareUrl,
  shareTitle,
  shareText,
  code,
  inviteCount,
  qrImageSrc,
  qrSize = 260,
  showActions = true,
  className = '',
}) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const qrUrl = useMemo(
    () => qrImageSrc || makeQrCodeUrl(shareUrl, qrSize),
    [qrImageSrc, shareUrl, qrSize, title, city, sector, avatarUrl],
  )
  const showPrivateProfileWarning =
    (variant === 'profile' || variant === 'business') && activityVisibility === 'private'

  const hint = t(`share.hints.${variant}`)
  const resolvedShareTitle =
    shareTitle ||
    (variant === 'invite'
      ? t('share.shareTitles.invite')
      : variant === 'instagram'
        ? t('share.shareTitles.instagram')
        : t('share.shareTitles.onMoxt', { name: title }))
  const resolvedShareText =
    shareText ||
    (variant === 'invite'
      ? t('share.shareTexts.invite')
      : variant === 'instagram'
        ? t('share.shareTexts.instagram')
        : variant === 'business'
          ? t('share.shareTexts.business', { name: title })
          : t('share.shareTexts.profile', { name: title }))

  async function copyLink() {
    try {
      await navigator.clipboard?.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resolvedShareTitle,
          text: resolvedShareText,
          url: shareUrl,
        })
        return
      } catch {
        /* annulé */
      }
    }
    copyLink()
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      {showPrivateProfileWarning ? (
        <Alert variant="warning" title={t('share.privateProfileWarning.title')}>
          {t('share.privateProfileWarning.description')}{' '}
          <Link
            to="/settings#settings-visibility"
            className="font-semibold underline underline-offset-2"
          >
            {t('share.privateProfileWarning.settingsLink')}
          </Link>
        </Alert>
      ) : null}
      <div
        className="relative overflow-hidden rounded-[2rem] text-white shadow-[0_24px_60px_-20px_rgba(15,118,110,0.55)]"
      style={{
        background:
          variant === 'invite'
            ? 'linear-gradient(165deg, #0f766e 0%, #0d9488 38%, #155e75 72%, #1e293b 100%)'
            : variant === 'business'
              ? 'linear-gradient(165deg, #020617 0%, #0f172a 32%, #1e293b 58%, #0f766e 100%)'
              : variant === 'instagram'
                ? 'linear-gradient(165deg, #0f766e 0%, #0d9488 36%, #155e75 68%, #1e293b 100%)'
                : 'linear-gradient(165deg, #0f766e 0%, #0d9488 42%, #134e4a 78%, #0f172a 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-cyan-300/10 blur-3xl"
      />

      <div className="relative flex flex-col items-center px-6 py-8 text-center sm:px-8 sm:py-10">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-[4.5rem] rounded-full border-[3px] border-white/25 object-cover shadow-lg ring-4 ring-white/10"
          />
        ) : (
          <span className="grid size-[4.5rem] place-items-center rounded-full border-[3px] border-white/25 bg-white/12 text-xl font-black shadow-lg ring-4 ring-white/10">
            {initialsFromTitle(title)}
          </span>
        )}

        <div className="mt-4 flex max-w-full flex-wrap items-center justify-center gap-1.5">
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">{title}</h2>
          {verified ? <VerifiedBadge size="sm" className="text-emerald-300" /> : null}
        </div>

        {subtitle ? (
          <p className="mt-1 max-w-sm text-sm text-white/75">{subtitle}</p>
        ) : null}

        {city ? (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-white/60">
            <FiMapPin className="shrink-0" />
            {city}
          </p>
        ) : null}

        {variant === 'business' && sector ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/80">
            <FiBriefcase className="text-xs" />
            {sector}
          </p>
        ) : null}

        {code ? (
          <p className="mt-4 font-mono text-sm tracking-[0.2em] text-white/70">{code}</p>
        ) : null}

        {variant === 'invite' && inviteCount !== null ? (
          <div className="mt-5 grid w-full max-w-xs grid-cols-1 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-3xl font-black tracking-tight">{inviteCount}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
                {inviteCount === 1 ? t('share.inviteCountOne') : t('share.inviteCountMany')}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-7 rounded-[1.35rem] bg-white p-3.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)]">
          <img
            key={shareUrl}
            src={qrUrl}
            alt=""
            width={qrSize}
            height={qrSize}
            className="block"
            style={{ width: qrSize, height: qrSize }}
          />
        </div>

        <p className="mt-4 text-xs text-white/55">{hint}</p>

        {showActions ? (
          <div className="mt-5 w-full max-w-md">
            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-left text-xs text-white/75 transition hover:bg-white/12"
            >
              {copied ? (
                <FiCheck className="shrink-0 text-emerald-300" />
              ) : (
                <FiCopy className="shrink-0" />
              )}
              <span className="truncate">{shareUrl}</span>
            </button>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button
                className="border border-white/20 bg-white/10 text-white shadow-none hover:bg-white/20"
                icon={copied ? FiCheck : FiCopy}
                onClick={copyLink}
              >
                {copied ? t('share.copied') : t('share.copyLink')}
              </Button>
              <Button
                variant="secondary"
                className="!border-transparent !bg-white !text-slate-950 hover:!bg-slate-100"
                icon={FiShare2}
                onClick={shareLink}
              >
                {t('share.share')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
    </div>
  )
}
