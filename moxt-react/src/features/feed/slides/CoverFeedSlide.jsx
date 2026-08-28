import { useState } from 'react'
import { FiBox, FiBriefcase, FiCalendar, FiFileText } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { resolveMediaDisplayUrl } from '../../../services/media/mediaUrlUtils.js'
import { formatMoney } from '../../transfers/transferUtils'
import { phase3Text } from '../../../i18n/phase3I18n'
import { FeedMediaImage } from '../FeedMediaImage'
import { FeedSlideShell } from '../FeedSlideShell'

const KIND_META = {
  parcel: {
    icon: FiBox,
    gradient: 'from-sky-700 via-blue-800 to-indigo-950',
    ctaKey: 'feed.cta.parcel',
    bucket: 'documents',
  },
  job: {
    icon: FiBriefcase,
    gradient: 'from-emerald-700 via-teal-800 to-slate-950',
    ctaKey: 'feed.cta.job',
    bucket: 'listings',
  },
  event: {
    icon: FiCalendar,
    gradient: 'from-violet-700 via-purple-800 to-slate-950',
    ctaKey: 'feed.cta.event',
    bucket: 'listings',
  },
  post: {
    icon: FiFileText,
    gradient: 'from-rose-700 via-red-800 to-slate-950',
    ctaKey: 'feed.cta.post',
    bucket: 'posts',
  },
}

function CoverMeta({ item, p3 }) {
  if (item.kind === 'parcel') {
    const price =
      item.stats?.pricePerKg != null
        ? formatMoney(item.stats.pricePerKg, item.stats.currency)
        : null
    return (
      <p className="mt-2 text-sm font-semibold text-white/80">
        {[
          price ? p3('feed.meta.pricePerKg', { price }) : null,
          item.stats?.remainingKg != null
            ? p3('feed.meta.remainingKg', { kg: item.stats.remainingKg })
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
    )
  }
  if (item.kind === 'job') {
    return (
      <p className="mt-2 text-sm font-semibold text-white/80">
        {[item.stats?.city, item.stats?.contractType].filter(Boolean).join(' · ')}
      </p>
    )
  }
  if (item.kind === 'event') {
    const when = item.stats?.startAt ? new Date(item.stats.startAt).toLocaleString() : ''
    return (
      <p className="mt-2 text-sm font-semibold text-white/80">
        {[item.stats?.city, when].filter(Boolean).join(' · ')}
      </p>
    )
  }
  if (item.kind === 'post') {
    const likes = Number(item.stats?.likes) || 0
    const comments = Number(item.stats?.comments) || 0
    return (
      <p className="mt-2 text-sm font-semibold text-white/80">
        {p3('feed.meta.postStats', { likes, comments })}
      </p>
    )
  }
  return null
}

export function CoverFeedSlide({ item, index, active = true }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const meta = KIND_META[item.kind] || KIND_META.post
  const Icon = meta.icon
  const rawCover = item.media?.poster || item.media?.images?.[0] || ''
  const cover = resolveMediaDisplayUrl(rawCover, { legacyBucket: meta.bucket }) || ''
  const [broken, setBroken] = useState(false)
  const showImage = Boolean(cover) && !broken

  return (
    <FeedSlideShell
      index={index}
      item={item}
      publisher={item.publisher}
      title={item.title}
      caption={item.caption}
      ctaLabel={p3(meta.ctaKey)}
      ctaTo={item.href}
      active={active}
      metaExtra={<CoverMeta item={item} p3={p3} />}
    >
      <div className={`relative h-full w-full bg-gradient-to-br ${meta.gradient}`}>
        {showImage ? (
          <FeedMediaImage src={cover} onError={() => setBroken(true)} />
        ) : (
          <div className="grid h-full place-items-center text-white/70">
            <Icon className="text-5xl" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/30 via-transparent to-black/15" />
        <span className="pointer-events-none absolute left-3 z-10 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm top-[calc(env(safe-area-inset-top,0px)+3.35rem)]">
          {p3(`feed.kind.${item.kind}`)}
        </span>
      </div>
    </FeedSlideShell>
  )
}
