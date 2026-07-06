import { FiStar } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'

export function ReviewsPanel({ reviews }) {
  const visible = reviews.filter((item) => item.status === 'published')
  if (!visible.length) return <EmptyState icon={FiStar} title="Aucun avis publié" />
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {visible.map((review) => (
        <Card key={review.id}>
          <div className="flex items-center justify-between gap-3">
            <strong>{review.authorName}</strong>
            <Badge tone="warning">{review.rating}/5</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">{review.comment}</p>
        </Card>
      ))}
    </div>
  )
}
