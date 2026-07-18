import { FiStar } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { EntityVerifiedName } from '../../components/ui/EntityVerifiedName'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { useLanguage } from '../../contexts/useLanguage'
import { professionalText } from '../../features/businesses/professionalI18n'

export function ReviewsPanel({ reviews }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const visible = reviews.filter((item) => item.status === 'published')
  if (!visible.length) {
    return <EmptyState icon={FiStar} title={pt('professional.reviews.empty')} />
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {visible.map((review) => (
        <Card key={review.id}>
          <div className="flex items-center justify-between gap-3">
            <EntityVerifiedName
              as="strong"
              name={review.authorName}
              userId={review.authorId}
            />
            <Badge tone="warning">{review.rating}/5</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">{review.comment}</p>
        </Card>
      ))}
    </div>
  )
}
