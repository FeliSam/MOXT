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
    <div className="grid gap-3">
      {requests.map((request) => {
        const meta = statusMeta(request.status)
        return (
          <Card key={request.id} className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <strong>{request.title || request.relatedType}</strong>
              <p className="text-sm text-[var(--app-text-muted)]">
                {request.requesterName || request.ownerId}
              </p>
            </div>
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <div className="w-full rounded-2xl bg-[var(--app-surface-muted)] p-3 lg:w-auto">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
                Chronologie
              </p>
              <p className="mt-1 text-xs">
                {(request.timeline || [])
                  .map((event) => statusMeta(event.status).label)
                  .join(' → ')}
              </p>
            </div>
            {request.status === 'submitted' ? (
              <Button
                variant="secondary"
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
          </Card>
        )
      })}
    </div>
  )
}
