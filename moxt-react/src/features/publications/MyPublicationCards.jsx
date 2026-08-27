import {
  FiArchive,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiCopy,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiPackage,
  FiRepeat,
  FiRotateCcw,
  FiTrash2,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { statusMeta } from '../../config/statuses'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { jobContractLabel } from '../jobs/jobDisplayUtils'
import { MarketplaceListingCard } from '../marketplace/MarketplaceListingCard'
import { isActiveListing } from '../marketplace/listingCatalogUtils'
import { marketplaceText } from '../marketplace/marketplaceI18n'
import { getPostImages } from '../posts/postMediaUtils'
import { newsPostPath } from '../posts/postFeedUtils'
import { formatMoney } from '../transfers/transferUtils'
import {
  archivedPublicationCardClass,
  isActiveEvent,
  isActiveJob,
  isActiveP2POffer,
  isActiveParcel,
  isActivePost,
} from './publicationCatalogUtils'

function PublicationCardShell({
  archived = false,
  coverUrl = '',
  icon: Icon,
  tone,
  badge,
  title,
  subtitle,
  meta,
  path,
  actions,
  guestMode = false,
  onGuestInteract,
}) {
  const { t } = useLanguage()

  function handleGuestClick(event) {
    if (!guestMode) return
    event.preventDefault()
    onGuestInteract?.()
  }

  return (
    <article
      className={`group relative h-full overflow-hidden rounded-[1.4rem] shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] ${
        archived ? archivedPublicationCardClass : ''
      }`}
    >
      <Link
        to={path}
        onClick={handleGuestClick}
        className={`relative block h-[290px] w-full overflow-hidden bg-gradient-to-br xl:h-[333px] ${tone} ${
          archived ? 'opacity-75 saturate-[0.85]' : ''
        }`}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-white">
            <Icon className="text-4xl opacity-90" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        {badge ? <div className="absolute left-2.5 top-2.5 z-[2]">{badge}</div> : null}
        <div className="absolute inset-x-0 bottom-0 z-[2] p-3 sm:p-4">
          <h3 className="line-clamp-2 break-words text-sm font-black leading-snug text-white drop-shadow sm:text-base">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 line-clamp-1 text-sm font-bold text-white/90">{subtitle}</p>
          ) : null}
          {meta?.length ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] font-semibold text-white/75">
              {meta.join(' · ')}
            </p>
          ) : null}
        </div>
      </Link>
      {actions ? (
        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,7.75rem),1fr))] gap-1.5 bg-[var(--app-surface)] p-2.5 [&>a]:min-w-0 [&>button]:min-w-0 [&_button]:min-w-0 [&_button]:w-full [&_button]:max-w-full [&_button]:flex-wrap [&_button]:whitespace-normal">
          <Link to={path} onClick={handleGuestClick}>
            <Button variant="secondary" icon={FiExternalLink} size="sm" className="w-full">
              {phase3Text(t, 'publications.cards.open')}
            </Button>
          </Link>
          {actions}
        </div>
      ) : null}
    </article>
  )
}

export function MyListingPublicationCard({
  listing,
  readOnly = false,
  guestMode = false,
  onGuestInteract,
  onArchive,
  onReactivate,
  onDuplicate,
  onMarkSold,
  onDelete,
}) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)
  const mt = (key) => marketplaceText(t, key)
  const status = statusMeta(listing.status, t)
  const active = isActiveListing(listing)

  return (
    <MarketplaceListingCard
      listing={listing}
      guestMode={guestMode}
      onGuestInteract={onGuestInteract}
      showFavorite={readOnly}
      archived={!active}
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      actions={
        readOnly ? null : (
          <>
            <Link to={`/marketplace/${listing.id}/edit`}>
              <Button variant="secondary" icon={FiEdit2} size="sm">
                {p3('publications.cards.edit')}
              </Button>
            </Link>
            <Button variant="secondary" icon={FiCopy} size="sm" onClick={onDuplicate}>
              {p3('publications.cards.duplicate')}
            </Button>
            {active ? (
              <>
                <Button variant="secondary" icon={FiCheckCircle} size="sm" onClick={onMarkSold}>
                  {mt('marketplace.common.markSold')}
                </Button>
                <Button variant="danger" icon={FiArchive} size="sm" onClick={onArchive}>
                  {p3('publications.cards.archive')}
                </Button>
              </>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                {p3('publications.cards.republish')}
              </Button>
            )}
            <Button variant="danger" icon={FiTrash2} size="sm" onClick={onDelete}>
              {p3('publications.cards.delete')}
            </Button>
          </>
        )
      }
    />
  )
}

