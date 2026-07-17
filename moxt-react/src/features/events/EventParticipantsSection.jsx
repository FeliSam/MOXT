import { FiCheck, FiUser, FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DetailSection } from '../../components/ui/DetailBlocks'
import { EmptyState } from '../../components/ui/EmptyState'
import { statusMeta } from '../../config/statuses'
import { useLanguage } from '../../contexts/useLanguage'
import { eventStatusLabelKey } from './eventsConfig'
import { updateRegistrationStatus } from './eventSlice'

const registrationStatusTone = {
  registered: 'info',
  checked_in: 'success',
  cancelled: 'neutral',
}

function resolveStatusLabel(status, t) {
  const key = eventStatusLabelKey(status)
  return key ? t(key) : statusMeta(status).label
}

export function EventParticipantsSection({ event, eventId }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const registrations = useSelector((state) =>
    state.events.registrations.filter((item) => item.eventId === eventId),
  )

  const isOwner = event?.ownerId === user?.id
  if (!isOwner || !event) return null

  const activeRows = registrations.filter((item) => item.status !== 'cancelled')
  const cancelledRows = registrations.filter((item) => item.status === 'cancelled')

  return (
    <DetailSection title={t('events.participants.title')}>
      <Card className="grid gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--app-text-muted)]">
              {t('events.participants.activeSummary', {
                active: activeRows.length,
                capacity: event.capacity,
              })}
            </p>
          </div>
          <Badge tone="info">
            {t('events.participants.placesBadge', {
              active: activeRows.length,
              capacity: event.capacity,
            })}
          </Badge>
        </div>

        {activeRows.length ? (
          <div className="grid gap-3">
            {activeRows.map((row) => {
              const status = statusMeta(row.status)
              return (
                <Card key={row.id} className="bg-[var(--app-surface-muted)] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                          <FiUser />
                        </span>
                        <div className="min-w-0">
                          <strong className="block truncate">
                            {row.participantName || t('events.participants.memberFallback')}
                          </strong>
                          <p className="text-xs text-[var(--app-text-faint)]">
                            {t('events.participants.registeredAt', {
                              date: row.createdAt
                                ? new Date(row.createdAt).toLocaleString('fr-FR')
                                : '—',
                            })}
                          </p>
                        </div>
                        <Badge tone={registrationStatusTone[row.status] || status.tone}>
                          {resolveStatusLabel(row.status, t)}
                        </Badge>
                      </div>
                      {row.message ? (
                        <p className="mt-3 rounded-xl bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text-muted)]">
                          {row.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {row.status !== 'checked_in' ? (
                        <Button
                          icon={FiCheck}
                          size="sm"
                          onClick={() =>
                            dispatch(
                              updateRegistrationStatus({ id: row.id, status: 'checked_in' }),
                            )
                          }
                        >
                          {t('events.participants.present')}
                        </Button>
                      ) : null}
                      <Button
                        icon={FiX}
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          dispatch(
                            updateRegistrationStatus({ id: row.id, status: 'cancelled' }),
                          )
                        }
                      >
                        {t('events.participants.cancel')}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title={t('events.participants.emptyTitle')}
            description={t('events.participants.emptyDescription')}
          />
        )}

        {cancelledRows.length ? (
          <details className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 px-4 py-3">
            <summary className="cursor-pointer text-sm font-bold text-[var(--app-text-muted)]">
              {t('events.participants.cancelledSummary', { count: cancelledRows.length })}
            </summary>
            <div className="mt-3 grid gap-2">
              {cancelledRows.map((row) => (
                <p key={row.id} className="text-sm text-[var(--app-text-faint)]">
                  {row.participantName || t('events.participants.memberFallback')}
                </p>
              ))}
            </div>
          </details>
        ) : null}
      </Card>
    </DetailSection>
  )
}
