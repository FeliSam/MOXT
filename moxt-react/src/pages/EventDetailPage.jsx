import { useState } from 'react'
import { ImageLightbox } from '../components/ui/ImageLightbox'
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiMapPin,
  FiUsers,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { EntityVerifiedName } from '../components/ui/EntityVerifiedName'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
  TrustPanel,
} from '../components/ui/DetailBlocks'
import { PageHeader } from '../components/ui/PageHeader'
import { ReportDialog } from '../components/ui/ReportDialog'
import { ReshareButton } from '../components/ui/ReshareButton'
import { DetailFloatingActions } from '../components/ui/DetailFloatingActions'
import { FavoriteButton } from '../features/account/FavoriteButton'
import { ContactButton } from '../features/communications/ContactButton'
import { cancelRegistration, registerForEvent, reportEvent } from '../features/events/eventSlice'
import { EventParticipantsSection } from '../features/events/EventParticipantsSection'
import {
  eventPublisherTypeKey,
  eventStatusLabelKey,
  eventTrustItemKeys,
  registrationNextStepKeys,
} from '../features/events/eventsConfig'
import { statusMeta } from '../config/statuses'
import { useLanguage } from '../contexts/useLanguage'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'
import { formatDateTime } from '../utils/formatters'
import { PublisherDetailCard } from '../features/publications/PublisherDetailCard'
import { PublisherPublicationsStrip } from '../features/publications/PublisherPublicationsStrip'
import { usePublisherDetailProfile } from '../features/publications/usePublisherDetailProfile'
import { addToast } from '../features/ui/uiSlice'

function resolveStatusLabel(status, t) {
  const key = eventStatusLabelKey(status)
  return key ? t(key) : statusMeta(status, t).label
}