export function MyParcelPublicationCard({
  parcel,
  readOnly = false,
  guestMode = false,
  onGuestInteract,
  onArchive,
  onReactivate,
  onDuplicate,
  onDelete,
}) {
  const { t } = useLanguage()
  const status = statusMeta(parcel.status, t)
  const active = isActiveParcel(parcel)
  return (
    <PublicationCardShell
      archived={!active}
      icon={FiPackage}
      tone="from-sky-600 to-blue-700"
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      title={`${parcel.origin} → ${parcel.destination}`}
      subtitle={
        parcel.pricePerKg != null
          ? t('parcels.my.perKg', {
              price: formatMoney(parcel.pricePerKg, parcel.currency),
            })
          : null
      }
      meta={[
        parcel.departureDate ? t('parcels.my.departure', { date: parcel.departureDate }) : null,
        parcel.remainingKg != null ? t('parcels.my.remainingKg', { kg: parcel.remainingKg }) : null,
        readOnly ? null : t('marketplace.common.views', { count: parcel.views || 0 }),
      ].filter(Boolean)}
      path={`/parcels/${parcel.id}`}
      guestMode={guestMode}
      onGuestInteract={onGuestInteract}
      actions={
        readOnly ? null : (
          <>
            <Link to={`/parcels/${parcel.id}/edit`}>
              <Button variant="secondary" icon={FiEdit2} size="sm">
                {t('parcels.my.edit')}
              </Button>
            </Link>
            <Button variant="secondary" icon={FiCopy} size="sm" onClick={onDuplicate}>
              {phase3Text(t, 'publications.cards.duplicate')}
            </Button>
            {active ? (
              <Button variant="danger" icon={FiArchive} size="sm" onClick={onArchive}>
                {phase3Text(t, 'publications.cards.archive')}
              </Button>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                {t('parcels.my.reactivate')}
              </Button>
            )}
            <Button variant="danger" icon={FiTrash2} size="sm" onClick={onDelete}>
              {phase3Text(t, 'publications.cards.delete')}
            </Button>
          </>
        )
      }
    />
  )
}

export function MyJobPublicationCard({
  job,
  readOnly = false,
  guestMode = false,
  onGuestInteract,
  ownerDisplayName,
  onArchive,
  onReactivate,
  onDuplicate,
  onDelete,
}) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)
  const status = statusMeta(job.status, t)
  const active = isActiveJob(job)
  return (
    <PublicationCardShell
      archived={!active}
      coverUrl={job.images?.[0] || ''}
      icon={FiBriefcase}
      tone="from-violet-600 to-purple-700"
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      title={job.title}
      subtitle={job.salary}
      meta={[
        ownerDisplayName || job.publisherName,
        job.location,
        job.contractType ? jobContractLabel(t, job.contractType) : null,
        readOnly ? null : t('marketplace.common.views', { count: job.views || 0 }),
      ].filter(Boolean)}
      path={`/jobs/${job.id}`}
      guestMode={guestMode}
      onGuestInteract={onGuestInteract}
      actions={
        readOnly ? null : (
          <>
            <Link to={`/jobs/${job.id}/edit`}>
              <Button variant="secondary" icon={FiEdit2} size="sm">
                {p3('publications.cards.edit')}
              </Button>
            </Link>
            <Button variant="secondary" icon={FiCopy} size="sm" onClick={onDuplicate}>
              {p3('publications.cards.duplicate')}
            </Button>
            {active ? (
              <Button variant="danger" size="sm" onClick={onArchive}>
                {p3('publications.cards.archive')}
              </Button>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                {p3('publications.cards.republish')}
              </Button>
            )}
            <Button variant="danger" icon={FiTrash2} size="sm" onClick={onDelete}>
              {p3('publications.cards.delete')}
            </Button>
          </>
        )
      }
    />
  )
}

