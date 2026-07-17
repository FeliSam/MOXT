import { FiCalendar, FiHeart, FiMessageSquare, FiPackage, FiSend } from 'react-icons/fi'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { BackButton } from '../components/ui/BackButton'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { applicationJobId, applicationUserId } from '../features/jobs/jobUtils'
import { phase3Text } from '../i18n/phase3I18n'
import { formatTime } from '../utils/formatters'

function activityTitle(at, title) {
  const time = formatTime(at)
  return time ? `${time} · ${title}` : title
}

export function ActivitiesPage() {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const state = useSelector((current) => current)
  const activities = useMemo(
    () => [
      ...state.account.favorites
        .filter((item) => item.userId === user.id)
        .map((item) => ({
          id: `account-favorite-${item.id}`,
          title: activityTitle(item.createdAt, item.title),
          label: phase3Text(t, 'activities.label.favorite'),
          path: item.path,
          icon: FiHeart,
        })),
      ...state.marketplace.items
        .filter((item) => item.favorites.includes(user.id))
        .map((item) => ({
          id: `favorite-${item.id}`,
          title: activityTitle(item.updatedAt || item.createdAt, item.title),
          label: phase3Text(t, 'activities.label.favorite'),
          path: `/marketplace/${item.id}`,
          icon: FiHeart,
        })),
      ...state.jobs.applications
        .filter((item) => applicationUserId(item) === user.id)
        .map((item) => ({
          id: `application-${item.id}`,
          title: activityTitle(
            item.createdAt,
            state.jobs.items.find((job) => job.id === applicationJobId(item))?.title ||
              applicationJobId(item),
          ),
          label: phase3Text(t, 'activities.label.application'),
          path: `/jobs/${applicationJobId(item)}`,
          icon: FiSend,
        })),
      ...state.events.registrations
        .filter((item) => item.userId === user.id)
        .map((item) => ({
          id: `registration-${item.id}`,
          title: activityTitle(
            item.createdAt,
            state.events.items.find((event) => event.id === item.eventId)?.title || item.eventId,
          ),
          label: phase3Text(t, 'activities.label.registration'),
          path: `/events/${item.eventId}`,
          icon: FiCalendar,
        })),
      ...state.parcels.items.flatMap((parcel) =>
        (parcel.reservations || [])
          .filter((reservation) => reservation.userId === user.id)
          .map((reservation, index) => ({
            id: `parcel-${parcel.id}-${index}`,
            title: activityTitle(
              reservation.createdAt,
              phase3Text(t, 'activities.parcelTitle', {
                origin: parcel.origin,
                destination: parcel.destination,
              }),
            ),
            label: phase3Text(t, 'activities.label.reservation', { kg: reservation.kg }),
            path: `/parcels/${parcel.id}`,
            icon: FiPackage,
          })),
      ),
      ...state.communications.conversations
        .filter((item) => item.participantIds.includes(user.id))
        .map((item) => ({
          id: `conversation-${item.id}`,
          title: activityTitle(item.updatedAt || item.lastMessageAt || item.createdAt, item.title),
          label: phase3Text(t, 'activities.label.conversation'),
          path: `/messages?relatedType=${item.relatedType}&relatedId=${item.relatedId}`,
          icon: FiMessageSquare,
        })),
    ],
    [state, user.id, t],
  )

  return (
    <div className="grid min-w-0 max-w-full gap-6 sm:gap-7">
      <PageHeader
        eyebrow={p3('activities.eyebrow')}
        title={p3('activities.title')}
        description={p3('activities.description')}
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
        <EmptyState
          title={p3('activities.empty.title')}
          description={p3('activities.empty.description')}
        />
      )}
    </div>
  )
}
