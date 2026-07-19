/* eslint-disable react-refresh/only-export-components -- action helpers + local ActionButton */
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { dispatchUserRole } from './promoteAdminUtils'
import { updateVerificationStatus, updateSubscriberReportStatus } from '../account/accountSlice'
import { moderateBusiness, updateBusinessDocumentStatus } from '../businesses/businessSlice'
import { updateDisputeStatus } from '../disputes/disputeSlice'
import { moderateEvent, updateEventReportStatus } from '../events/eventSlice'
import { moderateJob, updateJobReportStatus } from '../jobs/jobSlice'
import {
  updateListingReportStatus,
  updateListingStatus,
} from '../marketplace/marketplaceSlice'
import { updateParcelProofStatus, updateParcelStatus } from '../parcels/parcelSlice'
import { deletePost, moderatePost } from '../posts/postsSlice'
import { moderateReview } from '../reviews/reviewSlice'
import { TRANSFER_TRANSITIONS } from '../transfers/transferConfig'
import { moderateTransfer } from '../transfers/transferSlice'
import { REVIEW_DISPUTE_STATUS } from '@moxt/shared/utils/reviewUtils.js'
import { FiCheck, FiEye } from 'react-icons/fi'
import { adminDetailLink, normalizeAdminKind, normalizeReportType } from './adminLinkUtils'
import { adminText } from './adminI18n'

function detailViewButton(kind, item, t) {
  const link = adminDetailLink(kind, item)
  if (!link) return null
  return (
    <Link to={link}>
      <Button variant="secondary" icon={FiEye}>{adminText(t, 'admin.actions.view')}</Button>
    </Link>
  )
}

function ActionButton({ done, doneLabel, children, ...props }) {
  if (done) {
    return (
      <Button
        type="button"
        variant="secondary"
        disabled
        icon={FiCheck}
        className="!border-emerald-300 !bg-emerald-50 !text-emerald-800 opacity-100 dark:!border-emerald-800 dark:!bg-emerald-950/40 dark:!text-emerald-200"
        {...props}
      >
        {doneLabel || children}
      </Button>
    )
  }
  return <Button type="button" {...props}>{children}</Button>
}

export function handleReportApprove(dispatch, item) {
  const reportType = normalizeReportType(item.reportType)
  const relatedId =
    item.relatedId ||
    item.listingId ||
    item.jobId ||
    item.eventId ||
    item.subscriberId

  if (reportType === 'listing') {
    dispatch(updateListingReportStatus({ id: item.id, status: 'resolved' }))
    if (relatedId) dispatch(updateListingStatus({ id: relatedId, status: 'suspended' }))
    return
  }
  if (reportType === 'job') {
    dispatch(updateJobReportStatus({ id: item.id, status: 'resolved' }))
    if (relatedId) dispatch(moderateJob({ id: relatedId, status: 'rejected' }))
    return
  }
  if (reportType === 'event') {
    dispatch(updateEventReportStatus({ id: item.id, status: 'resolved' }))
    if (relatedId) dispatch(moderateEvent({ id: relatedId, status: 'rejected' }))
    return
  }
  if (reportType === 'subscriber') {
    dispatch(updateSubscriberReportStatus({ id: item.id, status: 'resolved' }))
  }
}

export function handleReportReject(dispatch, item) {
  const reportType = normalizeReportType(item.reportType)

  if (reportType === 'listing') {
    dispatch(updateListingReportStatus({ id: item.id, status: 'dismissed' }))
    return
  }
  if (reportType === 'job') {
    dispatch(updateJobReportStatus({ id: item.id, status: 'dismissed' }))
    return
  }
  if (reportType === 'event') {
    dispatch(updateEventReportStatus({ id: item.id, status: 'dismissed' }))
    return
  }
  if (reportType === 'subscriber') {
    dispatch(updateSubscriberReportStatus({ id: item.id, status: 'dismissed' }))
  }
}

