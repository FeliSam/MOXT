/* eslint-disable react-refresh/only-export-components -- action helpers */
import { FiCheckCircle, FiX } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'
import { dispatchUserRole } from './promoteAdminUtils'
import { verifyUserEmailManually, verifyUserPhoneManually } from './adminVerifyContactUtils'
import { updateVerificationStatus, updateSubscriberReportStatus } from '../account/accountSlice'
import { updateBusinessDocumentStatus } from '../businesses/businessSlice'
import { BusinessAdminActions } from '../businesses/BusinessAdminActions'
import { updateDisputeStatus } from '../disputes/disputeSlice'
import { deleteEvent, moderateEvent, updateEventReportStatus } from '../events/eventSlice'
import { deleteJob, moderateJob, updateJobReportStatus } from '../jobs/jobSlice'
import {
  deleteListing,
  updateListingReportStatus,
  updateListingStatus,
} from '../marketplace/marketplaceSlice'
import { deleteParcel, updateParcelPassportStatus, updateParcelProofStatus, updateParcelStatus } from '../parcels/parcelSlice'
import { deletePost, moderatePost } from '../posts/postsSlice'
import { ReviewAdminActions } from '../reviews/ReviewAdminActions'
import { TRANSFER_TRANSITIONS } from '../transfers/transferConfig'
import { moderateTransfer } from '../transfers/transferSlice'
import { moderateOffer, moderateOrder } from '../p2p/p2pSlice'
import { normalizeAdminKind, normalizeReportType } from './adminLinkUtils'
import { adminText } from './adminI18n'
import { promptRejectReason } from './promptRejectReason'
import { ActionButton } from './AdminActionButton'
import { confirmAction } from '../../contexts/confirmBridge'

export { ActionButton }

function askConfirm(t, actionLabel, onConfirm) {
  confirmAction({
    title: adminText(t, 'admin.confirm.actionTitle'),
    description: adminText(t, 'admin.confirm.actionBody', { action: actionLabel }),
    onConfirm,
  })
}

export function confirmedClick(t, actionLabel, onConfirm) {
  return () => askConfirm(t, actionLabel, onConfirm)
}

function isParcelDocPending(status, hasFile) {
  if (status === 'pending_review') return true
  if (hasFile && status !== 'verified' && status !== 'rejected' && status !== 'missing') {
    return true
  }
  return false
}

/**
 * Actions passeport / billet — uniquement tant que le document est en attente.
 * Partagée entre la file « Documents colis » et la liste / détail contenu.
 */
export function parcelDocumentActions(dispatch, item, t) {
  const passportPending = isParcelDocPending(
    item.passportStatus,
    Boolean(item.passportProofUrl),
  )
  const proofPending = isParcelDocPending(item.proofStatus, Boolean(item.travelProofUrl))
  if (!passportPending && !proofPending) return null

  return (
    <>
      {passportPending ? (
        <>
          <ActionButton
            icon={FiCheckCircle}
            onClick={confirmedClick(t, adminText(t, 'admin.queues.validatePassport'), () =>
              dispatch(updateParcelPassportStatus({ id: item.id, status: 'verified' })),
            )}
          >
            {adminText(t, 'admin.queues.validatePassport')}
          </ActionButton>
          <ActionButton
            variant="danger"
            icon={FiX}
            onClick={confirmedClick(t, adminText(t, 'admin.queues.rejectPassport'), () =>
              dispatch(updateParcelPassportStatus({ id: item.id, status: 'rejected' })),
            )}
          >
            {adminText(t, 'admin.queues.rejectPassport')}
          </ActionButton>
        </>
      ) : null}
      {proofPending ? (
        <>
          <ActionButton
            icon={FiCheckCircle}
            onClick={confirmedClick(t, adminText(t, 'admin.queues.validateProof'), () =>
              dispatch(updateParcelProofStatus({ id: item.id, status: 'verified' })),
            )}
          >
            {adminText(t, 'admin.queues.validateProof')}
          </ActionButton>
          <ActionButton
            variant="danger"
            icon={FiX}
            onClick={confirmedClick(t, adminText(t, 'admin.queues.rejectProof'), () =>
              dispatch(updateParcelProofStatus({ id: item.id, status: 'rejected' })),
            )}
          >
            {adminText(t, 'admin.queues.rejectProof')}
          </ActionButton>
        </>
      ) : null}
    </>
  )
}

