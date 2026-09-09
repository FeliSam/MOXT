import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiEye, FiPlay } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll'
import { useLanguage } from '../../contexts/useLanguage'
import { captureVideoFrameAtSeconds, videoFeedPath } from '../videos/videoUtils.js'
import { marketplaceText } from './marketplaceI18n'
import {
  MARKETPLACE_DISCOVERY_ITEM_CLASS,
  MARKETPLACE_DISCOVERY_TRACK_CLASS,
} from './marketplaceDiscoveryLayout'

function formatDuration(ms) {
  const total = Math.max(0, Math.round(Number(ms || 0) / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function VideoRailCard({ video, badgeLabel }) {
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const storedPoster = video.thumbnailUrl || ''
  const [framePoster, setFramePoster] = useState('')
  const poster = framePoster || storedPoster
  const views = Number(video.viewCount) || 0

  useEffect(() => {
    const src = video.videoUrl
    if (!src) return undefined
    let cancelled = false
    captureVideoFrameAtSeconds(src, 5).then((url) => {
      if (!cancelled && url) setFramePoster(url)
    })
    return () => {
      cancelled = true
    }
  }, [video.videoUrl])

  return (
    <Link
      to={videoFeedPath(video.id)}
      data-rail-card
      className={`${MARKETPLACE_DISCOVERY_ITEM_CLASS} group relative overflow-hidden rounded-[1.4rem] shadow-[var(--shadow-card)]`}
    >
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
        {poster ? (
          <img
            src={poster}
            alt={video.title || ''}
            className="h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-white/80">
            <FiPlay className="text-4xl" aria-hidden />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        {badgeLabel ? (
          <span className="absolute left-2.5 top-2.5 z-[2] inline-flex items-center rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-white shadow-md">
            {badgeLabel}
          </span>
        ) : null}
        <span className="absolute right-2.5 top-2.5 z-[2] grid size-9 place-items-center rounded-full bg-black/50 text-white shadow-md backdrop-blur-sm">
          <FiPlay className="ml-0.5 text-base" aria-hidden />
        </span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex flex-col justify-end px-3 pb-1.5 pt-10 sm:px-3.5 sm:pb-2">
          <div className="flex h-5 shrink-0 items-center gap-1">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black leading-none text-white backdrop-blur-sm sm:text-[10px]">
              {mt('marketplace.page.feed.badgeVideo')}
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-black leading-none text-white/80 backdrop-blur-sm sm:text-[10px]">
              {video.durationMs ? formatDuration(video.durationMs) : '0:00'}
            </span>
          </div>
          <h2 className="mt-1 min-h-5 truncate text-sm font-black leading-5 text-white drop-shadow sm:text-base">
            {video.title || video.caption || ''}
          </h2>
          <div className="mt-1 flex h-4 shrink-0 items-center justify-between gap-2">
            <strong className="min-w-0 truncate text-[11px] font-black leading-none text-white drop-shadow">
              {video.businessName || '\u00a0'}
            </strong>
            <p className="flex shrink-0 items-center gap-1 text-[11px] leading-none text-white/75">
              <FiEye className="shrink-0 text-[12px]" aria-hidden />
              <span className="tabular-nums">{views}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function MarketplaceVideoRail({
  title,
  videos,
  badgeLabel,
  onViewAll,
  viewAllLabel,
  scrollPrevLabel,
  scrollNextLabel,
}) {
  const scrollRef = useHorizontalScroll()
  const [edges, setEdges] = useState({ left: false, right: false })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined

    function updateEdges() {
      const maxScroll = el.scrollWidth - el.clientWidth
      setEdges({
        left: el.scrollLeft > 8,
        right: maxScroll > 8 && el.scrollLeft < maxScroll - 8,
      })
    }

    updateEdges()
    el.addEventListener('scroll', updateEdges, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateEdges) : null
    observer?.observe(el)
    return () => {
      el.removeEventListener('scroll', updateEdges)
      observer?.disconnect()
    }
  }, [videos, scrollRef])

  if (!videos?.length) return null

  function scrollBy(direction) {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector('[data-rail-card]')
    const cardWidth = card?.offsetWidth || 280
    el.scrollBy({ left: direction * (cardWidth + 12), behavior: 'smooth' })
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-black tracking-tight">{title}</h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 text-xs font-bold text-brand-700 hover:underline dark:text-brand-400"
          >
            {viewAllLabel}
          </button>
        ) : null}
      </div>
      <div className="relative min-w-0">
        {edges.left ? (
          <button
            type="button"
            aria-label={scrollPrevLabel}
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-1/2 z-[2] grid size-8 -translate-y-1/2 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/95 text-[var(--app-text)] shadow-sm backdrop-blur-sm"
          >
            <FiChevronLeft aria-hidden />
          </button>
        ) : null}
        {edges.right ? (
          <button
            type="button"
            aria-label={scrollNextLabel}
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-1/2 z-[2] grid size-8 -translate-y-1/2 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/95 text-[var(--app-text)] shadow-sm backdrop-blur-sm"
          >
            <FiChevronRight aria-hidden />
          </button>
        ) : null}
        <div ref={scrollRef} className={MARKETPLACE_DISCOVERY_TRACK_CLASS} data-navbar-ignore>
          {videos.map((video) => (
            <VideoRailCard key={video.id} video={video} badgeLabel={badgeLabel} />
          ))}
        </div>
      </div>
    </section>
  )
}