export function contentActions(contentView, dispatch, item, t) {
  const status = item.effectiveStatus || item.status

  switch (contentView) {
    case 'businesses':
      return (
        <>
          <ActionButton
            done={status === 'verified'}
            doneLabel={adminText(t, 'admin.actions.approved')}
            onClick={() => dispatch(moderateBusiness({ id: item.id, status: 'verified' }))}
          >
            {adminText(t, 'admin.actions.approve')}
          </ActionButton>
          <ActionButton
            done={status === 'rejected'}
            doneLabel={adminText(t, 'admin.actions.rejected')}
            variant="danger"
            onClick={() => dispatch(moderateBusiness({ id: item.id, status: 'rejected' }))}
          >
            {adminText(t, 'admin.actions.reject')}
          </ActionButton>
        </>
      )
    case 'listings':
      return (
        <>
          <ActionButton
            done={status === 'active'}
            doneLabel={adminText(t, 'admin.actions.published')}
            onClick={() => dispatch(updateListingStatus({ id: item.id, status: 'active' }))}
          >
            {adminText(t, 'admin.actions.publish')}
          </ActionButton>
          <ActionButton
            done={status === 'archived' || status === 'suspended'}
            doneLabel={adminText(t, 'admin.actions.archived')}
            variant="danger"
            onClick={() => dispatch(updateListingStatus({ id: item.id, status: 'archived' }))}
          >
            {adminText(t, 'admin.actions.archive')}
          </ActionButton>
        </>
      )
    case 'jobs':
      return (
        <>
          <ActionButton
            done={status === 'active'}
            doneLabel={adminText(t, 'admin.actions.activated')}
            onClick={() => dispatch(moderateJob({ id: item.id, status: 'active' }))}
          >
            {adminText(t, 'admin.actions.activate')}
          </ActionButton>
          <ActionButton
            done={status === 'archived'}
            doneLabel={adminText(t, 'admin.actions.archivedMasc')}
            variant="danger"
            onClick={() => dispatch(moderateJob({ id: item.id, status: 'archived' }))}
          >
            {adminText(t, 'admin.actions.archive')}
          </ActionButton>
          <ActionButton
            done={status === 'rejected'}
            doneLabel={adminText(t, 'admin.actions.rejected')}
            variant="danger"
            onClick={() => dispatch(moderateJob({ id: item.id, status: 'rejected' }))}
          >
            {adminText(t, 'admin.actions.reject')}
          </ActionButton>
        </>
      )
    case 'events':
      return (
        <>
          <ActionButton
            done={status === 'published'}
            doneLabel={adminText(t, 'admin.actions.publishedMasc')}
            onClick={() => dispatch(moderateEvent({ id: item.id, status: 'published' }))}
          >
            {adminText(t, 'admin.actions.publish')}
          </ActionButton>
          <ActionButton
            done={status === 'archived'}
            doneLabel={adminText(t, 'admin.actions.archivedMasc')}
            variant="danger"
            onClick={() => dispatch(moderateEvent({ id: item.id, status: 'archived' }))}
          >
            {adminText(t, 'admin.actions.archive')}
          </ActionButton>
          <ActionButton
            done={status === 'rejected'}
            doneLabel={adminText(t, 'admin.actions.rejectedMasc')}
            variant="danger"
            onClick={() => dispatch(moderateEvent({ id: item.id, status: 'rejected' }))}
          >
            {adminText(t, 'admin.actions.reject')}
          </ActionButton>
        </>
      )
    case 'parcels':
      return (
        <>
          <ActionButton
            done={status === 'active'}
            doneLabel={adminText(t, 'admin.actions.active')}
            onClick={() => dispatch(updateParcelStatus({ id: item.id, status: 'active' }))}
          >
            {adminText(t, 'admin.actions.activate')}
          </ActionButton>
          <ActionButton
            done={status === 'archived'}
            doneLabel={adminText(t, 'admin.actions.archivedMasc')}
            variant="danger"
            onClick={() => dispatch(updateParcelStatus({ id: item.id, status: 'archived' }))}
          >
            {adminText(t, 'admin.actions.archive')}
          </ActionButton>
          {item.travelProofUrl || item.proofStatus === 'pending_review' ? (
            <>
              <ActionButton
                done={item.proofStatus === 'verified'}
                doneLabel={adminText(t, 'admin.queues.validateProof')}
                onClick={() =>
                  dispatch(updateParcelProofStatus({ id: item.id, status: 'verified' }))
                }
              >
                {adminText(t, 'admin.queues.validateProof')}
              </ActionButton>
              <ActionButton
                done={item.proofStatus === 'rejected'}
                doneLabel={adminText(t, 'admin.queues.rejectProof')}
                variant="danger"
                onClick={() =>
                  dispatch(updateParcelProofStatus({ id: item.id, status: 'rejected' }))
                }
              >
                {adminText(t, 'admin.queues.rejectProof')}
              </ActionButton>
            </>
          ) : null}
        </>
      )
    case 'reports':
      return (
        <>
          <ActionButton
            done={status === 'resolved'}
            doneLabel={adminText(t, 'admin.actions.resolvedReport')}
            onClick={() => handleReportApprove(dispatch, item)}
          >
            {adminText(t, 'admin.actions.resolveReport')}
          </ActionButton>
          <ActionButton
            done={status === 'dismissed'}
            doneLabel={adminText(t, 'admin.actions.dismissed')}
            variant="danger"
            onClick={() => handleReportReject(dispatch, item)}
          >
            {adminText(t, 'admin.actions.dismiss')}
          </ActionButton>
        </>
      )
    case 'posts':
      return (
        <>
          <ActionButton
            done={status === 'published'}
            doneLabel={adminText(t, 'admin.actions.publishedMasc')}
            onClick={() => dispatch(moderatePost({ id: item.id, status: 'published' }))}
          >
            {adminText(t, 'admin.actions.publish')}
          </ActionButton>
          <ActionButton
            done={status === 'archived'}
            doneLabel={adminText(t, 'admin.actions.archivedMasc')}
            variant="danger"
            onClick={() => {
              if (window.confirm(adminText(t, 'admin.actions.archivePostConfirm'))) {
                dispatch(moderatePost({ id: item.id, status: 'archived' }))
              }
            }}
          >
            {adminText(t, 'admin.actions.archive')}
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={() => {
              if (window.confirm(adminText(t, 'admin.actions.deletePostConfirm'))) {
                dispatch(deletePost(item.id))
              }
            }}
          >
            {adminText(t, 'admin.actions.delete')}
          </ActionButton>
        </>
      )
    default:
      return null
  }
}

