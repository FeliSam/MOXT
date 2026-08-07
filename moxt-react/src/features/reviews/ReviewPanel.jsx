import { useState } from 'react'
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCalendar,
  FiEdit3,
  FiExternalLink,
  FiMessageSquare,
  FiPackage,
  FiShield,
  FiShoppingBag,
  FiTrash2,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { PillBadge } from '../../components/ui/Badge'
import { EntityVerifiedName } from '../../components/ui/EntityVerifiedName'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { LinkifiedText } from '../../components/ui/LinkifiedText'
import { StarRating } from '../../components/ui/StarRating'
import { useLanguage } from '../../contexts/useLanguage'
import { EntityAvatar } from '../account/EntityAvatar'
import {
  REVIEW_DISPUTE_LABELS,
  REVIEW_DISPUTE_STATUS,
  REVIEW_SOURCE_LABELS,
  REVIEW_TARGET_TYPES,
} from '@moxt/shared/utils/reviewUtils.js'
import { formatReviewDate } from '@moxt/shared/utils/reviewPublicationResolver.js'
import { contestReview, deleteReview, replyToReview } from './reviewSlice'
import { resolveReviewTargetHref } from './reviewRemote'
import { useReviewPublication } from './useReviewPublication'

const PUBLICATION_ICONS = {
  listing: FiShoppingBag,
  parcel: FiPackage,
  job: FiBriefcase,
  event: FiCalendar,
  post: FiMessageSquare,
  business: HiOutlineBuildingOffice2,
}

export function ReviewCard({
  review,
  ownerId,
  ownerName,
  isOwner,
  currentUserId,
  onEditReview,
  authorProfile,
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const publication = useReviewPublication(review)
  const [replyOpen, setReplyOpen] = useState(false)
  const [contestOpen, setContestOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [replyText, setReplyText] = useState(review.replyText || '')
  const [disputeReason, setDisputeReason] = useState('')

  const sourceLabel = REVIEW_SOURCE_LABELS[review.targetType] || t('reviews.card.publicationFallback')
  const disputeLabel = REVIEW_DISPUTE_LABELS[review.disputeStatus]
  const PublicationIcon = PUBLICATION_ICONS[review.targetType] || FiShoppingBag
  const isProfileReview = review.targetType === REVIEW_TARGET_TYPES.USER_PROFILE
  const isAuthor = Boolean(currentUserId && review.authorId === currentUserId)
  const targetHref = resolveReviewTargetHref(review, publication)
  const authorName =
    authorProfile?.name || review.authorName || t('reviews.memberFallback')
  const authorAvatarUrl = authorProfile?.avatarUrl || null
  const authorHref = review.authorId ? `/users/${review.authorId}/publications` : null
  const authorBlock = (
    <>
      <EntityAvatar
        name={authorName}
        src={authorAvatarUrl}
        size="sm"
        shape="user"
        ring={false}
        alt={authorName}
      />
      <EntityVerifiedName
        as="strong"
        name={authorName}
        userId={review.authorId}
        className={`min-w-0 ${authorHref ? 'hover:underline' : ''}`}
        nameClassName="truncate"
      />
    </>
  )

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

  function handleDelete() {
    dispatch(deleteReview(review.id))
    setConfirmDelete(false)
  }

  return (
    <article className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {authorHref ? (
              <Link
                to={authorHref}
                className="flex min-w-0 items-center gap-2.5 rounded-xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                {authorBlock}
              </Link>
            ) : (
              <div className="flex min-w-0 items-center gap-2.5">{authorBlock}</div>
            )}
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

      <LinkifiedText
        as="p"
        text={review.comment}
        preserveWhitespace="pre-line"
        className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]"
      />

      {review.replyText ? (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/70 p-3 dark:border-brand-900/40 dark:bg-brand-950/20">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-brand-700 dark:text-brand-300">
            <FiMessageSquare />
            {t('reviews.card.ownerReply', { name: ownerName || t('reviews.card.ownerFallback') })}
            {review.replyAt ? (
              <span className="font-medium normal-case text-[var(--app-text-faint)]">
                · {formatReviewDate(review.replyAt)}
              </span>
            ) : null}
          </p>
          <LinkifiedText
            as="p"
            text={review.replyText}
            preserveWhitespace="pre-line"
            className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]"
          />
        </div>
      ) : null}

      {review.disputeStatus === REVIEW_DISPUTE_STATUS.PENDING && review.disputeReason ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          <p className="flex items-center gap-2 font-bold">
            <FiAlertTriangle />
            {t('reviews.card.disputeReasonTitle')}
          </p>
          <LinkifiedText
            as="p"
            text={review.disputeReason}
            preserveWhitespace="pre-line"
            className="mt-1 leading-6"
          />
        </div>
      ) : null}

      {isAuthor ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--app-border)] pt-4">
          <Button size="sm" variant="secondary" icon={FiEdit3} onClick={() => onEditReview?.(review)}>
            {t('reviews.actions.edit')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={FiTrash2}
            onClick={() => setConfirmDelete(true)}
          >
            {t('reviews.actions.delete')}
          </Button>
          {targetHref ? (
            <Button
              size="sm"
              variant="ghost"
              icon={FiExternalLink}
              onClick={() => navigate(targetHref)}
            >
              {publication ? t('reviews.actions.viewPublication') : t('reviews.actions.viewTarget')}
            </Button>
          ) : null}
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
            {review.replyText ? t('reviews.actions.editReply') : t('reviews.actions.reply')}
          </Button>
          {review.disputeStatus === REVIEW_DISPUTE_STATUS.NONE ? (
            <Button
              size="sm"
              variant="ghost"
              icon={FiShield}
              onClick={() => setContestOpen((value) => !value)}
            >
              {t('reviews.actions.contest')}
            </Button>
          ) : null}
        </div>
      ) : null}

      {isOwner && replyOpen ? (
        <form className="mt-3 grid gap-3" onSubmit={submitReply}>
          <textarea
            className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
            placeholder={t('reviews.actions.replyPlaceholder')}
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" type="submit">
              {t('reviews.actions.publishReply')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setReplyOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      ) : null}

      {isOwner && contestOpen ? (
        <form className="mt-3 grid gap-3" onSubmit={submitContest}>
          <textarea
            className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
            placeholder={t('reviews.actions.contestPlaceholder')}
            value={disputeReason}
            onChange={(event) => setDisputeReason(event.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="danger" type="submit">
              {t('reviews.actions.submitContest')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setContestOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title={t('reviews.actions.deleteConfirmTitle')}
        description={t('reviews.actions.deleteConfirmBody')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </article>
  )
}

export function ReviewSummary({ rating }) {
  const { t } = useLanguage()
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
          {t('reviews.summaryTotal', { count: rating.count })}
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
