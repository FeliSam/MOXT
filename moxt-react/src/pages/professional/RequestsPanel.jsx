import { FiInbox } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EntityVerifiedName } from '../../components/ui/EntityVerifiedName'
import { EmptyState } from '../../components/ui/EmptyState'
import { statusMeta } from '../../config/statuses'
import { useLanguage } from '../../contexts/useLanguage'
import { updateBusinessRequestStatus } from '../../features/businesses/businessSlice'
import { professionalText } from '../../features/businesses/professionalI18n'

export function RequestsPanel({ business, dispatch, requests }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)

  if (!requests.length) {
    return (
      <EmptyState
        icon={FiInbox}
        title={pt('professional.requests.emptyTitle')}
        description={pt('professional.requests.emptyDescription')}
      />
    )
  }
  return (
    <div className="grid min-w-0 gap-3">
      {requests.map((request) => {
        const meta = statusMeta(request.status, t)
        return (
          <Card key={request.id} className="min-w-0 overflow-hidden !p-3 sm:!p-5">
            <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div className="min-w-0 flex-1">
                <strong className="block break-words">{request.title || request.relatedType}</strong>
                <EntityVerifiedName
                  as="p"
                  name={request.requesterName || request.ownerId}
                  userId={request.requesterId || request.userId || request.ownerId}
                  className="mt-0.5 text-sm text-[var(--app-text-muted)]"
                  nameClassName="truncate"
                />
              </div>
              <Badge tone={meta.tone} className="self-start lg:self-center">
                {meta.label}
              </Badge>
              <div className="min-w-0 rounded-2xl bg-[var(--app-surface-muted)] p-3 lg:max-w-xs lg:flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
                  {pt('professional.requests.timeline')}
                </p>
                <p className="mt-1 break-words text-xs">
                  {(request.timeline || [])
                    .map((event) => statusMeta(event.status, t).label)
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
                    {pt('professional.requests.process')}
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
                    {pt('professional.requests.complete')}
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
