import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiStar,
  FiTrash2,
  FiUserCheck,
  FiX,
} from 'react-icons/fi'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { updateVerificationStatus } from '../../account/accountSlice'
import { updateDisputeStatus } from '../../disputes/disputeSlice'
import { moderateReview } from '../../reviews/reviewSlice'
import { REVIEW_DISPUTE_STATUS } from '@moxt/shared/utils/reviewUtils.js'
import { handleReportApprove, handleReportReject } from '../adminActions'
import { CARD, ITEM } from '../adminConfig'
import { Empty, SectionTitle } from './AdminShared'

function QueueSection({ icon, items, kind, label, renderActions, renderMeta, setSelected }) {
  return (
    <div className={`${CARD} p-5 grid gap-4`}>
      <SectionTitle icon={icon} label={label} count={items.length} tone={items.length ? 'warning' : 'success'} />
      {items.length ? (
        items.map((item) => (
          <div key={item.id} className={`${ITEM} grid gap-3`}>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected({ kind, item })}
                className="min-w-0 flex-1 text-left hover:text-brand-700"
              >
                <strong className="block text-sm">{item.reason || item.comment || item.subject || item.id}</strong>
                <p className="text-xs text-[var(--app-text-muted)]">{renderMeta(item)}</p>
              </button>
              <Badge>{item.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">{renderActions(item)}</div>
          </div>
        ))
      ) : (
        <Empty label="Aucun element." icon={icon} />
      )}
    </div>
  )
}

export function AdminQueuesPanel({ dispatch, queues, setSelected }) {
  return (
    <div className="grid gap-5">
      <QueueSection
        icon={FiTrash2}
        items={queues.accountDeletions}
        label="Suppressions de compte"
        kind="accountDeletion"
        setSelected={setSelected}
        renderMeta={(item) => `${item.userName || item.userId}${item.userEmail ? ` · ${item.userEmail}` : ''}`}
        renderActions={(item) => (
          <Button
            variant="secondary"
            onClick={() =>
              setSelected({
                kind: 'user',
                item: { id: item.userId, status: 'pending_deletion' },
              })
            }
          >
            Voir le profil
          </Button>
        )}
      />
      <QueueSection
        icon={FiUserCheck}
        items={queues.verifications}
        label="Verifications d'identite"
        kind="verification"
        setSelected={setSelected}
        renderMeta={(i) => `Niveau ${i.level} · ${i.userId}`}
        renderActions={(i) => (
          <>
            <Button icon={FiCheckCircle} onClick={() => dispatch(updateVerificationStatus({ id: i.id, status: 'verified', reviewedBy: 'admin' }))}>Valider</Button>
            <Button variant="danger" icon={FiX} onClick={() => dispatch(updateVerificationStatus({ id: i.id, status: 'rejected', reviewedBy: 'admin' }))}>Refuser</Button>
          </>
        )}
      />
      <QueueSection
        icon={FiAlertCircle}
        items={queues.disputes}
        label="Litiges"
        kind="dispute"
        setSelected={setSelected}
        renderMeta={(i) => `${i.relatedType} · ${i.relatedId}`}
        renderActions={(i) => (
          <>
            <Button onClick={() => dispatch(updateDisputeStatus({ id: i.id, status: 'resolved', updatedBy: 'admin' }))}>Resoudre</Button>
            <Button variant="secondary" onClick={() => dispatch(updateDisputeStatus({ id: i.id, status: 'closed', updatedBy: 'admin' }))}>Cloturer</Button>
          </>
        )}
      />
      <QueueSection
        icon={FiStar}
        items={queues.contestedReviews}
        label="Avis contestés"
        kind="contestedReview"
        setSelected={setSelected}
        renderMeta={(i) => `${i.targetType} · ${i.authorName || i.authorId}`}
        renderActions={(i) => (
          <>
            <Button
              variant="danger"
              onClick={() =>
                dispatch(
                  moderateReview({
                    id: i.id,
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
                    id: i.id,
                    status: 'published',
                    disputeStatus: REVIEW_DISPUTE_STATUS.REJECTED,
                    moderatedBy: 'admin',
                  }),
                )
              }
            >
              Refuser la contestation
            </Button>
          </>
        )}
      />
      <QueueSection
        icon={FiStar}
        items={queues.reviews}
        label="Avis en attente"
        kind="review"
        setSelected={setSelected}
        renderMeta={(i) => `${i.targetType} · ${i.rating || 0}/5`}
        renderActions={(i) => (
          <>
            <Button onClick={() => dispatch(moderateReview({ id: i.id, status: 'published', moderatedBy: 'admin' }))}>Publier</Button>
            <Button variant="danger" onClick={() => dispatch(moderateReview({ id: i.id, status: 'hidden', moderatedBy: 'admin' }))}>Masquer</Button>
          </>
        )}
      />
      <QueueSection
        icon={FiAlertTriangle}
        items={queues.reports}
        label="Signalements"
        kind="report"
        setSelected={setSelected}
        renderMeta={(i) => `${i.reportType} · ${i.relatedId}`}
        renderActions={(i) => (
          <>
            <Button onClick={() => handleReportApprove(dispatch, i)}>Traiter</Button>
            <Button variant="danger" onClick={() => handleReportReject(dispatch, i)}>Ignorer</Button>
          </>
        )}
      />
    </div>
  )
}
