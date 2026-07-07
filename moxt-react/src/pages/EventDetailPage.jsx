import {
  FiAlertTriangle,
  FiArrowLeft,
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
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
  TrustPanel,
} from '../components/ui/DetailBlocks'
import { PageHeader } from '../components/ui/PageHeader'
import { ReshareButton } from '../components/ui/ReshareButton'
import { FavoriteButton } from '../features/account/FavoriteButton'
import { ContactButton } from '../features/communications/ContactButton'
import { cancelRegistration, registerForEvent, reportEvent } from '../features/events/eventSlice'
import { statusMeta } from '../config/statuses'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'

const registrationNextSteps = {
  registered: {
    title: 'Inscription confirmée',
    description:
      'Conservez votre confirmation et contactez l’organisateur si vous avez une question.',
  },
  checked_in: {
    title: 'Présence confirmée',
    description: 'Votre présence a été validée par l’organisateur.',
  },
  cancelled: {
    title: 'Inscription annulée',
    description: 'Vous pouvez vous réinscrire si des places sont encore disponibles.',
  },
}

export function EventDetailPage() {
  const dispatch = useDispatch()
  const { eventId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const event = useSelector((state) => state.events.items.find((item) => item.id === eventId))
  const registrations = useSelector((state) =>
    state.events.registrations.filter((item) => item.eventId === eventId),
  )
  if (!event) return <Card>Événement introuvable.</Card>
  const registration = registrations.find((item) => item.userId === user.id)
  const registered = registration && registration.status !== 'cancelled'
  const activeRegistrations = registrations.filter((item) => item.status !== 'cancelled')
  const full = activeRegistrations.length >= event.capacity
  const eventStatus = statusMeta(event.status)
  const registrationStatus = registration ? statusMeta(registration.status) : null
  const nextStep = registration ? registrationNextSteps[registration.status] : null

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={event.category}
        title={event.title}
        description={`${formatDate(event.startAt)} · ${event.venue}, ${event.city}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ReshareButton sourceType="event" sourceId={event.id} sourceData={event} />
            {event.ownerId === user.id ? (
              <Link to={`/events/${eventId}/edit`}>
                <Button variant="secondary" icon={FiEdit2}>Modifier</Button>
              </Link>
            ) : null}
            <Link to="/events">
              <Button variant="secondary" icon={FiArrowLeft}>Retour</Button>
            </Link>
          </div>
        }
      />
      <DetailMetrics
        items={[
          { icon: FiCalendar, label: 'Date', value: formatDate(event.startAt) },
          { icon: FiMapPin, label: 'Lieu', value: event.city },
          {
            icon: FiUsers,
            label: 'Places restantes',
            value: `${Math.max(event.capacity - activeRegistrations.length, 0)}`,
          },
          {
            icon: FiCheckCircle,
            label: 'Accès',
            value: event.price ? formatMoney(event.price, event.currency) : 'Gratuit',
          },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge tone={eventStatus.tone}>{eventStatus.label}</Badge>
            <Badge tone={full ? 'warning' : 'success'}>
              {full ? 'Complet' : 'Places disponibles'}
            </Badge>
          </div>
          <h2 className="font-black">À propos</h2>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{event.description}</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <span>
              Organisateur :{' '}
              <strong>
                {event.organizerName} ({event.businessId ? 'Entreprise' : 'Particulier'})
              </strong>
            </span>
            <span>
              Prix :{' '}
              <strong>{event.price ? formatMoney(event.price, event.currency) : 'Gratuit'}</strong>
            </span>
            <span>
              Places :{' '}
              <strong>
                {activeRegistrations.length}/{event.capacity}
              </strong>
            </span>
          </div>
        </Card>
        <Card>
          <h2 className="font-black">Inscription</h2>
          <div className="mt-4">
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
          <div className="mt-3">
            <FavoriteButton
              relatedId={event.id}
              relatedType="event"
              title={event.title}
              path={`/events/${event.id}`}
              entity={event}
            />
          </div>
          {event.ownerId !== user.id ? (
            <Button
              className="mt-3"
              variant="danger"
              icon={FiAlertTriangle}
              onClick={() =>
                dispatch(
                  reportEvent({
                    eventId: event.id,
                    reporterId: user.id,
                    reason: 'Événement à vérifier',
                  }),
                )
              }
            >
              Signaler
            </Button>
          ) : null}
          {event.ownerId === user.id ? (
            <p className="mt-3 text-sm text-slate-500">
              {activeRegistrations.length} participant(s) inscrit(s).
            </p>
          ) : registered ? (
            <div className="mt-4">
              <Alert variant="success" title={registrationStatus.label}>
                {nextStep?.description ||
                  'Votre inscription est suivie et vous serez notifié à chaque changement.'}
              </Alert>
              {nextStep ? (
                <Card className="mt-3 bg-[var(--app-surface-muted)] p-4 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-brand-700">
                    Prochaine étape
                  </span>
                  <h3 className="mt-2 font-black">{nextStep.title}</h3>
                </Card>
              ) : null}
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() =>
                  dispatch(cancelRegistration({ id: registration.id, userId: user.id }))
                }
              >
                Annuler mon inscription
              </Button>
            </div>
          ) : full ? (
            <div className="mt-4">
              <Alert variant="error">Cet événement est complet.</Alert>
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
              S'inscrire
            </Button>
          )}
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title="Informations pratiques">
          <DetailFacts
            items={[
              { label: 'Organisateur', value: event.organizerName },
              { label: 'Profil', value: event.businessId ? 'Entreprise' : 'Particulier' },
              { label: 'Catégorie', value: event.category },
              { label: 'Lieu', value: event.venue },
              { label: 'Ville', value: event.city },
              { label: 'Capacité', value: `${event.capacity} personnes` },
              { label: 'Statut', value: event.status },
            ]}
          />
        </DetailSection>
        <TrustPanel
          title="Avant de participer"
          items={[
            'Vérifiez le lieu et l’horaire avant le déplacement.',
            'Conservez votre confirmation d’inscription.',
            'Contactez l’organisateur depuis la messagerie MOXT.',
          ]}
        />
      </div>
    </div>
  )
}
