import { FiCheck, FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { updateRegistrationStatus } from './eventSlice'

export function EventRegistrationsPanel({ id = 'event-registrations' }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const events = useSelector((state) => state.events.items)
  const registrations = useSelector((state) => state.events.registrations)

  const ownedEventIds = new Set(
    events.filter((item) => item.ownerId === user.id).map((item) => item.id),
  )
  const rows = registrations.filter((item) => ownedEventIds.has(item.eventId))

  return (
    <section id={id} className="scroll-mt-24 lg:scroll-mt-28">
      <Card className="grid gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-black">Participants inscrits</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Suivez les inscriptions à vos événements publiés.
          </p>
        </div>
        {rows.length ? (
          <div className="grid gap-3">
            {rows.map((row) => {
              const event = events.find((item) => item.id === row.eventId)
              return (
                <Card key={row.id} className="h-full bg-[var(--app-surface-muted)] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <strong>{row.participantName || 'Membre MOXT'}</strong>
                      <p className="mt-1 text-sm text-[var(--app-text-muted)]">{event?.title}</p>
                      {row.message ? (
                        <p className="mt-2 text-sm text-[var(--app-text-muted)]">{row.message}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{row.status}</Badge>
                      <Button
                        icon={FiCheck}
                        onClick={() =>
                          dispatch(
                            updateRegistrationStatus({ id: row.id, status: 'checked_in' }),
                          )
                        }
                      >
                        Présent
                      </Button>
                      <Button
                        icon={FiX}
                        variant="danger"
                        onClick={() =>
                          dispatch(
                            updateRegistrationStatus({ id: row.id, status: 'cancelled' }),
                          )
                        }
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="Aucune inscription"
            description="Les nouvelles inscriptions à vos événements apparaîtront ici."
          />
        )}
      </Card>
    </section>
  )
}
