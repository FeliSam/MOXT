import { FiEdit2, FiStar } from 'react-icons/fi'
import { VerifiedDisplayName } from '../../components/ui/Badge'
import { avatarDisplayUrl } from '../account/avatarDisplayUrl'
import { resolveMediaDisplayUrl } from '../../services/media/mediaUrlUtils'

function formatRatingAverage(average) {
  const n = Number(average || 0)
  if (!Number.isFinite(n)) return '0,0'
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function StarRatingRow({ average = 0, count = 0, reviewsLabel }) {
  if (!count) return null
  const filled = Math.max(0, Math.min(5, Math.round(Number(average) || 0)))
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm font-semibold text-amber-600">
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <FiStar
            key={index}
            className={`size-3.5 ${index < filled ? 'fill-amber-400 text-amber-400' : 'text-amber-200'}`}
          />
        ))}
      </span>
      <span>
        {formatRatingAverage(average)} · {count} {reviewsLabel}
      </span>
    </div>
  )
}

/**
 * Hero public (business / user) — cover plein largeur, avatar chevauchant,
 * nom + vérif, catégorie · ville, notes, Suivre + Contacter.
 */
export function PublicProfileHero({
  name,
  verified = false,
  category,
  city,
  coverUrl,
  avatarUrl,
  avatarFallback,
  rating,
  reviewsLabel = 'avis',
  coverAlt = '',
  avatarAlt = '',
  actions = null,
  shareSlot = null,
  onAvatarEdit = null,
  avatarEditLabel = '',
  className = '',
}) {
  const resolvedCover = resolveMediaDisplayUrl(coverUrl) || coverUrl || ''
  const resolvedAvatarRaw = resolveMediaDisplayUrl(avatarUrl) || avatarUrl || ''
  const resolvedAvatar = resolvedAvatarRaw
    ? avatarDisplayUrl(resolvedAvatarRaw, { width: 160 })
    : ''
  const initials = (avatarFallback || name || '?').slice(0, 2).toUpperCase()
  const metaLine = [category, city].filter(Boolean).join(' · ')

  return (
    <section className={`min-w-0 ${className}`}>
      <div className="relative -mx-4 sm:-mx-6 lg:mx-0">
        {resolvedCover ? (
          <img
            src={resolvedCover}
            alt={coverAlt || name || ''}
            className="h-44 w-full object-cover sm:h-52 lg:rounded-[1.5rem]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
              const fallback = event.currentTarget.nextElementSibling
              if (fallback) fallback.classList.remove('hidden')
            }}
          />
        ) : null}
        <div
          className={`h-44 w-full bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-700 sm:h-52 lg:rounded-[1.5rem] ${
            resolvedCover ? 'hidden' : ''
          }`}
          aria-hidden={resolvedCover ? 'true' : undefined}
        />

        <div className="absolute -bottom-10 left-4 z-10 sm:left-6 lg:left-5">
          {resolvedAvatar ? (
            <img
              src={resolvedAvatar}
              alt={avatarAlt || name || ''}
              className="size-[4.5rem] rounded-[1.15rem] border-[3px] border-[var(--app-surface)] object-cover shadow-md sm:size-20"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
                const fallback = event.currentTarget.nextElementSibling
                if (fallback) fallback.classList.remove('hidden')
              }}
            />
          ) : null}
          <span
            className={`grid size-[4.5rem] place-items-center rounded-[1.15rem] border-[3px] border-[var(--app-surface)] bg-[var(--app-accent-soft)] text-xl font-black text-[var(--app-accent)] shadow-md sm:size-20 sm:text-2xl ${
              resolvedAvatar ? 'hidden' : ''
            }`}
          >
            {initials}
          </span>
          {onAvatarEdit ? (
            <button
              type="button"
              onClick={onAvatarEdit}
              aria-label={avatarEditLabel || undefined}
              title={avatarEditLabel || undefined}
              className="absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full border-2 border-[var(--app-surface)] bg-brand-700 text-white shadow-md transition hover:scale-105 hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] dark:bg-[var(--app-teal)] dark:text-slate-950"
            >
              <FiEdit2 className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {shareSlot ? <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">{shareSlot}</div> : null}
      </div>

      <div className="grid gap-3 pt-12 sm:pt-14">
        <div className="min-w-0">
          <VerifiedDisplayName
            as="h1"
            name={name}
            verified={verified}
            iconSize="md"
            className="text-xl font-black tracking-tight text-[var(--app-text)] sm:text-2xl"
            nameClassName="truncate"
            iconClassName="text-emerald-500"
          />
          {metaLine ? (
            <p className="mt-1 truncate text-sm text-[var(--app-text-muted)]">{metaLine}</p>
          ) : null}
          <StarRatingRow
            average={rating?.average}
            count={rating?.count}
            reviewsLabel={reviewsLabel}
          />
        </div>

        {actions ? <div className="grid grid-cols-2 gap-2.5 pt-1">{actions}</div> : null}
      </div>
    </section>
  )
}
