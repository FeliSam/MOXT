import { FiBriefcase, FiEdit2, FiImage, FiStar, FiUser } from 'react-icons/fi'
import { VerifiedDisplayName } from '../../components/ui/Badge'
import { avatarDisplayUrl } from '../account/avatarDisplayUrl'
import { AvatarBadge } from '../account/avatarDicebear/AvatarBadge'
import { resolveMediaDisplayUrl } from '../../services/media/mediaUrlUtils'
import { MoxtCoverBanner } from './coverBanners/MoxtCoverBanner'
import { profileInitials } from './profileInitials'
import { resolveCoverStyleId } from './coverBanners/coverBannerCatalog'

function formatRatingAverage(average) {
  const n = Number(average || 0)
  if (!Number.isFinite(n)) return '0,0'
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function StarRatingRow({ average = 0, count = 0, reviewsLabel, onOpenReviews }) {
  if (!count) return null
  const filled = Math.max(0, Math.min(5, Math.round(Number(average) || 0)))
  const content = (
    <>
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
    </>
  )
  const rowClass =
    'mt-2 flex flex-wrap items-center gap-1.5 text-sm font-semibold text-amber-600'
  if (typeof onOpenReviews === 'function') {
    return (
      <button
        type="button"
        onClick={onOpenReviews}
        className={`${rowClass} cursor-pointer rounded-md text-left transition hover:text-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500`}
        aria-label={`Voir les avis (${count})`}
      >
        {content}
      </button>
    )
  }
  return <div className={rowClass}>{content}</div>
}

function EmptyCoverFallback({ coverStyle, variant, category, gender, className }) {
  const styleId = resolveCoverStyleId({
    coverStyle,
    emptyCoverVariant: variant,
    category,
    gender,
  })
  return (
    <MoxtCoverBanner
      styleId={styleId}
      emptyCoverVariant={variant}
      category={category}
      gender={gender}
      className={className}
    />
  )
}

/**
 * Hero public (business / user) — cover plein largeur, avatar chevauchant,
 * nom + vérif, catégorie · ville, notes, Suivre + Contacter.
 *
 * coverStyle — stable Moxt style id (business-*, woman-*, man-*).
 * emptyCoverVariant — legacy: 'editorial-dark' | 'gradient' (mapped via catalog).
 * coverCategory — 'business' | 'personal' | 'woman' | 'man' (default resolution).
 * gender — optional profile gender for personal defaults (no DB field yet).
 * showCoverEdit / onEditCover — owner floating « Modifier la bannière » on empty Moxt cover.
 * profileKind — 'personal' (avatar rond + anneau, accent prune via [data-profile-kind]) | 'business'.
 * kindLabel — chip « Particulier » / « Entreprise » sous la ville / les étoiles.
 */
export function PublicProfileHero({
  name,
  verified = false,
  category,
  city,
  coverUrl,
  avatarUrl,
  avatarFallback,
  profileKind,
  kindLabel = '',
  rating,
  reviewsLabel = 'avis',
  coverAlt = '',
  avatarAlt = '',
  actions = null,
  shareSlot = null,
  onAvatarEdit = null,
  avatarEditLabel = '',
  /** URL brute de l’avatar perso (badge « Avatar » si portrait / illustré Moxt). */
  avatarBadgeUrl = '',
  avatarLoreleiUrl = '',
  coverStyle,
  emptyCoverVariant = 'gradient',
  coverCategory = 'personal',
  gender,
  showCoverEdit = false,
  onEditCover = null,
  editCoverLabel = 'Modifier la bannière',
  onOpenReviews = null,
  className = '',
}) {
  const resolvedCover = resolveMediaDisplayUrl(coverUrl) || coverUrl || ''
  const resolvedAvatarRaw = resolveMediaDisplayUrl(avatarUrl) || avatarUrl || ''
  const resolvedAvatar = resolvedAvatarRaw
    ? avatarDisplayUrl(resolvedAvatarRaw, { width: 160 })
    : ''
  const initials = profileInitials(name, avatarFallback)
  const metaLine = [category, city].filter(Boolean).join(' · ')
  const coverShellClass = 'h-44 w-full overflow-hidden rounded-2xl sm:h-52 sm:rounded-[1.25rem] lg:rounded-[1.5rem]'
  const canEditCover = Boolean(showCoverEdit && onEditCover)

  return (
    <section className={`min-w-0 ${className}`}>
      <div className="relative overflow-visible">
        {resolvedCover ? (
          <img
            src={resolvedCover}
            alt={coverAlt || name || ''}
            className={`${coverShellClass} object-cover`}
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
        <EmptyCoverFallback
          coverStyle={coverStyle}
          variant={emptyCoverVariant}
          category={coverCategory}
          gender={gender}
          className={`${coverShellClass} ${resolvedCover ? 'hidden' : ''}`}
        />

        <div className="absolute -bottom-10 left-4 z-10 sm:left-6 lg:left-5">
          {resolvedAvatar ? (
            <img
              src={resolvedAvatar}
              alt={avatarAlt || name || ''}
              className={`size-[4.5rem] border-[3px] border-[var(--app-surface)] object-cover shadow-md sm:size-20 ${
                profileKind === 'personal' ? 'rounded-full ring-2 ring-brand-400' : 'rounded-[1.15rem]'
              }`}
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
            className={`grid size-[4.5rem] place-items-center border-[3px] border-[var(--app-surface)] bg-[var(--app-accent-soft)] text-xl font-black text-[var(--app-accent)] shadow-md sm:size-20 sm:text-2xl ${
              profileKind === 'personal' ? 'rounded-full ring-2 ring-brand-400' : 'rounded-[1.15rem]'
            } ${resolvedAvatar ? 'hidden' : ''}`}
          >
            {initials}
          </span>
          {resolvedAvatar ? (
            <AvatarBadge url={avatarBadgeUrl} loreleiUrl={avatarLoreleiUrl} className="-top-2" />
          ) : null}
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

        {canEditCover ? (
          <button
            type="button"
            onClick={onEditCover}
            className="absolute bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-black/70"
          >
            <FiImage className="size-3.5 shrink-0" aria-hidden />
            {editCoverLabel}
          </button>
        ) : null}
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
            onOpenReviews={onOpenReviews}
          />
          {kindLabel ? (
            <p className="mt-2 flex">
              <span
                className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 dark:border-brand-800 dark:bg-[var(--app-accent-soft)] dark:text-brand-300"
                data-profile-kind-chip={profileKind || undefined}
              >
                {profileKind === 'business' ? (
                  <FiBriefcase className="size-3" aria-hidden="true" />
                ) : (
                  <FiUser className="size-3" aria-hidden="true" />
                )}
                {kindLabel}
              </span>
            </p>
          ) : null}
        </div>

        {actions ? <div className="grid grid-cols-2 gap-2.5 pt-1">{actions}</div> : null}
      </div>
    </section>
  )
}
