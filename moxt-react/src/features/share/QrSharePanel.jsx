import { useMemo, useState } from 'react'
import { FiBriefcase, FiCheck, FiCopy, FiMapPin, FiShare2 } from 'react-icons/fi'
import { VerifiedBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { makeQrCodeUrl } from '../../utils/qrCode'

const THEMES = {
  invite: {
    gradient:
      'linear-gradient(165deg, #0f766e 0%, #0d9488 38%, #155e75 72%, #1e293b 100%)',
    hint: 'Scannez pour rejoindre MOXT',
    shareTitle: 'Rejoignez MOXT',
    shareText:
      'Transferts, colis et services entre l’Afrique et la Russie. Rejoignez-moi sur MOXT :',
  },
  profile: {
    gradient:
      'linear-gradient(165deg, #0f766e 0%, #0d9488 42%, #134e4a 78%, #0f172a 100%)',
    hint: 'Scannez pour voir mes publications',
    shareTitle: null,
    shareText: null,
  },
  business: {
    gradient:
      'linear-gradient(165deg, #020617 0%, #0f172a 32%, #1e293b 58%, #0f766e 100%)',
    hint: 'Scannez pour découvrir cette entreprise',
    shareTitle: null,
    shareText: null,
  },
}

function initialsFromTitle(title = '') {
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return title.slice(0, 2).toUpperCase()
}

export function QrSharePanel({
  variant = 'profile',
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
  qrSize = 260,
  showActions = true,
  className = '',
}) {
  const theme = THEMES[variant] || THEMES.profile
  const [copied, setCopied] = useState(false)
  const qrUrl = useMemo(() => makeQrCodeUrl(shareUrl, qrSize), [shareUrl, qrSize])
  const resolvedShareTitle = shareTitle || theme.shareTitle || `${title} sur MOXT`
  const resolvedShareText =
    shareText ||
    theme.shareText ||
    (variant === 'business'
      ? `Découvrez ${title} sur MOXT.`
      : `Consultez les publications de ${title} sur MOXT.`)

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
    <div
      className={`relative overflow-hidden rounded-[2rem] text-white shadow-[0_24px_60px_-20px_rgba(15,118,110,0.55)] ${className}`}
      style={{ background: theme.gradient }}
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

        <div className="mt-4 flex max-w-full flex-wrap items-center justify-center gap-2">
          {verified ? <VerifiedBadge size="sm" /> : null}
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">{title}</h2>
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

        <div className="mt-7 rounded-[1.35rem] bg-white p-3.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)]">
          <img
            src={qrUrl}
            alt=""
            width={qrSize}
            height={qrSize}
            className="block"
            style={{ width: qrSize, height: qrSize }}
          />
        </div>

        <p className="mt-4 text-xs text-white/55">{theme.hint}</p>

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
                {copied ? 'Copié' : 'Copier le lien'}
              </Button>
              <Button
                variant="secondary"
                className="!border-transparent !bg-white !text-slate-950 hover:!bg-slate-100"
                icon={FiShare2}
                onClick={shareLink}
              >
                Partager
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
