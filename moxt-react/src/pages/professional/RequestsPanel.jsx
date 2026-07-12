import { FiInbox } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { statusMeta } from '../../config/statuses'
import { updateBusinessRequestStatus } from '../../features/businesses/businessSlice'

export function RequestsPanel({ business, dispatch, requests }) {
  if (!requests.length) {
    return (
      <EmptyState
        icon={FiInbox}
        title="Aucune demande"
        description="Les demandes liées aux services de l’entreprise apparaîtront ici."
      />
    )
  }
  return (
    <div className="grid min-w-0 gap-3">
      {requests.map((request) => {
        const meta = statusMeta(request.status)
        return (
          <Card key={request.id} className="min-w-0 overflow-hidden !p-3 sm:!p-5">
            <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div className="min-w-0 flex-1">
                <strong className="block break-words">{request.title || request.relatedType}</strong>
                <p className="mt-0.5 truncate text-sm text-[var(--app-text-muted)]">
                  {request.requesterName || request.ownerId}
                </p>
              </div>
              <Badge tone={meta.tone} className="self-start lg:self-center">
                {meta.label}
              </Badge>
              <div className="min-w-0 rounded-2xl bg-[var(--app-surface-muted)] p-3 lg:max-w-xs lg:flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
                  Chronologie
                </p>
                <p className="mt-1 break-words text-xs">
                  {(request.timeline || [])
                    .map((event) => statusMeta(event.status).label)
                    .join(' → ')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:shrink-0">
                {request.status === 'submitted' ? (
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      dispatch(
                        updateBusinessRequestStatus({
                          id: request.id,
                          businessId: business.id,
                          status: 'in_progress',
                          actorId: business.ownerId,
                        }),
                      )
                    }
                  >
                    Traiter
                  </Button>
                ) : null}
                {request.status === 'in_progress' ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() =>
                      dispatch(
                        updateBusinessRequestStatus({
                          id: request.id,
                          businessId: business.id,
                          status: 'completed',
                          actorId: business.ownerId,
                        }),
                      )
                    }
                  >
                    Terminer
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
