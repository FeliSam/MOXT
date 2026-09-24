import { useRef, useState } from 'react'
import { FiPlay } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { resolveMediaDisplayUrl } from '../../services/media/mediaUrlUtils'

/**
 * Média vidéo dans une carte Actualités — même cadre arrondi que les images,
 * lecture inline ou lien vers le Fil vertical.
 */
export function FeedPostVideoMedia({ videoUrl, posterUrl, href, alt = '' }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const src = resolveMediaDisplayUrl(videoUrl) || String(videoUrl || '').trim()
  const poster = resolveMediaDisplayUrl(posterUrl) || String(posterUrl || '').trim() || undefined

  if (!src && !poster) return null

  async function startPlayback() {
    const el = videoRef.current
    if (!el || !src) return
    try {
      el.muted = false
      await el.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  return (
    <div className="relative min-w-0 max-w-full px-4 sm:px-5">
      <div className="relative aspect-[50/57] w-full min-w-0 overflow-hidden rounded-2xl bg-black sm:aspect-[25/27]">
        {src ? (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            className="h-full w-full object-cover"
            playsInline
            preload="metadata"
            controls={playing}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <img
            src={poster}
            alt={alt || p3('news.feed.playVideo')}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}

        {!playing ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            {src ? (
              <button
                type="button"
                onClick={startPlayback}
                className="pointer-events-auto grid size-14 place-items-center rounded-full bg-black/60 text-white shadow-lg transition hover:bg-black/75"
                aria-label={p3('news.feed.playVideo')}
              >
                <FiPlay className="ml-0.5 size-7 fill-current" aria-hidden />
              </button>
            ) : href ? (
              <Link
                to={href}
                className="pointer-events-auto grid size-14 place-items-center rounded-full bg-black/60 text-white shadow-lg transition hover:bg-black/75"
                aria-label={p3('news.feed.playVideo')}
              >
                <FiPlay className="ml-0.5 size-7 fill-current" aria-hidden />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
