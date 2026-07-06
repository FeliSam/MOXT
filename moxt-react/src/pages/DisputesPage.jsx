import { FiAlertTriangle } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { statusMeta } from '../config/statuses'
import { formatDate } from '../features/transfers/transferUtils'

export function DisputesPage() {
  const user = useSelector((state) => state.auth.user)
  const disputes = useSelector((state) =>
    state.disputes.items.filter((item) => item.openedBy === user.id),
  )

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Mes litiges"
        description="Suivi local des problèmes déclarés sur les opérations compatibles."
      />
      {disputes.length ? (
        <div className="grid gap-3">
          {disputes.map((dispute) => {
            const meta = statusMeta(dispute.status)
            return (
              <Card className="flex h-full items-start gap-4">
                <FiAlertTriangle className="mt-1 shrink-0 text-xl text-amber-600" />
                <div className="min-w-0 flex-1">
                  <strong>
                    {dispute.relatedType} · {dispute.relatedId}
                  </strong>
                  <p className="mt-2 text-sm text-[var(--app-text-muted)]">{dispute.reason}</p>
                  <p className="mt-2 text-xs text-[var(--app-text-muted)]">
                    {formatDate(dispute.createdAt)}
                  </p>
                </div>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={FiAlertTriangle} title="Aucun litige" />
      )}
    </div>
  )
}
