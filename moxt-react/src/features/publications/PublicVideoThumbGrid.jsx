import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { resolveMediaDisplayUrl } from '../../services/media/mediaUrlUtils'
import { videoFeedPath } from '../videos/videoUtils'

function PlayOverlay() {
  return (
    <span
      className="pointer-events-none absolute inset-0 grid place-items-center"
      aria-hidden="true"
    >
      <span className="grid size-11 place-items-center rounded-full bg-white/92 shadow-md ring-1 ring-black/5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="ml-0.5">
          <path d="M8 5.5v13l11-6.5L8 5.5z" fill="#08705f" />
        </svg>
      </span>
    </span>
  )
}

function VideoThumb({ video, guestMode, onGuestInteract, eager }) {
  const thumb =
    resolveMediaDisplayUrl(video.thumbnailUrl || video.coverUrl || video.posterUrl) ||
    video.thumbnailUrl ||
    ''
  const title = video.title || video.caption || 'Vidéo'
  const path = videoFeedPath(video.id)

  function handleClick(event) {
    if (!guestMode) return
    event.preventDefault()
    onGuestInteract?.()
  }

  return (
    <Link
      to={path}
      onClick={handleClick}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--app-surface-muted)] shadow-sm ring-1 ring-[var(--app-border)]"
      aria-label={title}
    >
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
        <div className="h-full w-full bg-gradient-to-br from-brand-700 to-cyan-700" />
      )}
      <PlayOverlay />
    </Link>
  )
}

/**
 * Grille 2 colonnes de vignettes (m�me ratio que les cartes image) + play (cercle blanc / triangle teal).
 */
export function PublicVideoThumbGrid({
  videos = [],
  title = 'Vidéos',
  emptyTitle = 'Aucune vidéo',
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
