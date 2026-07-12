import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { updateVerificationStatus, updateSubscriberReportStatus } from '../account/accountSlice'
import { updateUserRole } from '../administration/administrationSlice'
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
import { FiEye } from 'react-icons/fi'
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
    dispatch(updateListingStatus({ id: relatedId, status: 'suspended' }))
    return
  }
  if (reportType === 'job') {
    dispatch(updateJobReportStatus({ id: item.id, status: 'resolved' }))
    dispatch(moderateJob({ id: relatedId, status: 'rejected' }))
    return
  }
  if (reportType === 'event') {
    dispatch(updateEventReportStatus({ id: item.id, status: 'resolved' }))
    dispatch(moderateEvent({ id: relatedId, status: 'rejected' }))
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
  switch (contentView) {
    case 'businesses':
      return (
        <>
          <Button onClick={() => dispatch(moderateBusiness({ id: item.id, status: 'verified' }))}>Valider</Button>
          <Button variant="danger" onClick={() => dispatch(moderateBusiness({ id: item.id, status: 'rejected' }))}>Refuser</Button>
        </>
      )
    case 'listings':
      return (
        <>
          <Button onClick={() => dispatch(updateListingStatus({ id: item.id, status: 'active' }))}>Publier</Button>
          <Button variant="danger" onClick={() => dispatch(updateListingStatus({ id: item.id, status: 'archived' }))}>Archiver</Button>
        </>
      )
    case 'jobs':
      return (
        <>
          <Button onClick={() => dispatch(moderateJob({ id: item.id, status: 'active' }))}>Activer</Button>
          <Button variant="danger" onClick={() => dispatch(moderateJob({ id: item.id, status: 'rejected' }))}>Refuser</Button>
        </>
      )
    case 'events':
      return (
        <>
          <Button onClick={() => dispatch(moderateEvent({ id: item.id, status: 'published' }))}>Publier</Button>
          <Button variant="danger" onClick={() => dispatch(moderateEvent({ id: item.id, status: 'rejected' }))}>Refuser</Button>
        </>
      )
    case 'parcels':
      return (
        <>
          <Button onClick={() => dispatch(updateParcelStatus({ id: item.id, status: 'active' }))}>Activer</Button>
          <Button variant="danger" onClick={() => dispatch(updateParcelStatus({ id: item.id, status: 'archived' }))}>Archiver</Button>
        </>
      )
    case 'reports':
      return (
        <>
          <Button onClick={() => handleReportApprove(dispatch, item)}>Traiter</Button>
          <Button variant="danger" onClick={() => handleReportReject(dispatch, item)}>Ignorer</Button>
        </>
      )
    default:
      return null
  }
}

export function renderDetailActions({ dispatch, item, kind, onSuspendUser }) {
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
      return (
        <>
          <Button onClick={() => dispatch(moderateBusiness({ id: item.id, status: 'verified' }))}>Valider</Button>
          <Button variant="danger" onClick={() => dispatch(moderateBusiness({ id: item.id, status: 'rejected' }))}>Refuser</Button>
          {detailViewButton('businesses', item)}
        </>
      )
    case 'listings':
      return (
        <>
          <Button onClick={() => dispatch(updateListingStatus({ id: item.id, status: 'active' }))}>Publier</Button>
          <Button variant="danger" onClick={() => dispatch(updateListingStatus({ id: item.id, status: 'archived' }))}>Archiver</Button>
          {detailViewButton('listings', item)}
        </>
      )
    case 'jobs':
      return (
        <>
          <Button onClick={() => dispatch(moderateJob({ id: item.id, status: 'active' }))}>Activer</Button>
          <Button variant="danger" onClick={() => dispatch(moderateJob({ id: item.id, status: 'rejected' }))}>Refuser</Button>
          {detailViewButton('jobs', item)}
        </>
      )
    case 'events':
      return (
        <>
          <Button onClick={() => dispatch(moderateEvent({ id: item.id, status: 'published' }))}>Publier</Button>
          <Button variant="danger" onClick={() => dispatch(moderateEvent({ id: item.id, status: 'rejected' }))}>Refuser</Button>
          {detailViewButton('events', item)}
        </>
      )
    case 'parcels':
      return (
        <>
          <Button onClick={() => dispatch(updateParcelStatus({ id: item.id, status: 'active' }))}>Activer</Button>
          <Button variant="danger" onClick={() => dispatch(updateParcelStatus({ id: item.id, status: 'archived' }))}>Archiver</Button>
          {detailViewButton('parcels', item)}
        </>
      )
    case 'user':
      return (
        <>
          <Button variant="secondary" onClick={() => dispatch(updateUserRole({ id: item.id, role: 'admin' }))}>Passer admin</Button>
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
          <Button onClick={() => dispatch(updateVerificationStatus({ id: item.id, status: 'verified', reviewedBy: 'admin' }))}>Valider</Button>
          <Button variant="danger" onClick={() => dispatch(updateVerificationStatus({ id: item.id, status: 'rejected', reviewedBy: 'admin' }))}>Refuser</Button>
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
    case 'report':
      return (
        <>
          <Button onClick={() => handleReportApprove(dispatch, item)}>Traiter</Button>
          <Button variant="danger" onClick={() => handleReportReject(dispatch, item)}>Ignorer</Button>
          {detailViewButton('report', item)}
        </>
      )
    default:
      return null
  }
}
