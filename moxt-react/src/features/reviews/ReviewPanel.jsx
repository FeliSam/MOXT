import { useState } from 'react'
import { FiAlertTriangle, FiBriefcase, FiCalendar, FiMessageSquare, FiPackage, FiShield, FiShoppingBag } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { PillBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { StarRating } from '../../components/ui/StarRating'
import {
  REVIEW_DISPUTE_LABELS,
  REVIEW_DISPUTE_STATUS,
  REVIEW_SOURCE_LABELS,
  REVIEW_TARGET_TYPES,
} from '@moxt/shared/utils/reviewUtils.js'
import { formatReviewDate } from '@moxt/shared/utils/reviewPublicationResolver.js'
import { contestReview, replyToReview } from './reviewSlice'
import { useReviewPublication } from './useReviewPublication'

const PUBLICATION_ICONS = {
  listing: FiShoppingBag,
  parcel: FiPackage,
  job: FiBriefcase,
  event: FiCalendar,
  post: FiMessageSquare,
  business: FiBriefcase,
}

export function ReviewCard({ review, ownerId, ownerName, isOwner }) {
  const dispatch = useDispatch()
  const publication = useReviewPublication(review)
  const [replyOpen, setReplyOpen] = useState(false)
  const [contestOpen, setContestOpen] = useState(false)
  const [replyText, setReplyText] = useState(review.replyText || '')
  const [disputeReason, setDisputeReason] = useState('')

  const sourceLabel = REVIEW_SOURCE_LABELS[review.targetType] || 'Publication'
  const disputeLabel = REVIEW_DISPUTE_LABELS[review.disputeStatus]
  const PublicationIcon = PUBLICATION_ICONS[review.targetType] || FiShoppingBag
  const isProfileReview = review.targetType === REVIEW_TARGET_TYPES.USER_PROFILE

  function submitReply(event) {
    event.preventDefault()
    if (replyText.trim().length < 3) return
    dispatch(
      replyToReview({
        id: review.id,
        replyText: replyText.trim(),
        replyAt: new Date().toISOString(),
        replyBy: ownerId,
      }),
    )
    setReplyOpen(false)
  }

  function submitContest(event) {
    event.preventDefault()
    if (disputeReason.trim().length < 10) return
    dispatch(
      contestReview({
        id: review.id,
        disputeReason: disputeReason.trim(),
        disputedAt: new Date().toISOString(),
      }),
    )
    setContestOpen(false)
  }

  return (
    <article className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="truncate">{review.authorName || 'Membre MOXT'}</strong>
            <PillBadge tone="neutral">{sourceLabel}</PillBadge>
            {disputeLabel ? (
              <PillBadge tone={review.disputeStatus === 'pending' ? 'warning' : 'info'}>
                {disputeLabel}
              </PillBadge>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-medium text-[var(--app-text-faint)]">
            <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
          </p>
        </div>
        <StarRating value={review.rating} readOnly size="sm" />
      </div>

      {publication && !isProfileReview ? (
        <Link
          to={publication.path}
          className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/70 p-2.5 transition hover:border-brand-200 hover:bg-[var(--app-surface-muted)]"
        >
          {publication.imageUrl ? (
            <img
              src={publication.imageUrl}
              alt=""
              className="size-12 shrink-0 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
              <PublicationIcon className="text-lg" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-faint)]">
              {publication.typeLabel}
            </span>
            <span className="mt-0.5 block truncate text-sm font-bold text-[var(--app-text)]">
              {publication.title}
            </span>
          </span>
        </Link>
      ) : null}

      <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">{review.comment}</p>

      {review.replyText ? (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/70 p-3 dark:border-brand-900/40 dark:bg-brand-950/20">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-brand-700 dark:text-brand-300">
            <FiMessageSquare />
            Réponse de {ownerName || 'le propriétaire'}
            {review.replyAt ? (
              <span className="font-medium normal-case text-[var(--app-text-faint)]">
                · {formatReviewDate(review.replyAt)}
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{review.replyText}</p>
        </div>
      ) : null}

      {review.disputeStatus === REVIEW_DISPUTE_STATUS.PENDING && review.disputeReason ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          <p className="flex items-center gap-2 font-bold">
            <FiAlertTriangle />
            Motif de contestation
          </p>
          <p className="mt-1 leading-6">{review.disputeReason}</p>
        </div>
      ) : null}

      {isOwner ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--app-border)] pt-4">
          <Button
            size="sm"
            variant="secondary"
            icon={FiMessageSquare}
            onClick={() => setReplyOpen((value) => !value)}
          >
            {review.replyText ? 'Modifier la réponse' : 'Répondre'}
          </Button>
          {review.disputeStatus === REVIEW_DISPUTE_STATUS.NONE ? (
            <Button
              size="sm"
              variant="ghost"
              icon={FiShield}
              onClick={() => setContestOpen((value) => !value)}
            >
              Contester
            </Button>
          ) : null}
        </div>
      ) : null}

      {isOwner && replyOpen ? (
        <form className="mt-3 grid gap-3" onSubmit={submitReply}>
          <textarea
            className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
            placeholder="Répondez de manière professionnelle à cet avis…"
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" type="submit">
              Publier la réponse
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setReplyOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : null}

      {isOwner && contestOpen ? (
        <form className="mt-3 grid gap-3" onSubmit={submitContest}>
          <textarea
            className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
            placeholder="Expliquez pourquoi cet avis vous semble injuste ou non conforme (min. 10 caractères)…"
            value={disputeReason}
            onChange={(event) => setDisputeReason(event.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="danger" type="submit">
              Envoyer la contestation
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setContestOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : null}
    </article>
  )
}

export function ReviewSummary({ rating }) {
  const maxCount = Math.max(...rating.breakdown, 1)
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="text-center sm:min-w-[7rem] sm:text-left">
        <strong className="font-display text-4xl font-black tabular-nums text-[var(--app-text)]">
          {rating.count ? rating.average : '—'}
        </strong>
        <StarRating
          value={Math.round(rating.average)}
          readOnly
          size="sm"
          className="mt-2 justify-center sm:justify-start"
        />
        <p className="mt-2 text-sm text-[var(--app-text-muted)]">
          {rating.count} avis au total
        </p>
      </div>
      <div className="grid gap-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = rating.breakdown[star - 1] || 0
          const width = rating.count ? `${(count / maxCount) * 100}%` : '0%'
          return (
            <div key={star} className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2 text-xs">
              <span className="font-semibold text-[var(--app-text-muted)]">{star}</span>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width }}
                />
              </div>
              <span className="text-right tabular-nums text-[var(--app-text-faint)]">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
