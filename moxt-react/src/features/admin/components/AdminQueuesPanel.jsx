import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiHeadphones,
  FiPackage,
  FiStar,
  FiTrash2,
  FiUserCheck,
  FiX,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { updateVerificationStatus } from '../../account/accountSlice'
import { updateBusinessDocumentStatus } from '../../businesses/businessSlice'
import { updateParcelProofStatus } from '../../parcels/parcelSlice'
import { moderateReview } from '../../reviews/reviewSlice'
import { REVIEW_DISPUTE_STATUS } from '@moxt/shared/utils/reviewUtils.js'
import { ActionButton, contentActions, resolveDisputeAndUnlockOrder } from '../adminActions'
import { CARD, ITEM } from '../adminConfig'
import { adminText } from '../adminI18n'
import { Empty, SectionTitle } from './AdminShared'

function QueueSection({ icon, items, kind, label, renderActions, renderMeta, setSelected, t }) {
  return (
    <div className={`${CARD} p-5 grid gap-4`}>
      <SectionTitle icon={icon} label={label} count={items.length} tone={items.length ? 'warning' : 'success'} />
      {items.length ? (
        items.map((item) => (
          <div key={item.id} className={`${ITEM} grid min-w-0 gap-3 overflow-hidden`}>
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected({ kind, item })}
                className="min-w-0 flex-1 text-left hover:text-brand-700"
              >
                <strong className="block truncate text-sm">
                  {item.userName || item.reason || item.comment || item.subject || item.id}
                </strong>
                <p className="truncate text-xs text-[var(--app-text-muted)]">{renderMeta(item)}</p>
              </button>
              <Badge className="shrink-0">{item.status}</Badge>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">{renderActions(item)}</div>
          </div>
        ))
      ) : (
        <Empty label={adminText(t, 'admin.empty.noElement')} icon={icon} />
      )}
    </div>
  )
}

