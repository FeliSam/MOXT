import { FiStar } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { EntityVerifiedName } from '../../components/ui/EntityVerifiedName'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { useLanguage } from '../../contexts/useLanguage'
import { professionalText } from '../../features/businesses/professionalI18n'

function ratingDistribution(reviews) {
  const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const review of reviews) {
    const stars = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 0)))
    buckets[stars] += 1
  }
  return [5, 4, 3, 2, 1].map((stars) => ({ stars, count: buckets[stars] }))
}

export function ReviewsPanel({ reviews, rating = null, transferMode = false }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const visible = reviews.filter((item) => item.status === 'published')
  const distribution = ratingDistribution(visible)
  const maxDist = Math.max(...distribution.map((item) => item.count), 1)
  const average =
    rating?.count && rating.average != null
      ? rating.average
      : visible.length
        ? Math.round(
            (visible.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / visible.length) *
              10,
          ) / 10
        : null

  if (!visible.length) {
    return (
      <EmptyState
        icon={FiStar}
        title={pt('professional.reviews.empty')}
        description={
          transferMode ? pt('professional.reviews.transferEmpty') : undefined
        }
      />
    )
  }

  return (
    <div className="grid gap-5">
      <Card>
        <h2 className="font-black">{pt('professional.reviews.summaryTitle')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="rounded-2xl bg-[var(--app-surface-muted)] px-6 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
              {pt('professional.reviews.summaryAverage')}
            </p>
            <p className="mt-1 text-3xl font-black tabular-nums text-brand-700">{average}/5</p>
            <p className="mt-1 text-xs text-[var(--app-text-muted)]">
              {pt('professional.reviews.summaryCount', { count: visible.length })}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
              {pt('professional.reviews.distribution')}
            </p>
            <div className="grid gap-1.5">
              {distribution.map((item) => (
                <div key={item.stars} className="flex items-center gap-2 text-sm">
                  <span className="w-8 shrink-0 font-bold tabular-nums">{item.stars}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${Math.round((item.count / maxDist) * 100)}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right tabular-nums text-[var(--app-text-muted)]">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

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
    </div>
  )
}
