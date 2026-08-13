import { ActionButton } from '../admin/AdminActionButton'
import { adminText } from '../admin/adminI18n'
import { confirmAction } from '../../contexts/confirmBridge'
import { REVIEW_DISPUTE_STATUS } from '@moxt/shared/utils/reviewUtils.js'
import { deleteReview, moderateReview } from './reviewSlice'

/**
 * Actions modération avis — panneau admin et cartes publiques (staff).
 */
export function ReviewAdminActions({
  review,
  dispatch,
  t,
  compact = false,
  moderatorId = 'admin',
}) {
  if (!review) return null

  const size = compact ? 'sm' : undefined
  const isPendingDispute = review.disputeStatus === REVIEW_DISPUTE_STATUS.PENDING
  const isPublished = review.status === 'published'
  const isHidden = review.status === 'hidden' || review.status === 'suspended'
  const disputeUpheld = review.disputeStatus === REVIEW_DISPUTE_STATUS.UPHELD
  const disputeRejected = review.disputeStatus === REVIEW_DISPUTE_STATUS.REJECTED
  const mod = { moderatedBy: moderatorId }

  function confirm(label, action) {
    confirmAction({
      title: adminText(t, 'admin.confirm.actionTitle'),
      description: adminText(t, 'admin.confirm.actionBody', { action: label }),
      onConfirm: action,
    })
  }

  if (isPendingDispute) {
    return (
      <div className="flex flex-wrap gap-2">
        <ActionButton
          size={size}
          done={isHidden || disputeUpheld}
          doneLabel={adminText(t, 'admin.actions.removeReview')}
          variant="danger"
          onClick={() =>
            confirm(adminText(t, 'admin.actions.removeReview'), () =>
              dispatch(
                moderateReview({
                  id: review.id,
                  status: 'hidden',
                  disputeStatus: REVIEW_DISPUTE_STATUS.UPHELD,
                  ...mod,
                }),
              ),
            )
          }
        >
          {adminText(t, 'admin.actions.removeReview')}
        </ActionButton>
        <ActionButton
          size={size}
          done={disputeRejected && isPublished}
          doneLabel={adminText(t, 'admin.actions.rejectContest')}
          onClick={() =>
            confirm(adminText(t, 'admin.actions.rejectContest'), () =>
              dispatch(
                moderateReview({
                  id: review.id,
                  status: 'published',
                  disputeStatus: REVIEW_DISPUTE_STATUS.REJECTED,
                  ...mod,
                }),
              ),
            )
          }
        >
          {adminText(t, 'admin.actions.rejectContest')}
        </ActionButton>
        <ActionButton
          size={size}
          variant="danger"
          onClick={() =>
            confirm(adminText(t, 'admin.actions.delete'), () =>
              dispatch(deleteReview(review.id)),
            )
          }
        >
          {adminText(t, 'admin.actions.delete')}
        </ActionButton>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton
        size={size}
        done={isPublished}
        doneLabel={adminText(t, 'admin.actions.publishedMasc')}
        onClick={() =>
          confirm(adminText(t, 'admin.actions.publish'), () =>
            dispatch(moderateReview({ id: review.id, status: 'published', ...mod })),
          )
        }
      >
        {adminText(t, 'admin.actions.publish')}
      </ActionButton>
      <ActionButton
        size={size}
        done={isHidden}
        doneLabel={adminText(t, 'admin.actions.hidden')}
        variant="danger"
        onClick={() =>
          confirm(adminText(t, 'admin.actions.hide'), () =>
            dispatch(moderateReview({ id: review.id, status: 'hidden', ...mod })),
          )
        }
      >
        {adminText(t, 'admin.actions.hide')}
      </ActionButton>
      <ActionButton
        size={size}
        variant="danger"
        onClick={() =>
          confirm(adminText(t, 'admin.actions.delete'), () =>
            dispatch(deleteReview(review.id)),
          )
        }
      >
        {adminText(t, 'admin.actions.delete')}
      </ActionButton>
    </div>
  )
}
