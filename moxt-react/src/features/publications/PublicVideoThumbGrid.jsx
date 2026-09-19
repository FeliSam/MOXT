import { FiEye, FiPlay } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { useLanguage } from '../../contexts/useLanguage'
import { marketplaceText } from '../marketplace/marketplaceI18n'
import { resolveMediaDisplayUrl } from '../../services/media/mediaUrlUtils'
import { videoFeedPath } from '../videos/videoUtils'

function formatDuration(ms) {
  const total = Math.max(0, Math.round(Number(ms || 0) / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function videoTagLabels(video, mt) {
  const labels = [mt('marketplace.page.feed.badgeVideo')]
  const tags = Array.isArray(video.tags)
    ? video.tags
    : Array.isArray(video.hashtags)
      ? video.hashtags
      : typeof video.category === 'string' && video.category
        ? [video.category]
        : []
  for (const tag of tags) {
    const text = String(tag || '').replace(/^#/, '').trim()
    if (text && !labels.includes(text)) labels.push(text)
    if (labels.length >= 3) break
  }
  if (labels.length === 1 && video.durationMs) {
    labels.push(formatDuration(video.durationMs))
  }
  return labels
}

function VideoThumb({ video, guestMode, onGuestInteract, eager }) {
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const thumb =
    resolveMediaDisplayUrl(video.thumbnailUrl || video.coverUrl || video.posterUrl) ||
    video.thumbnailUrl ||
    ''
  const title = video.title || video.caption || mt('marketplace.page.feed.badgeVideo')
  const path = videoFeedPath(video.id)
  const views = Number(video.viewCount ?? video.views) || 0
  const tags = videoTagLabels(video, mt)

  function handleClick(event) {
    if (!guestMode) return
    event.preventDefault()
    onGuestInteract?.()
  }

  return (
    <Link
      to={path}
      onClick={handleClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[var(--app-surface-muted)] shadow-sm ring-1 ring-[var(--app-border)] transition hover:shadow-md"
      aria-label={title}
    >
      <span className="relative block aspect-[4/3] overflow-hidden bg-[var(--app-surface)]">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-700 to-cyan-700 text-white">
            <FiPlay className="text-3xl opacity-90" aria-hidden />
          </span>
        )}
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
          aria-hidden
        />
        <span className="absolute right-2.5 top-2.5 z-[2] grid size-9 place-items-center rounded-full bg-black/50 text-white shadow-md backdrop-blur-sm">
          <FiPlay className="ml-0.5 text-base" aria-hidden />
        </span>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex flex-col justify-end gap-1 p-3 sm:p-3.5">
          <span className="flex flex-wrap gap-1">
            {tags.map((label) => (
              <span
                key={label}
                className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black leading-none text-white backdrop-blur-sm sm:text-[10px]"
              >
                {label}
              </span>
            ))}
          </span>
          <strong className="line-clamp-2 text-sm font-black leading-snug text-white drop-shadow sm:text-base">
            {title}
          </strong>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-white/80">
            <FiEye className="shrink-0 text-[12px]" aria-hidden />
            <span className="tabular-nums">{mt('marketplace.common.views', { count: views })}</span>
          </span>
        </span>
      </span>
    </Link>
  )
}

/**
 * Grille 2 colonnes : vignette 4/3 + eétiquettes, titre et vues (comme les cartes image).
 */
export function PublicVideoThumbGrid({
  videos = [],
  title = 'Vidu00e9os',
  emptyTitle = 'Aucune vidu00e9o',
  emptyDescription,
  guestMode = false,
  onGuestInteract,
  className = '',
}) {
  const list = (videos || []).filter(Boolean)

  return (
    <section className={`grid gap-4 ${className}`}>
      {title ? <h2 className="text-base font-black text-[var(--app-text)]">{title}</h2> : null}
      {list.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {list.map((video, index) => (
            <VideoThumb
              key={video.id || index}
              video={video}
              guestMode={guestMode}
              onGuestInteract={onGuestInteract}
              eager={index < 4}
            />
          ))}
        </div>
      )}
    </section>
  )
}