/** Resolve/close a dispute and unlock the linked P2P order when applicable. */
export function resolveDisputeAndUnlockOrder(dispatch, dispute, { status, actorId, actorRole }) {
  dispatch(updateDisputeStatus({ id: dispute.id, status, updatedBy: 'admin' }))
  if (dispute.relatedType !== 'p2p_order' || !dispute.relatedId) return
  const orderStatus = status === 'closed' ? 'cancelled' : 'waiting_payment'
  dispatch(
    moderateOrder({
      id: dispute.relatedId,
      status: orderStatus,
      actorId,
      actorRole: actorRole || 'admin',
      note: status === 'closed' ? 'dispute_closed_cancel' : 'dispute_resolved_restore',
    }),
  )
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
        <BusinessAdminActions business={item} dispatch={dispatch} t={t} />
      )
    case 'listings':
      return (
        <>
          <ActionButton
            done={status === 'active'}
            doneLabel={adminText(t, 'admin.actions.published')}
            onClick={confirmedClick(t, adminText(t, 'admin.actions.publish'), () =>
              dispatch(updateListingStatus({ id: item.id, status: 'active' })),
            )}
          >
            {adminText(t, 'admin.actions.publish')}
          </ActionButton>
          <ActionButton
            done={status === 'archived' || status === 'suspended'}
            doneLabel={adminText(t, 'admin.actions.archived')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.archive'), () =>
              dispatch(updateListingStatus({ id: item.id, status: 'archived' })),
            )}
          >
            {adminText(t, 'admin.actions.archive')}
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.deleteListingConfirm'), () =>
              dispatch(deleteListing({ id: item.id, ownerId: item.ownerId })),
            )}
          >
            {adminText(t, 'admin.actions.delete')}
          </ActionButton>
        </>
      )
    case 'jobs':
      return (
        <>
          <ActionButton
            done={status === 'active'}
            doneLabel={adminText(t, 'admin.actions.activated')}
            onClick={confirmedClick(t, adminText(t, 'admin.actions.activate'), () =>
              dispatch(moderateJob({ id: item.id, status: 'active' })),
            )}
          >
            {adminText(t, 'admin.actions.activate')}
          </ActionButton>
          <ActionButton
            done={status === 'archived'}
            doneLabel={adminText(t, 'admin.actions.archivedMasc')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.archive'), () =>
              dispatch(moderateJob({ id: item.id, status: 'archived' })),
            )}
          >
            {adminText(t, 'admin.actions.archive')}
          </ActionButton>
          <ActionButton
            done={status === 'rejected'}
            doneLabel={adminText(t, 'admin.actions.rejected')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.reject'), () =>
              dispatch(moderateJob({ id: item.id, status: 'rejected' })),
            )}
          >
            {adminText(t, 'admin.actions.reject')}
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.deleteJobConfirm'), () =>
              dispatch(deleteJob({ id: item.id, ownerId: item.ownerId })),
            )}
          >
            {adminText(t, 'admin.actions.delete')}
          </ActionButton>
        </>
      )
    case 'events':
      return (
        <>
          <ActionButton
            done={status === 'published'}
            doneLabel={adminText(t, 'admin.actions.publishedMasc')}
            onClick={confirmedClick(t, adminText(t, 'admin.actions.publish'), () =>
              dispatch(moderateEvent({ id: item.id, status: 'published' })),
            )}
          >
            {adminText(t, 'admin.actions.publish')}
          </ActionButton>
          <ActionButton
            done={status === 'archived'}
            doneLabel={adminText(t, 'admin.actions.archivedMasc')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.archive'), () =>
              dispatch(moderateEvent({ id: item.id, status: 'archived' })),
            )}
          >
            {adminText(t, 'admin.actions.archive')}
          </ActionButton>
          <ActionButton
            done={status === 'rejected'}
            doneLabel={adminText(t, 'admin.actions.rejectedMasc')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.reject'), () =>
              dispatch(moderateEvent({ id: item.id, status: 'rejected' })),
            )}
          >
            {adminText(t, 'admin.actions.reject')}
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.deleteEventConfirm'), () =>
              dispatch(deleteEvent({ id: item.id, ownerId: item.ownerId })),
            )}
          >
            {adminText(t, 'admin.actions.delete')}
          </ActionButton>
        </>
      )
    case 'parcels':
      return (
        <>
          <ActionButton
            done={status === 'active'}
            doneLabel={adminText(t, 'admin.actions.active')}
            onClick={confirmedClick(t, adminText(t, 'admin.actions.activate'), () =>
              dispatch(updateParcelStatus({ id: item.id, status: 'active' })),
            )}
          >
            {adminText(t, 'admin.actions.activate')}
          </ActionButton>
          <ActionButton
            done={status === 'archived'}
            doneLabel={adminText(t, 'admin.actions.archivedMasc')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.archive'), () =>
              dispatch(updateParcelStatus({ id: item.id, status: 'archived' })),
            )}
          >
            {adminText(t, 'admin.actions.archive')}
          </ActionButton>
          <ActionButton
            done={status === 'rejected'}
            doneLabel={adminText(t, 'admin.actions.rejectedMasc')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.rejectParcel'), () =>
              dispatch(updateParcelStatus({ id: item.id, status: 'rejected' })),
            )}
          >
            {adminText(t, 'admin.actions.rejectParcel')}
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.deleteParcelConfirm'), () =>
              dispatch(deleteParcel({ id: item.id, ownerId: item.ownerId })),
            )}
          >
            {adminText(t, 'admin.actions.delete')}
          </ActionButton>
          {parcelDocumentActions(dispatch, item, t)}
        </>
      )
    case 'reports':
      return (
        <>
          <ActionButton
            done={status === 'resolved'}
            doneLabel={adminText(t, 'admin.actions.resolvedReport')}
            onClick={confirmedClick(t, adminText(t, 'admin.actions.resolveReport'), () =>
              handleReportApprove(dispatch, item),
            )}
          >
            {adminText(t, 'admin.actions.resolveReport')}
          </ActionButton>
          <ActionButton
            done={status === 'dismissed'}
            doneLabel={adminText(t, 'admin.actions.dismissed')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.dismiss'), () =>
              handleReportReject(dispatch, item),
            )}
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
            onClick={confirmedClick(t, adminText(t, 'admin.actions.publish'), () =>
              dispatch(moderatePost({ id: item.id, status: 'published' })),
            )}
          >
            {adminText(t, 'admin.actions.publish')}
          </ActionButton>
          <ActionButton
            done={status === 'archived'}
            doneLabel={adminText(t, 'admin.actions.archivedMasc')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.archivePostConfirm'), () =>
              dispatch(moderatePost({ id: item.id, status: 'archived' })),
            )}
          >
            {adminText(t, 'admin.actions.archive')}
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.deletePostConfirm'), () =>
              dispatch(deletePost(item.id)),
            )}
          >
            {adminText(t, 'admin.actions.delete')}
          </ActionButton>
        </>
      )
    default:
      return null
  }
}