export function renderDetailActions({ actorId, actorRole, dispatch, item, kind, onSuspendUser, t }) {
  const reviewerId = actorId || 'admin'
  switch (normalizeAdminKind(kind)) {
    case 'transfer': {
      if (actorRole === 'moderator') return detailViewButton('transfer', item, t)
      const next = TRANSFER_TRANSITIONS[item.status]
      return (
        <>
          {next && (
            <Button onClick={() => dispatch(moderateTransfer({ id: item.id, status: next }))}>
              {adminText(t, 'admin.actions.advanceTo', { next })}
            </Button>
          )}
          {detailViewButton('transfer', item, t)}
        </>
      )
    }
    case 'businesses':
    case 'listings':
    case 'jobs':
    case 'events':
    case 'parcels':
    case 'posts':
    case 'report':
      return (
        <>
          {contentActions(normalizeAdminKind(kind) === 'report' ? 'reports' : normalizeAdminKind(kind), dispatch, item, t)}
          {detailViewButton(kind, item, t)}
        </>
      )
    case 'user':
      if (actorRole === 'moderator') return detailViewButton('user', item, t)
      return (
        <>
          <Button
            variant="secondary"
            onClick={() =>
              dispatchUserRole(dispatch, { actorRole, id: item.id, role: 'moderator', t })
            }
          >
            {adminText(t, 'admin.actions.promoteModerator')}
          </Button>
          <Button
            variant="secondary"
            disabled={actorRole !== 'superadmin'}
            onClick={() => dispatchUserRole(dispatch, { actorRole, id: item.id, role: 'admin', t })}
          >
            {adminText(t, 'admin.actions.promoteAdmin')}
          </Button>
          <Button
            variant={item.status === 'suspended' ? 'secondary' : 'danger'}
            onClick={() => onSuspendUser(item)}
          >
            {item.status === 'suspended'
              ? adminText(t, 'admin.actions.reactivate')
              : adminText(t, 'admin.actions.suspend')}
          </Button>
          {detailViewButton('user', item, t)}
        </>
      )
    case 'verification':
      if (actorRole === 'moderator') return detailViewButton('verification', item, t)
      return (
        <>
          <ActionButton
            done={item.status === 'verified'}
            doneLabel={adminText(t, 'admin.actions.approved')}
            onClick={() =>
              dispatch(
                updateVerificationStatus({
                  id: item.id,
                  status: 'verified',
                  reviewedBy: reviewerId,
                }),
              )
            }
          >
            {adminText(t, 'admin.actions.approve')}
          </ActionButton>
          <ActionButton
            done={item.status === 'rejected'}
            doneLabel={adminText(t, 'admin.actions.rejected')}
            variant="danger"
            onClick={() => {
              const reviewNote =
                typeof window !== 'undefined'
                  ? window.prompt(adminText(t, 'admin.actions.rejectPrompt'), item.reviewNote || '') || ''
                  : ''
              dispatch(
                updateVerificationStatus({
                  id: item.id,
                  status: 'rejected',
                  reviewedBy: reviewerId,
                  reviewNote,
                }),
              )
            }}
          >
            {adminText(t, 'admin.actions.reject')}
          </ActionButton>
          {detailViewButton('verification', item, t)}
        </>
      )
    case 'businessDocument':
      if (actorRole === 'moderator') return detailViewButton('businessDocument', item, t)
      return (
        <>
          <ActionButton
            done={item.status === 'verified'}
            doneLabel={adminText(t, 'admin.actions.approved')}
            onClick={() =>
              dispatch(
                updateBusinessDocumentStatus({
                  id: item.id,
                  status: 'verified',
                  reviewedBy: reviewerId,
                  reviewNote: '',
                }),
              )
            }
          >
            {adminText(t, 'admin.actions.approve')}
          </ActionButton>
          <ActionButton
            done={item.status === 'rejected'}
            doneLabel={adminText(t, 'admin.actions.rejected')}
            variant="danger"
            onClick={() => {
              const reviewNote =
                typeof window !== 'undefined'
                  ? window.prompt(adminText(t, 'admin.actions.rejectPrompt'), item.reviewNote || '') || ''
                  : ''
              dispatch(
                updateBusinessDocumentStatus({
                  id: item.id,
                  status: 'rejected',
                  reviewedBy: reviewerId,
                  reviewNote,
                }),
              )
            }}
          >
            {adminText(t, 'admin.actions.reject')}
          </ActionButton>
          {detailViewButton('businessDocument', item, t)}
        </>
      )
    case 'dispute':
      return (
        <>
          <Button onClick={() => dispatch(updateDisputeStatus({ id: item.id, status: 'resolved', updatedBy: 'admin' }))}>
            {adminText(t, 'admin.actions.resolve')}
          </Button>
          <Button variant="secondary" onClick={() => dispatch(updateDisputeStatus({ id: item.id, status: 'closed', updatedBy: 'admin' }))}>
            {adminText(t, 'admin.actions.close')}
          </Button>
          {detailViewButton('dispute', item, t)}
        </>
      )
    case 'review':
      if (item.disputeStatus === REVIEW_DISPUTE_STATUS.PENDING) {
        return (
          <>
            <Button
              variant="danger"
              onClick={() =>
                dispatch(
                  moderateReview({
                    id: item.id,
                    status: 'hidden',
                    disputeStatus: REVIEW_DISPUTE_STATUS.UPHELD,
                    moderatedBy: 'admin',
                  }),
                )
              }
            >
              {adminText(t, 'admin.actions.removeReview')}
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  moderateReview({
                    id: item.id,
                    status: 'published',
                    disputeStatus: REVIEW_DISPUTE_STATUS.REJECTED,
                    moderatedBy: 'admin',
                  }),
                )
              }
            >
              {adminText(t, 'admin.actions.rejectContest')}
            </Button>
            {detailViewButton('review', item, t)}
          </>
        )
      }
      return (
        <>
          <Button onClick={() => dispatch(moderateReview({ id: item.id, status: 'published', moderatedBy: 'admin' }))}>
            {adminText(t, 'admin.actions.publish')}
          </Button>
          <Button variant="danger" onClick={() => dispatch(moderateReview({ id: item.id, status: 'hidden', moderatedBy: 'admin' }))}>
            {adminText(t, 'admin.actions.hide')}
          </Button>
          {detailViewButton('review', item, t)}
        </>
      )
    default:
      return null
  }
}