export function AdminQueuesPanel({
  adminId,
  actorRole = 'admin',
  dispatch,
  queues,
  setSelected,
  variant = 'admin',
}) {
  const { t } = useLanguage()
  const isModeration = variant === 'moderation'

  return (
    <div className="grid gap-5">
      {!isModeration ? (
        <>
          <QueueSection
            icon={FiTrash2}
            items={queues.accountDeletions}
            label={adminText(t, 'admin.overview.queue.deletions')}
            kind="accountDeletion"
            setSelected={setSelected}
            t={t}
            renderMeta={(item) =>
              `${item.userName || item.userId}${item.userEmail ? ` · ${item.userEmail}` : ''}`
            }
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
                {adminText(t, 'admin.queues.viewProfile')}
              </Button>
            )}
          />
          <QueueSection
            icon={FiUserCheck}
            items={queues.verifications}
            label={t('verification.admin.title')}
            kind="verification"
            setSelected={setSelected}
            t={t}
            renderMeta={(i) =>
              adminText(t, 'admin.queues.levelMeta', {
                level: i.level,
                name: i.userName || i.userId,
              })
            }
            renderActions={(i) => (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setSelected({ kind: 'verification', item: i })}
                >
                  {t('verification.admin.examine')}
                </Button>
                <Button
                  icon={FiCheckCircle}
                  onClick={() =>
                    dispatch(
                      updateVerificationStatus({
                        id: i.id,
                        status: 'verified',
                        reviewedBy: adminId,
                      }),
                    )
                  }
                >
                  {t('verification.admin.approve')}
                </Button>
                <Button
                  variant="danger"
                  icon={FiX}
                  onClick={() =>
                    dispatch(
                      updateVerificationStatus({
                        id: i.id,
                        status: 'rejected',
                        reviewedBy: adminId,
                      }),
                    )
                  }
                >
                  {t('verification.admin.reject')}
                </Button>
              </>
            )}
          />
          <QueueSection
            icon={FiFileText}
            items={queues.businessDocuments}
            label={adminText(t, 'admin.businessDocuments.title')}
            kind="businessDocument"
            setSelected={setSelected}
            t={t}
            renderMeta={(i) =>
              adminText(t, 'admin.businessDocuments.queueMeta', {
                business: i.businessName || i.businessId,
                name: i.name,
              })
            }
            renderActions={(i) => (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setSelected({ kind: 'businessDocument', item: i })}
                >
                  {adminText(t, 'admin.businessDocuments.examine')}
                </Button>
                <Button
                  icon={FiCheckCircle}
                  onClick={() =>
                    dispatch(
                      updateBusinessDocumentStatus({
                        id: i.id,
                        status: 'verified',
                        reviewedBy: adminId,
                        reviewNote: '',
                      }),
                    )
                  }
                >
                  {adminText(t, 'admin.actions.approve')}
                </Button>
                <Button
                  variant="danger"
                  icon={FiX}
                  onClick={() =>
                    dispatch(
                      updateBusinessDocumentStatus({
                        id: i.id,
                        status: 'rejected',
                        reviewedBy: adminId,
                      }),
                    )
                  }
                >
                  {adminText(t, 'admin.actions.reject')}
                </Button>
              </>
            )}
          />
          <QueueSection
            icon={FiPackage}
            items={queues.parcelProofs || []}
            label={adminText(t, 'admin.overview.queue.parcelProofs')}
            kind="parcels"
            setSelected={setSelected}
            t={t}
            renderMeta={(i) =>
              adminText(t, 'admin.queues.parcelProofMeta', {
                route: `${i.origin || '—'} → ${i.destination || '—'}`,
                status: i.proofStatus || 'pending_review',
              })
            }
            renderActions={(i) => (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setSelected({ kind: 'parcels', item: i })}
                >
                  {adminText(t, 'admin.queues.examineProof')}
                </Button>
                <ActionButton
                  icon={FiCheckCircle}
                  done={i.proofStatus === 'verified'}
                  doneLabel={adminText(t, 'admin.queues.validateProof')}
                  onClick={() =>
                    dispatch(updateParcelProofStatus({ id: i.id, status: 'verified' }))
                  }
                >
                  {adminText(t, 'admin.queues.validateProof')}
                </ActionButton>
                <ActionButton
                  variant="danger"
                  icon={FiX}
                  done={i.proofStatus === 'rejected'}
                  doneLabel={adminText(t, 'admin.queues.rejectProof')}
                  onClick={() =>
                    dispatch(updateParcelProofStatus({ id: i.id, status: 'rejected' }))
                  }
                >
                  {adminText(t, 'admin.queues.rejectProof')}
                </ActionButton>
              </>
            )}
          />
          <QueueSection
            icon={FiHeadphones}
            items={queues.support}
            label={adminText(t, 'admin.nav.support')}
            kind="support"
            setSelected={setSelected}
            t={t}
            renderMeta={(item) =>
              adminText(t, 'admin.support.meta', {
                name: item.userName,
                count: item.messages?.length || 0,
              })
            }
            renderActions={() => (
              <Link to="/admin?view=support">
                <Button variant="secondary">{adminText(t, 'admin.support.reply')}</Button>
              </Link>
            )}
          />
        </>
      ) : null}
      <QueueSection
        icon={FiAlertCircle}
        items={queues.disputes}
        label={adminText(t, 'admin.queues.disputesLabel')}
        kind="dispute"
        setSelected={setSelected}
        t={t}
        renderMeta={(i) => `${i.relatedType} · ${i.relatedId}`}
        renderActions={(i) => (
          <>
            <Button
              onClick={() =>
                resolveDisputeAndUnlockOrder(dispatch, i, {
                  status: 'resolved',
                  actorId: adminId,
                  actorRole,
                })
              }
            >
              {adminText(t, 'admin.actions.resolve')}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                resolveDisputeAndUnlockOrder(dispatch, i, {
                  status: 'closed',
                  actorId: adminId,
                  actorRole,
                })
              }
            >
              {adminText(t, 'admin.actions.close')}
            </Button>
          </>
        )}
      />
      <QueueSection
        icon={FiStar}
        items={queues.contestedReviews}
        label={adminText(t, 'admin.queues.contestedReviewsLabel')}
        kind="contestedReview"
        setSelected={setSelected}
        t={t}
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
              {adminText(t, 'admin.actions.removeReview')}
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
              {adminText(t, 'admin.actions.rejectContest')}
            </Button>
          </>
        )}
      />
      <QueueSection
        icon={FiStar}
        items={queues.reviews}
        label={adminText(t, 'admin.overview.queue.reviews')}
        kind="review"
        setSelected={setSelected}
        t={t}
        renderMeta={(i) => `${i.targetType} · ${i.rating || 0}/5`}
        renderActions={(i) => (
          <>
            <Button onClick={() => dispatch(moderateReview({ id: i.id, status: 'published', moderatedBy: 'admin' }))}>
              {adminText(t, 'admin.actions.publish')}
            </Button>
            <Button variant="danger" onClick={() => dispatch(moderateReview({ id: i.id, status: 'hidden', moderatedBy: 'admin' }))}>
              {adminText(t, 'admin.actions.hide')}
            </Button>
          </>
        )}
      />
      <QueueSection
        icon={FiAlertTriangle}
        items={queues.reports}
        label={adminText(t, 'admin.overview.queue.reports')}
        kind="report"
        setSelected={setSelected}
        t={t}
        renderMeta={(i) => `${i.reportType} · ${i.relatedId}`}
        renderActions={(i) => contentActions('reports', dispatch, i, t)}
      />
    </div>
  )
}