export function renderDetailActions({ actorId, actorRole, dispatch, item, kind, onSuspendUser, onPurgeUser, t }) {
  const reviewerId = actorId || 'admin'
  switch (normalizeAdminKind(kind)) {
    case 'transfer': {
      if (actorRole === 'moderator') return null
      const next = TRANSFER_TRANSITIONS[item.status]
      const advanceLabel = adminText(t, 'admin.actions.advanceTo', { next })
      return next ? (
        <Button
          onClick={confirmedClick(t, advanceLabel, () =>
            dispatch(
              moderateTransfer({
                id: item.id,
                status: next,
                actorId: reviewerId,
                actorRole: actorRole || 'admin',
                proof:
                  next === 'paid_out'
                    ? item.businessProof || {
                        name: 'admin-advance.pdf',
                        uploadedAt: new Date().toISOString(),
                      }
                    : undefined,
              }),
            ),
          )}
        >
          {advanceLabel}
        </Button>
      ) : null
    }
    case 'p2p_offer':
      return (
        <>
          {item.status === 'active' ? (
            <Button
              variant="secondary"
              onClick={confirmedClick(t, adminText(t, 'admin.actions.archive'), () =>
                dispatch(moderateOffer({ id: item.id, status: 'archived' })),
              )}
            >
              {adminText(t, 'admin.actions.archive')}
            </Button>
          ) : null}
          {item.status === 'archived' ? (
            <Button
              onClick={confirmedClick(t, adminText(t, 'admin.actions.reactivate'), () =>
                dispatch(moderateOffer({ id: item.id, status: 'active' })),
              )}
            >
              {adminText(t, 'admin.actions.reactivate')}
            </Button>
          ) : null}
        </>
      )
    case 'p2p_order':
      return (
        <>
          {item.status === 'disputed' ? (
            <Button
              onClick={confirmedClick(t, adminText(t, 'admin.p2p.restoreOrder'), () =>
                dispatch(
                  moderateOrder({
                    id: item.id,
                    status: 'waiting_payment',
                    actorId: reviewerId,
                    actorRole: actorRole || 'admin',
                    note: 'admin_restore',
                  }),
                ),
              )}
            >
              {adminText(t, 'admin.p2p.restoreOrder')}
            </Button>
          ) : null}
          {!['completed', 'cancelled', 'disputed'].includes(item.status) ? (
            <Button
              variant="secondary"
              onClick={confirmedClick(t, adminText(t, 'admin.p2p.markDisputed'), () =>
                dispatch(
                  moderateOrder({
                    id: item.id,
                    status: 'disputed',
                    actorId: reviewerId,
                    actorRole: actorRole || 'admin',
                    note: 'admin_dispute',
                  }),
                ),
              )}
            >
              {adminText(t, 'admin.p2p.markDisputed')}
            </Button>
          ) : null}
          {!['completed', 'cancelled'].includes(item.status) ? (
            <>
              <Button
                onClick={confirmedClick(t, adminText(t, 'admin.p2p.completeOrder'), () =>
                  dispatch(
                    moderateOrder({
                      id: item.id,
                      status: 'completed',
                      actorId: reviewerId,
                      actorRole: actorRole || 'admin',
                      note: 'admin_complete',
                    }),
                  ),
                )}
              >
                {adminText(t, 'admin.p2p.completeOrder')}
              </Button>
              <Button
                variant="danger"
                onClick={confirmedClick(t, adminText(t, 'admin.p2p.cancelOrder'), () =>
                  dispatch(
                    moderateOrder({
                      id: item.id,
                      status: 'cancelled',
                      actorId: reviewerId,
                      actorRole: actorRole || 'admin',
                      note: 'admin_cancel',
                    }),
                  ),
                )}
              >
                {adminText(t, 'admin.p2p.cancelOrder')}
              </Button>
            </>
          ) : null}
        </>
      )
    case 'businesses':
    case 'listings':
    case 'jobs':
    case 'events':
    case 'parcels':
    case 'posts':
    case 'report':
      return contentActions(
        normalizeAdminKind(kind) === 'report' ? 'reports' : normalizeAdminKind(kind),
        dispatch,
        item,
        t,
      )
    case 'user':
      if (actorRole === 'moderator') return null
      return (
        <>
          <ActionButton
            done={item.role === 'moderator'}
            doneLabel={adminText(t, 'admin.actions.moderatorPromoted')}
            variant="secondary"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.promoteModerator'), () =>
              dispatchUserRole(dispatch, { actorRole, id: item.id, role: 'moderator', t }),
            )}
          >
            {adminText(t, 'admin.actions.promoteModerator')}
          </ActionButton>
          <ActionButton
            done={item.role === 'admin'}
            doneLabel={adminText(t, 'admin.actions.adminPromoted')}
            variant="secondary"
            disabled={actorRole !== 'superadmin'}
            onClick={confirmedClick(t, adminText(t, 'admin.actions.promoteAdmin'), () =>
              dispatchUserRole(dispatch, { actorRole, id: item.id, role: 'admin', t }),
            )}
          >
            {adminText(t, 'admin.actions.promoteAdmin')}
          </ActionButton>
          <Button
            variant={item.status === 'suspended' ? 'secondary' : 'danger'}
            onClick={confirmedClick(
              t,
              item.status === 'suspended'
                ? adminText(t, 'admin.actions.reactivate')
                : adminText(t, 'admin.actions.suspend'),
              () => onSuspendUser(item),
            )}
          >
            {item.status === 'suspended'
              ? adminText(t, 'admin.actions.reactivate')
              : adminText(t, 'admin.actions.suspend')}
          </Button>
          {item.status === 'suspended' && item.id !== actorId && item.role !== 'superadmin' ? (
            <Button
              variant="danger"
              onClick={() => onPurgeUser?.(item)}
            >
              {adminText(t, 'admin.actions.purgeAccount')}
            </Button>
          ) : null}
          <ActionButton
            done={item.phoneVerified}
            doneLabel={adminText(t, 'admin.actions.phoneVerified')}
            onClick={confirmedClick(
              t,
              adminText(t, 'admin.actions.verifyPhoneConfirm', { phone: item.phone }),
              () => verifyUserPhoneManually(dispatch, { id: item.id, t }),
            )}
          >
            {adminText(t, 'admin.actions.verifyPhone')}
          </ActionButton>
          <ActionButton
            done={item.emailVerified}
            doneLabel={adminText(t, 'admin.actions.emailVerified')}
            variant="secondary"
            onClick={confirmedClick(
              t,
              adminText(t, 'admin.actions.verifyEmailConfirm', { email: item.email }),
              () => verifyUserEmailManually(dispatch, { id: item.id, t }),
            )}
          >
            {adminText(t, 'admin.actions.verifyEmail')}
          </ActionButton>
        </>
      )
    case 'verification':
      if (actorRole === 'moderator') return null
      return (
        <>
          <ActionButton
            done={item.status === 'verified'}
            doneLabel={adminText(t, 'admin.actions.approved')}
            onClick={confirmedClick(t, adminText(t, 'admin.actions.approve'), () =>
              dispatch(
                updateVerificationStatus({
                  id: item.id,
                  status: 'verified',
                  reviewedBy: reviewerId,
                }),
              ),
            )}
          >
            {adminText(t, 'admin.actions.approve')}
          </ActionButton>
          <ActionButton
            done={item.status === 'rejected'}
            doneLabel={adminText(t, 'admin.actions.rejected')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.reject'), () => {
              const reviewNote = promptRejectReason(t, item.reviewNote || '')
              if (!reviewNote) return
              dispatch(
                updateVerificationStatus({
                  id: item.id,
                  status: 'rejected',
                  reviewedBy: reviewerId,
                  reviewNote,
                }),
              )
            })}
          >
            {adminText(t, 'admin.actions.reject')}
          </ActionButton>
        </>
      )
    case 'businessDocument':
      if (actorRole === 'moderator') return null
      return (
        <>
          <ActionButton
            done={item.status === 'verified'}
            doneLabel={adminText(t, 'admin.actions.approved')}
            onClick={confirmedClick(t, adminText(t, 'admin.actions.approve'), () =>
              dispatch(
                updateBusinessDocumentStatus({
                  id: item.id,
                  status: 'verified',
                  reviewedBy: reviewerId,
                  reviewNote: '',
                }),
              ),
            )}
          >
            {adminText(t, 'admin.actions.approve')}
          </ActionButton>
          <ActionButton
            done={item.status === 'rejected'}
            doneLabel={adminText(t, 'admin.actions.rejected')}
            variant="danger"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.reject'), () => {
              const reviewNote = promptRejectReason(t, item.reviewNote || '')
              if (!reviewNote) return
              dispatch(
                updateBusinessDocumentStatus({
                  id: item.id,
                  status: 'rejected',
                  reviewedBy: reviewerId,
                  reviewNote,
                }),
              )
            })}
          >
            {adminText(t, 'admin.actions.reject')}
          </ActionButton>
        </>
      )
    case 'dispute':
      return (
        <>
          <Button
            onClick={confirmedClick(t, adminText(t, 'admin.actions.resolve'), () =>
              resolveDisputeAndUnlockOrder(dispatch, item, {
                status: 'resolved',
                actorId: reviewerId,
                actorRole: actorRole || 'admin',
              }),
            )}
          >
            {adminText(t, 'admin.actions.resolve')}
          </Button>
          <Button
            variant="secondary"
            onClick={confirmedClick(t, adminText(t, 'admin.actions.close'), () =>
              resolveDisputeAndUnlockOrder(dispatch, item, {
                status: 'closed',
                actorId: reviewerId,
                actorRole: actorRole || 'admin',
              }),
            )}
          >
            {adminText(t, 'admin.actions.close')}
          </Button>
        </>
      )
    case 'review':
      return (
        <ReviewAdminActions
          review={item}
          dispatch={dispatch}
          t={t}
          moderatorId={reviewerId}
        />
      )
    default:
      return null
  }
}
