import {
  FiBriefcase,
  FiCalendar,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiPackage,
  FiArchive,
  FiRepeat,
  FiRotateCcw,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { statusMeta } from '../../config/statuses'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { jobContractLabel } from '../jobs/jobDisplayUtils'
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
    <Card className={`overflow-hidden p-0 ${archived ? archivedPublicationCardClass : ''}`}>
      <div className="flex flex-col gap-0 lg:flex-row">
        <div
          className={`relative flex h-40 w-full shrink-0 items-center justify-center bg-gradient-to-br lg:h-auto lg:w-48 ${tone} ${
            archived ? 'opacity-75 saturate-[0.85]' : ''
          }`}
        >
          <Icon className="text-4xl text-white opacity-90" />
          <div className="absolute left-3 top-3">{badge}</div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5">
          <div className="min-w-0">
            <h3 className="text-lg font-black">{title}</h3>
            {subtitle ? (
              <p className="mt-1 text-sm font-semibold text-brand-700">{subtitle}</p>
            ) : null}
            {meta?.length ? (
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--app-text-muted)]">
                {meta.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
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
            {active ? (
              <Button variant="danger" icon={FiArchive} size="sm" onClick={onArchive}>
                {phase3Text(t, 'publications.cards.archive')}
              </Button>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                {t('parcels.my.reactivate')}
              </Button>
            )}
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
}) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)
  const status = statusMeta(job.status, t)
  const active = isActiveJob(job)
  return (
    <PublicationCardShell
      archived={!active}
      icon={FiBriefcase}
      tone="from-violet-600 to-purple-700"
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      title={job.title}
      subtitle={job.salary}
      meta={[
        ownerDisplayName || job.publisherName,
        job.location,
        job.contractType ? jobContractLabel(t, job.contractType) : null,
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
            {active ? (
              <Button variant="danger" size="sm" onClick={onArchive}>
                {p3('publications.cards.archive')}
              </Button>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                {p3('publications.cards.republish')}
              </Button>
            )}
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
}) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)
  const status = statusMeta(event.status, t)
  const active = isActiveEvent(event)
  return (
    <PublicationCardShell
      archived={!active}
      icon={FiCalendar}
      tone="from-amber-600 to-orange-700"
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      title={event.title}
      subtitle={
        event.price > 0 ? formatMoney(event.price, event.currency) : p3('publications.cards.free')
      }
      meta={[event.city, event.startAt || event.date].filter(Boolean)}
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
            {active ? (
              <Button variant="danger" size="sm" onClick={onArchive}>
                {p3('publications.cards.archive')}
              </Button>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                {p3('publications.cards.republish')}
              </Button>
            )}
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
}) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const active = isActivePost(post)
  return (
    <PublicationCardShell
      archived={!active}
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
            {active ? (
              <Button variant="danger" icon={FiArchive} size="sm" onClick={onArchive}>
                {p3('publications.cards.archive')}
              </Button>
            ) : offer.status === 'archived' ? (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                {p3('publications.cards.republish')}
              </Button>
            ) : null}
          </>
        )
      }
    />
  )
}
