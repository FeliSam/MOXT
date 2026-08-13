import {
  FiBriefcase,
  FiCalendar,
  FiCopy,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiPackage,
  FiArchive,
  FiRepeat,
  FiRotateCcw,
  FiTrash2,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { statusMeta } from '../../config/statuses'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { jobContractLabel } from '../jobs/jobDisplayUtils'
import { getPostImages } from '../posts/postMediaUtils'
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
    <Card className={`min-w-0 overflow-hidden p-0 ${archived ? archivedPublicationCardClass : ''}`}>
      <div className="flex min-w-0 flex-col gap-0 lg:flex-row">
        <div
          className={`relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br sm:h-40 lg:h-auto lg:w-48 ${tone} ${
            archived ? 'opacity-75 saturate-[0.85]' : ''
          }`}
        >
          {coverUrl ? (
            <>
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-black/25" aria-hidden="true" />
            </>
          ) : null}
          {!coverUrl ? <Icon className="relative z-[1] text-4xl text-white opacity-90" /> : null}
          <div className="absolute left-3 top-3 z-[2]">{badge}</div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:gap-4 sm:p-5">
          <div className="min-w-0">
            <h3 className="break-words text-base font-black sm:text-lg">{title}</h3>
            {subtitle ? (
              <p className="mt-1 break-words text-sm font-semibold text-brand-700">{subtitle}</p>
            ) : null}
            {meta?.length ? (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--app-text-muted)]">
                {meta.map((line) => (
                  <span key={line} className="min-w-0 break-words">
                    {line}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap [&_a]:min-w-0 [&_button]:w-full sm:[&_button]:w-auto">
            <Link to={path} onClick={handleGuestClick}>
              <Button variant="secondary" icon={FiExternalLink} size="sm">
                {phase3Text(t, 'publications.cards.open')}
              </Button>
            </Link>
            {actions}
          </div>
        </div>
      </div>
    </Card>
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
      badge={<Badge tone="info">{p3('publications.cards.badge')}</Badge>}
      title={post.message?.slice(0, 80) || p3('publications.cards.fallbackTitle')}
      subtitle={post.sourceType !== 'free' ? post.sourceType : null}
      meta={[
        p3('publications.cards.likes', { count: post.likes?.length || 0 }),
        p3('publications.cards.comments', { count: post.comments?.length || 0 }),
      ]}
      path="/news"
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
