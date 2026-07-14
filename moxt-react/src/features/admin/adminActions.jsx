import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { dispatchUserRole } from './promoteAdminUtils'
import { updateVerificationStatus, updateSubscriberReportStatus } from '../account/accountSlice'
import { moderateBusiness } from '../businesses/businessSlice'
import { updateDisputeStatus } from '../disputes/disputeSlice'
import { moderateEvent, updateEventReportStatus } from '../events/eventSlice'
import { moderateJob, updateJobReportStatus } from '../jobs/jobSlice'
import {
  updateListingReportStatus,
  updateListingStatus,
} from '../marketplace/marketplaceSlice'
import { updateParcelStatus } from '../parcels/parcelSlice'
import { moderateReview } from '../reviews/reviewSlice'
import { TRANSFER_TRANSITIONS } from '../transfers/transferConfig'
import { moderateTransfer } from '../transfers/transferSlice'
import { REVIEW_DISPUTE_STATUS } from '@moxt/shared/utils/reviewUtils.js'
import { FiCheck, FiEye } from 'react-icons/fi'
import { adminDetailLink, normalizeAdminKind, normalizeReportType } from './adminLinkUtils'

function detailViewButton(kind, item) {
  const link = adminDetailLink(kind, item)
  if (!link) return null
  return (
    <Link to={link}>
      <Button variant="secondary" icon={FiEye}>Voir</Button>
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

export function contentActions(contentView, dispatch, item) {
  const status = item.effectiveStatus || item.status

  switch (contentView) {
    case 'businesses':
      return (
        <>
          <ActionButton
            done={status === 'verified'}
            doneLabel="Validée"
            onClick={() => dispatch(moderateBusiness({ id: item.id, status: 'verified' }))}
          >
            Valider
          </ActionButton>
          <ActionButton
            done={status === 'rejected'}
            doneLabel="Refusée"
            variant="danger"
            onClick={() => dispatch(moderateBusiness({ id: item.id, status: 'rejected' }))}
          >
            Refuser
          </ActionButton>
        </>
      )
    case 'listings':
      return (
        <>
          <ActionButton
            done={status === 'active'}
            doneLabel="Publiée"
            onClick={() => dispatch(updateListingStatus({ id: item.id, status: 'active' }))}
          >
            Publier
          </ActionButton>
          <ActionButton
            done={status === 'archived' || status === 'suspended'}
            doneLabel="Archivée"
            variant="danger"
            onClick={() => dispatch(updateListingStatus({ id: item.id, status: 'archived' }))}
          >
            Archiver
          </ActionButton>
        </>
      )
    case 'jobs':
      return (
        <>
          <ActionButton
            done={status === 'active'}
            doneLabel="Activée"
            onClick={() => dispatch(moderateJob({ id: item.id, status: 'active' }))}
          >
            Activer
          </ActionButton>
          <ActionButton
            done={status === 'rejected'}
            doneLabel="Refusée"
            variant="danger"
            onClick={() => dispatch(moderateJob({ id: item.id, status: 'rejected' }))}
          >
            Refuser
          </ActionButton>
        </>
      )
    case 'events':
      return (
        <>
          <ActionButton
            done={status === 'published'}
            doneLabel="Publié"
            onClick={() => dispatch(moderateEvent({ id: item.id, status: 'published' }))}
          >
            Publier
          </ActionButton>
          <ActionButton
            done={status === 'rejected' || status === 'archived'}
            doneLabel="Refusé"
            variant="danger"
            onClick={() => dispatch(moderateEvent({ id: item.id, status: 'rejected' }))}
          >
            Refuser
          </ActionButton>
        </>
      )
    case 'parcels':
      return (
        <>
          <ActionButton
            done={status === 'active'}
            doneLabel="Actif"
            onClick={() => dispatch(updateParcelStatus({ id: item.id, status: 'active' }))}
          >
            Activer
          </ActionButton>
          <ActionButton
            done={status === 'archived'}
            doneLabel="Archivé"
            variant="danger"
            onClick={() => dispatch(updateParcelStatus({ id: item.id, status: 'archived' }))}
          >
            Archiver
          </ActionButton>
        </>
      )
    case 'reports':
      return (
        <>
          <ActionButton
            done={status === 'resolved'}
            doneLabel="Traité"
            onClick={() => handleReportApprove(dispatch, item)}
          >
            Traiter
          </ActionButton>
          <ActionButton
            done={status === 'dismissed'}
            doneLabel="Ignoré"
            variant="danger"
            onClick={() => handleReportReject(dispatch, item)}
          >
            Ignorer
          </ActionButton>
        </>
      )
    default:
      return null
  }
}

export function renderDetailActions({ actorRole, dispatch, item, kind, onSuspendUser }) {
  switch (normalizeAdminKind(kind)) {
    case 'transfer': {
      const next = TRANSFER_TRANSITIONS[item.status]
      return (
        <>
          {next && <Button onClick={() => dispatch(moderateTransfer({ id: item.id, status: next }))}>Passer a {next}</Button>}
          {detailViewButton('transfer', item)}
        </>
      )
    }
    case 'businesses':
    case 'listings':
    case 'jobs':
    case 'events':
    case 'parcels':
    case 'report':
      return (
        <>
          {contentActions(normalizeAdminKind(kind) === 'report' ? 'reports' : normalizeAdminKind(kind), dispatch, item)}
          {detailViewButton(kind, item)}
        </>
      )
    case 'user':
      return (
        <>
          <Button
            variant="secondary"
            disabled={actorRole !== 'superadmin'}
            onClick={() => dispatchUserRole(dispatch, { actorRole, id: item.id, role: 'admin' })}
          >
            Passer admin
          </Button>
          <Button
            variant={item.status === 'suspended' ? 'secondary' : 'danger'}
            onClick={() => onSuspendUser(item)}
          >
            {item.status === 'suspended' ? 'Reactiver' : 'Suspendre'}
          </Button>
          {detailViewButton('user', item)}
        </>
      )
    case 'verification':
      return (
        <>
          <ActionButton
            done={item.status === 'verified'}
            doneLabel="Validée"
            onClick={() => dispatch(updateVerificationStatus({ id: item.id, status: 'verified', reviewedBy: 'admin' }))}
          >
            Valider
          </ActionButton>
          <ActionButton
            done={item.status === 'rejected'}
            doneLabel="Refusée"
            variant="danger"
            onClick={() => dispatch(updateVerificationStatus({ id: item.id, status: 'rejected', reviewedBy: 'admin' }))}
          >
            Refuser
          </ActionButton>
          {detailViewButton('verification', item)}
        </>
      )
    case 'dispute':
      return (
        <>
          <Button onClick={() => dispatch(updateDisputeStatus({ id: item.id, status: 'resolved', updatedBy: 'admin' }))}>Resoudre</Button>
          <Button variant="secondary" onClick={() => dispatch(updateDisputeStatus({ id: item.id, status: 'closed', updatedBy: 'admin' }))}>Cloturer</Button>
          {detailViewButton('dispute', item)}
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
              Retirer l&apos;avis
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
              Refuser la contestation
            </Button>
            {detailViewButton('review', item)}
          </>
        )
      }
      return (
        <>
          <Button onClick={() => dispatch(moderateReview({ id: item.id, status: 'published', moderatedBy: 'admin' }))}>Publier</Button>
          <Button variant="danger" onClick={() => dispatch(moderateReview({ id: item.id, status: 'hidden', moderatedBy: 'admin' }))}>Masquer</Button>
          {detailViewButton('review', item)}
        </>
      )
    default:
      return null
  }
}
