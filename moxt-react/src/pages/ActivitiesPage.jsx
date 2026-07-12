import { FiCalendar, FiHeart, FiMessageSquare, FiPackage, FiSend } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { BackButton } from '../components/ui/BackButton'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { applicationJobId, applicationUserId } from '../features/jobs/jobUtils'

export function ActivitiesPage() {
  const user = useSelector((state) => state.auth.user)
  const state = useSelector((current) => current)
  const activities = [
    ...state.account.favorites
      .filter((item) => item.userId === user.id)
      .map((item) => ({
        id: `account-favorite-${item.id}`,
        title: item.title,
        label: 'Favori',
        path: item.path,
        icon: FiHeart,
      })),
    ...state.marketplace.items
      .filter((item) => item.favorites.includes(user.id))
      .map((item) => ({
        id: `favorite-${item.id}`,
        title: item.title,
        label: 'Favori',
        path: `/marketplace/${item.id}`,
        icon: FiHeart,
      })),
    ...state.jobs.applications
      .filter((item) => applicationUserId(item) === user.id)
      .map((item) => ({
        id: `application-${item.id}`,
        title:
          state.jobs.items.find((job) => job.id === applicationJobId(item))?.title ||
          applicationJobId(item),
        label: 'Candidature',
        path: `/jobs/${applicationJobId(item)}`,
        icon: FiSend,
      })),
    ...state.events.registrations
      .filter((item) => item.userId === user.id)
      .map((item) => ({
        id: `registration-${item.id}`,
        title: state.events.items.find((event) => event.id === item.eventId)?.title || item.eventId,
        label: 'Inscription',
        path: `/events/${item.eventId}`,
        icon: FiCalendar,
      })),
    ...state.parcels.items.flatMap((parcel) =>
      (parcel.reservations || [])
        .filter((reservation) => reservation.userId === user.id)
        .map((reservation, index) => ({
          id: `parcel-${parcel.id}-${index}`,
          title: `${parcel.origin} vers ${parcel.destination}`,
          label: `Réservation ${reservation.kg} kg`,
          path: `/parcels/${parcel.id}`,
          icon: FiPackage,
        })),
    ),
    ...state.communications.conversations
      .filter((item) => item.participantIds.includes(user.id))
      .map((item) => ({
        id: `conversation-${item.id}`,
        title: item.title,
        label: 'Conversation',
        path: `/messages?relatedType=${item.relatedType}&relatedId=${item.relatedId}`,
        icon: FiMessageSquare,
      })),
  ]

  return (
    <div className="grid min-w-0 max-w-full gap-6 sm:gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Mes activités"
        description="Favoris, candidatures, inscriptions, réservations et conversations."
        actions={<BackButton appearance="link" />}
      />
      {activities.length ? (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4">
          {activities.map(({ icon: Icon, id: activityId, label, path, title }) => (
            <Link key={activityId} className="block h-full min-w-0 max-w-full" to={path}>
              <Card
                variant="interactive"
                className="flex h-full min-w-0 items-center gap-3 overflow-hidden !p-3 sm:gap-4 sm:!p-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 sm:size-11">
                  <Icon className="text-base sm:text-lg" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-bold sm:text-base">{title}</strong>
                  <Badge className="mt-1.5 max-w-full truncate">{label}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune activité" description="Vos interactions apparaîtront ici." />
      )}
    </div>
  )
}
