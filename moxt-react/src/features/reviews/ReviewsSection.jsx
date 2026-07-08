import { useEffect, useMemo, useState } from 'react'
import { FiMessageCircle, FiStar } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { StarRating } from '../../components/ui/StarRating'
import {
  calculateAggregateRating,
  REVIEW_TARGET_TYPES,
} from '@moxt/shared/utils/reviewUtils.js'
import { hasReviewEligibility } from '@moxt/shared/utils/reviewEligibility.js'
import { createReview } from './reviewSlice'
import { selectProfileReview } from './reviewSelectors'
import { ReviewCard, ReviewSummary } from './ReviewPanel'

export function ReviewsSection({
  ownerId,
  ownerName,
  profileTargetType,
  profileTargetId,
  reviews,
  currentUser,
  embedded = false,
}) {
  const dispatch = useDispatch()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const aggregate = useMemo(() => calculateAggregateRating(reviews), [reviews])
  const existingReview = useSelector((state) =>
    selectProfileReview(state, currentUser?.id, profileTargetType, profileTargetId),
  )
  const isOwner = currentUser?.id === ownerId
  const appState = useSelector((state) => state)
  const eligibility = useMemo(
    () =>
      hasReviewEligibility(
        appState,
        currentUser?.id,
        profileTargetType,
        profileTargetId,
      ),
    [appState, currentUser?.id, profileTargetType, profileTargetId],
  )
  const canReview = eligibility.allowed || Boolean(existingReview)

  useEffect(() => {
    if (!existingReview) return
    setRating(existingReview.rating)
    setComment(existingReview.comment || '')
  }, [existingReview])

  function handleSubmit(event) {
    event.preventDefault()
    if (comment.trim().length < 5 || !currentUser?.id) return
    dispatch(
      createReview({
        id: existingReview?.id,
        targetType: profileTargetType,
        targetId: profileTargetId,
        authorId: currentUser.id,
        authorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Membre MOXT',
        rating,
        comment,
        createdAt: existingReview?.createdAt,
      }),
    )
    if (!existingReview) {
      setComment('')
      setRating(5)
    }
  }

  return (
    <section className="grid gap-5" aria-labelledby={embedded ? undefined : 'reviews-section-title'}>
      {embedded ? null : (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
              Réputation
            </p>
            <h2 id="reviews-section-title" className="mt-1 text-2xl font-black">
              Avis de la communauté
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--app-text-muted)]">
              Note globale calculée sur cette page et sur chaque publication liée (
              {aggregate.count} avis).
            </p>
          </div>
          {aggregate.count ? (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 dark:bg-amber-950/30">
              <FiStar className="text-amber-500" />
              <strong className="text-lg tabular-nums">{aggregate.average}/5</strong>
            </div>
          ) : null}
        </div>
      )}

      {embedded ? (
        <p className="text-sm text-[var(--app-text-muted)]">
          Note globale sur cette page et chaque publication liée — {aggregate.count} avis, moyenne{' '}
          {aggregate.count ? `${aggregate.average}/5` : '—'}.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="grid content-start gap-5">
          <ReviewSummary rating={aggregate} />

          {canReview ? (
            <form className="grid gap-4 border-t border-[var(--app-border)] pt-5" onSubmit={handleSubmit}>
              <h3 className="font-black">Laisser un avis</h3>
              <div className="grid gap-2">
                <span className="text-sm font-semibold">Votre note</span>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Votre commentaire
                <textarea
                  className="min-h-28 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm font-normal"
                  placeholder="Partagez votre expérience avec ce profil…"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  minLength={5}
                  required
                />
              </label>
              <Button type="submit" icon={FiMessageCircle}>
                {existingReview ? 'Mettre à jour mon avis' : 'Publier mon avis'}
              </Button>
            </form>
          ) : null}

          {!canReview && !isOwner && currentUser?.id ? (
            <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">
              {eligibility.reason}
            </p>
          ) : null}

          {isOwner ? (
            <p className="rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-sm text-[var(--app-text-muted)] dark:border-brand-900/40 dark:bg-brand-950/20">
              Vous pouvez répondre ou contester les avis reçus sur votre page et vos
              publications.
            </p>
          ) : null}
        </Card>

        <Card className="grid content-start gap-4">
          <h3 className="font-black">Tous les avis</h3>
          {reviews.length ? (
            <div className="grid max-h-[42rem] gap-3 overflow-y-auto pr-1">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  ownerId={ownerId}
                  ownerName={ownerName}
                  isOwner={isOwner}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FiStar}
              title="Aucun avis pour le moment"
              description="Soyez le premier à partager votre expérience."
            />
          )}
        </Card>
      </div>
    </section>
  )
}

export { REVIEW_TARGET_TYPES }