export function MyEventPublicationCard({
  event,
  readOnly = false,
  guestMode = false,
  onGuestInteract,
  onArchive,
  onReactivate,
  onDuplicate,
  onDelete,
}) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)
  const status = statusMeta(event.status, t)
  const active = isActiveEvent(event)
  return (
    <PublicationCardShell
      archived={!active}
      coverUrl={event.images?.[0] || ''}
      icon={FiCalendar}
      tone="from-amber-600 to-orange-700"
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      title={event.title}
      subtitle={
        event.price > 0 ? formatMoney(event.price, event.currency) : p3('publications.cards.free')
      }
      meta={[
        event.city,
        event.startAt || event.date,
        readOnly ? null : t('marketplace.common.views', { count: event.views || 0 }),
      ].filter(Boolean)}
      path={`/events/${event.id}`}
      guestMode={guestMode}
      onGuestInteract={onGuestInteract}
      actions={
        readOnly ? null : (
          <>
            <Link to={`/events/${event.id}/edit`}>
              <Button variant="secondary" icon={FiEdit2} size="sm">
                {p3('publications.cards.edit')}
              </Button>
            </Link>
            <Button variant="secondary" icon={FiCopy} size="sm" onClick={onDuplicate}>
              {p3('publications.cards.duplicate')}
            </Button>
            {active ? (
              <Button variant="danger" size="sm" onClick={onArchive}>
                {p3('publications.cards.archive')}
              </Button>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                {p3('publications.cards.republish')}
              </Button>
            )}
            <Button variant="danger" icon={FiTrash2} size="sm" onClick={onDelete}>
              {p3('publications.cards.delete')}
            </Button>
          </>
        )
      }
    />
  )
}

export function MyPostPublicationCard({
  post,
  readOnly = false,
  guestMode = false,
  onGuestInteract,
  onArchive,
  onReactivate,
  onDelete,
}) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const active = isActivePost(post)
  return (
    <PublicationCardShell
      archived={!active}
      coverUrl={getPostImages(post)[0] || ''}
      icon={FiFileText}
      tone="from-slate-600 to-slate-800"
      badge={
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-white backdrop-blur-sm">
          {p3('publications.cards.badge')}
        </span>
      }
      title={post.message?.slice(0, 80) || p3('publications.cards.fallbackTitle')}
      subtitle={post.sourceType !== 'free' ? post.sourceType : null}
      meta={[
        p3('publications.cards.likes', { count: post.likes?.length || 0 }),
        p3('publications.cards.comments', { count: post.comments?.length || 0 }),
      ]}
      path={newsPostPath(post.id)}
      guestMode={guestMode}
      onGuestInteract={onGuestInteract}
      actions={
        readOnly ? null : (
          <>
            <Link to={`/news/${post.id}/edit`}>
              <Button variant="secondary" icon={FiEdit2} size="sm">
                {p3('publications.cards.edit')}
              </Button>
            </Link>
            {active ? (
              <Button variant="danger" icon={FiArchive} size="sm" onClick={onArchive}>
                {p3('publications.cards.archive')}
              </Button>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                {p3('publications.cards.republish')}
              </Button>
            )}
            <Button variant="danger" icon={FiTrash2} size="sm" onClick={onDelete}>
              {p3('publications.cards.delete')}
            </Button>
          </>
        )
      }
    />
  )
}

export function MyP2POfferPublicationCard({
  offer,
  readOnly = false,
  guestMode = false,
  onGuestInteract,
  onArchive,
  onReactivate,
  onDelete,
}) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)
  const active = isActiveP2POffer(offer)
  const status = statusMeta(offer.status, t)

  return (
    <PublicationCardShell
      archived={!active}
      icon={FiRepeat}
      tone="from-emerald-600 to-teal-700"
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      title={formatMoney(offer.amount, offer.fromCurrency)}
      subtitle={`${offer.fromCurrency} → ${offer.toCurrency}`}
      meta={[t('p2p.page.rateValue', { rate: offer.rate }), offer.method, offer.ownerName].filter(
        Boolean,
      )}
      path={`/p2p/${offer.id}`}
      guestMode={guestMode}
      onGuestInteract={onGuestInteract}
      actions={
        readOnly ? null : (
          <>
            <Link to={`/p2p/${offer.id}/edit`}>
              <Button variant="secondary" icon={FiEdit2} size="sm">
                {p3('publications.cards.edit')}
              </Button>
            </Link>
            {active ? (
              <Button variant="danger" icon={FiArchive} size="sm" onClick={onArchive}>
                {p3('publications.cards.archive')}
              </Button>
            ) : offer.status === 'archived' ? (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                {p3('publications.cards.republish')}
              </Button>
            ) : null}
            <Button variant="danger" icon={FiTrash2} size="sm" onClick={onDelete}>
              {p3('publications.cards.delete')}
            </Button>
          </>
        )
      }
    />
  )
}
