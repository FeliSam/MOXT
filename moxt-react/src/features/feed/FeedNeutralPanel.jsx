import { useState } from 'react'
import { resolveMediaDisplayUrl } from '../../services/media/mediaUrlUtils.js'
import { FeedMediaImage } from './FeedMediaImage'

/**
 * Fond dégradé « carte (annonces sans photo : colis, job, event, P2P).
 */
export function FeedNeutralPanel({
  gradient,
  cover = '',
  bucket = 'listings',
  children,
}) {
  const url = resolveMediaDisplayUrl(cover, { legacyBucket: bucket }) || ''
  const [broken, setBroken] = useState(false)
  const showImage = Boolean(url) && !broken

  return (
    <div className={`relative h-full w-full bg-gradient-to-br ${gradient}`}>
      {showImage ? <FeedMediaImage src={url} onError={() => setBroken(true)} /> : null}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+4.25rem)] z-10 px-5">
        {children}
      </div>
    </div>
  )
}

export function FeedNeutralCard({ eyebrow, badges, children }) {
  return (
    <div className="relative mx-auto max-w-sm rounded-[1.5rem] border border-white/15 bg-black/35 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
      {badges ? (
        <div className="pointer-events-none absolute -top-3 right-3 z-20 flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-1.5">
          {badges}
        </div>
      ) : null}
      {eyebrow ? (
        <p className="pr-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">{eyebrow}</p>
      ) : null}
      {children}
    </div>
  )
}

export function FeedNeutralPill({ children, tone = 'dark' }) {
  const cls =
    tone === 'light'
      ? 'rounded-full bg-white px-3 py-1 text-[11px] font-black text-black shadow-[0_4px_14px_rgba(0,0,0,0.35)]'
      : 'rounded-full bg-black/80 px-3 py-1 text-[11px] font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.35)] ring-1 ring-white/25 backdrop-blur-sm'
  return <span className={cls}>{children}</span>
}

export function FeedNeutralRow({ icon: Icon, iconClass, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ring-1 ${iconClass}`}
      >
        <Icon className="text-sm" aria-hidden />
      </span>
      <div className="min-w-0">
        {label ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
        ) : null}
        <p className="truncate text-[1.05rem] font-black tracking-tight text-white">{value}</p>
      </div>
    </div>
  )
}
