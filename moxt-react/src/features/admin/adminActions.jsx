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
import { FiEye } from 'react-icons/fi'

export function handleReportApprove(dispatch, item) {
  if (item.reportType === 'listing') {
    dispatch(updateListingReportStatus({ id: item.id, status: 'resolved' }))
    dispatch(updateListingStatus({ id: item.relatedId, status: 'suspended' }))
    return
  }
  if (item.reportType === 'job') {
    dispatch(updateJobReportStatus({ id: item.id, status: 'resolved' }))
    dispatch(moderateJob({ id: item.relatedId, status: 'rejected' }))
    return
  }
  if (item.reportType === 'event') {
    dispatch(updateEventReportStatus({ id: item.id, status: 'resolved' }))
    dispatch(moderateEvent({ id: item.relatedId, status: 'rejected' }))
    return
  }
  if (item.reportType === 'subscriber') {
    dispatch(updateSubscriberReportStatus({ id: item.id, status: 'resolved' }))
  }
}

export function handleReportReject(dispatch, item) {
  if (item.reportType === 'listing') {
    dispatch(updateListingReportStatus({ id: item.id, status: 'dismissed' }))
    return
  }
  if (item.reportType === 'job') {
    dispatch(updateJobReportStatus({ id: item.id, status: 'dismissed' }))
    return
  }
  if (item.reportType === 'event') {
    dispatch(updateEventReportStatus({ id: item.id, status: 'dismissed' }))
    return
  }
  if (item.reportType === 'subscriber') {
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
    default:
      return null
  }
}

export function renderDetailActions({ dispatch, item, kind, onSuspendUser }) {
  switch (kind) {
    case 'transfer': {
      const next = TRANSFER_TRANSITIONS[item.status]
      return (
        <>
          {next && <Button onClick={() => dispatch(moderateTransfer({ id: item.id, status: next }))}>Passer a {next}</Button>}
          <Link to={`/transfers/${item.id}`}><Button variant="secondary" icon={FiEye}>Voir</Button></Link>
        </>
      )
    }
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
        </>
      )
    case 'verification':
      return (
        <>
          <Button onClick={() => dispatch(updateVerificationStatus({ id: item.id, status: 'verified', reviewedBy: 'admin' }))}>Valider</Button>
          <Button variant="danger" onClick={() => dispatch(updateVerificationStatus({ id: item.id, status: 'rejected', reviewedBy: 'admin' }))}>Refuser</Button>
        </>
      )
    case 'dispute':
      return (
        <>
          <Button onClick={() => dispatch(updateDisputeStatus({ id: item.id, status: 'resolved', updatedBy: 'admin' }))}>Resoudre</Button>
          <Button variant="secondary" onClick={() => dispatch(updateDisputeStatus({ id: item.id, status: 'closed', updatedBy: 'admin' }))}>Cloturer</Button>
        </>
      )
    case 'review':
      return (
        <>
          <Button onClick={() => dispatch(moderateReview({ id: item.id, status: 'published', moderatedBy: 'admin' }))}>Publier</Button>
          <Button variant="danger" onClick={() => dispatch(moderateReview({ id: item.id, status: 'hidden', moderatedBy: 'admin' }))}>Masquer</Button>
        </>
      )
    case 'report':
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
