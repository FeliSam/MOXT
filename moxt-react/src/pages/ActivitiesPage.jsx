import { FiArrowLeft, FiCalendar, FiHeart, FiMessageSquare, FiPackage, FiSend } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
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
          label: `Reservation ${reservation.kg} kg`,
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
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Mes activites"
        description="Favoris, candidatures, inscriptions, reservations et conversations."
        actions={
          <Link
            to="/profile"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm hover:bg-[var(--app-surface-muted)]"
          >
            <FiArrowLeft /> Retour
          </Link>
        }
      />
      {activities.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {activities.map(({ icon: Icon, id: activityId, label, path, title }) => (
            <Link key={activityId} className="block h-full" to={path}>
              <Card className="flex h-full items-center gap-4 transition hover:border-brand-400">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  <Icon />
                </span>
                <div className="min-w-0">
                  <strong className="block truncate">{title}</strong>
                  <Badge>{label}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune activite" description="Vos interactions apparaitront ici." />
      )}
    </div>
  )
}