export function EventDetailPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const { eventId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const event = useSelector((state) => state.events.items.find((item) => item.id === eventId))
  const registrations = useSelector((state) =>
    state.events.registrations.filter((item) => item.eventId === eventId),
  )
  const publisherProfile = usePublisherDetailProfile(event, 'event')
  const [reportOpen, setReportOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  if (!event) return <Card>{t('events.detail.notFound')}</Card>
  const registration = registrations.find((item) => item.userId === user.id)
  const registered = registration && registration.status !== 'cancelled'
  const activeRegistrations = registrations.filter((item) => item.status !== 'cancelled')
  const full = activeRegistrations.length >= event.capacity
  const eventStatus = statusMeta(event.status, t)
  const registrationStatus = registration ? statusMeta(registration.status, t) : null
  const nextStepKeys = registration ? registrationNextStepKeys[registration.status] : null

  const publishedLabel = event.createdAt
    ? t('events.detail.publishedOn', { date: formatDateTime(event.createdAt) })
    : null

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={event.category}
        title={event.title}
        description={[ `${formatDate(event.startAt)} · ${event.venue}, ${event.city}`, publishedLabel ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Favori — icône seule, coin droit, distinct de l'inscription.
                Sur mobile/tablette, Contacter + Favoris passent par le bouton "..." flottant. */}
            <FavoriteButton
              relatedId={event.id}
              relatedType="event"
              title={event.title}
              path={`/events/${event.id}`}
              entity={event}
              showLabel={false}
              className="hidden !size-11 shrink-0 xl:inline-flex"
            />
            <ReshareButton sourceType="event" sourceId={event.id} sourceData={event} />
            {event.ownerId === user.id ? (
              <Link to={`/events/${eventId}/edit`}>
                <Button variant="secondary" icon={FiEdit2}>
                  {t('events.detail.edit')}
                </Button>
              </Link>
            ) : null}
            <BackButton fallback="/events" />
          </div>
        }
      />
      <DetailMetrics
        items={[
          { icon: FiCalendar, label: t('events.detail.date'), value: formatDate(event.startAt) },
          { icon: FiMapPin, label: t('events.detail.location'), value: event.city },
          {
            icon: FiUsers,
            label: t('events.detail.seatsRemaining'),
            value: `${Math.max(event.capacity - activeRegistrations.length, 0)}`,
          },
          {
            icon: FiCheckCircle,
            label: t('events.detail.access'),
            value: event.price
              ? formatMoney(event.price, event.currency)
              : t('events.detail.free'),
          },
        ]}
      />
      {event.images?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {event.images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className={`overflow-hidden rounded-2xl border border-[var(--app-border)] ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
            >
              <img
                src={src}
                alt={t('events.detail.imageAlt', { title: event.title, index: index + 1 })}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
      <ImageLightbox
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        images={event.images || []}
        index={lightboxIndex ?? 0}
        onIndexChange={(updater) =>
          setLightboxIndex((current) => updater(current ?? 0))
        }
        alt={event.title}
      />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge tone={eventStatus.tone}>{resolveStatusLabel(event.status, t)}</Badge>
            <Badge tone={full ? 'warning' : 'success'}>
              {full ? t('events.detail.full') : t('events.detail.seatsAvailable')}
            </Badge>
          </div>
          <h2 className="font-black">{t('events.detail.about')}</h2>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{event.description}</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <span className="inline-flex min-w-0 flex-wrap items-center gap-1">
              {t('events.detail.organizerLabel')} :{' '}
              <EntityVerifiedName
                as="strong"
                name={event.organizerName}
                userId={event.ownerId}
                businessId={event.businessId}
              />
              <span>({t(eventPublisherTypeKey(event.businessId))})</span>
            </span>
            <span>
              {t('events.detail.priceLabel')} :{' '}
              <strong>
                {event.price ? formatMoney(event.price, event.currency) : t('events.detail.free')}
              </strong>
            </span>
            <span>
              {t('events.detail.seatsLabel')} :{' '}
              <strong>
                {activeRegistrations.length}/{event.capacity}
              </strong>
            </span>
          </div>
        </Card>
        <Card>
          <h2 className="font-black">{t('events.detail.registration')}</h2>
          <div className="mt-4 hidden xl:block">
            <ContactButton
              ownerId={event.ownerId}
              relatedEntity={event}
              relatedId={event.id}
              relatedPath={`/events/${event.id}`}
              relatedTitle={event.title}
              relatedType="event"
              variant="secondary"
            />
          </div>
          {event.ownerId !== user.id ? (
            <Button
              className="mt-3"
              variant="danger"
              icon={FiAlertTriangle}
              onClick={() => setReportOpen(true)}
            >
              {t('events.detail.report')}
            </Button>
          ) : null}
          {event.ownerId === user.id ? (
            <p className="mt-3 text-sm text-[var(--app-text-muted)]">
              {t('events.detail.ownerHint')}
            </p>
          ) : registered ? (
            <div className="mt-4">
              <Alert
                variant="success"
                title={
                  registrationStatus
                    ? resolveStatusLabel(registration.status, t)
                    : undefined
                }
              >
                {nextStepKeys
                  ? t(nextStepKeys.descriptionKey)
                  : t('events.detail.registrationTracked')}
              </Alert>
              {nextStepKeys ? (
                <Card className="mt-3 bg-[var(--app-surface-muted)] p-4 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-brand-700">
                    {t('events.detail.nextStep')}
                  </span>
                  <h3 className="mt-2 font-black">{t(nextStepKeys.titleKey)}</h3>
                </Card>
              ) : null}
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() =>
                  dispatch(cancelRegistration({ id: registration.id, userId: user.id }))
                }
              >
                {t('events.detail.cancelRegistration')}
              </Button>
            </div>
          ) : full ? (
            <div className="mt-4">
              <Alert variant="error">{t('events.detail.eventFull')}</Alert>
            </div>
          ) : (
            <Button
              className="mt-5"
              icon={FiCheckCircle}
              onClick={() =>
                dispatch(
                  registerForEvent({
                    eventId,
                    userId: user.id,
                    participantName: `${user.firstName} ${user.lastName}`,
                  }),
                )
              }
            >
              {t('events.detail.register')}
            </Button>
          )}
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title={t('events.detail.practicalInfo')}>
          <DetailFacts
            items={[
              {
                label: t('events.detail.facts.organizer'),
                value: (
                  <EntityVerifiedName
                    name={event.organizerName}
                    userId={event.ownerId}
                    businessId={event.businessId}
                  />
                ),
              },
              {
                label: t('events.detail.facts.profile'),
                value: t(eventPublisherTypeKey(event.businessId)),
              },
              { label: t('events.detail.facts.category'), value: event.category },
              { label: t('events.detail.facts.venue'), value: event.venue },
              { label: t('events.detail.facts.city'), value: event.city },
              {
                label: t('events.detail.facts.capacity'),
                value: t('events.detail.capacityValue', { count: event.capacity }),
              },
              { label: t('events.detail.facts.status'), value: event.status },
            ]}
          />
        </DetailSection>
        <div className="grid gap-5">
          {publisherProfile ? (
            <>
              <PublisherDetailCard {...publisherProfile} />
              <PublisherPublicationsStrip
                currentId={event.id}
                ownerId={publisherProfile.ownerId}
                publications={publisherProfile.publications}
                allPath={publisherProfile.publicationsPath}
              />
            </>
          ) : null}
          <TrustPanel
            title={t('events.detail.trustTitle')}
            items={eventTrustItemKeys.map((key) => t(key))}
          />
        </div>
      </div>
      {event.ownerId === user.id ? (
        <EventParticipantsSection event={event} eventId={eventId} />
      ) : null}
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t('events.detail.reportTitle')}
        userId={user.id}
        onSubmit={async ({ reason, evidenceUrl }) => {
          dispatch(
            reportEvent({
              eventId: event.id,
              reporterId: user.id,
              reason,
              evidenceUrl,
            }),
          )
          dispatch(
            addToast({
              title: t('events.detail.reportToastTitle'),
              message: t('events.detail.reportToastMessage'),
              tone: 'success',
            }),
          )
        }}
      />
      <DetailFloatingActions
        isOwner={event.ownerId === user.id}
        ownerId={event.ownerId}
        entity={event}
        relatedId={event.id}
        relatedPath={`/events/${event.id}`}
        relatedType="event"
        title={event.title}
      />
    </div>
  )
}
