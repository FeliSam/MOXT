import { useMemo, useState } from 'react'
import { FiCheckCircle, FiFileText, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useLanguage } from '../../../contexts/useLanguage'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { businessDocumentTypeLabel } from '../../businesses/businessDocumentTypes'
import { updateBusinessDocumentStatus } from '../../businesses/businessSlice'
import { formatDate } from '../../transfers/transferUtils'
import { CARD, ITEM } from '../adminConfig'
import { adminText } from '../adminI18n'
import { AdminDocumentPreview } from './AdminDocumentPreview'
import { Empty, SectionTitle } from './AdminShared'

function statusTone(status) {
  if (status === 'verified') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

export function AdminBusinessDocumentsPanel({
  adminId,
  dispatch,
  documents = [],
  query = '',
  setSelected,
  statusFilter = 'all',
}) {
  const { t } = useLanguage()
  const businesses = useSelector((state) => state.businesses.items || [])
  const users = useSelector((state) => state.administration.users || [])
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const items = useMemo(() => {
    let list = [...documents]
    if (statusFilter === 'pending') {
      list = list.filter((item) => ['pending_review', 'pending'].includes(item.status))
    } else if (statusFilter !== 'all') {
      list = list.filter((item) => item.status === statusFilter)
    }
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((item) => {
        const business = businesses.find((entry) => entry.id === item.businessId)
        const owner = users.find((entry) => entry.id === item.ownerId)
        const ownerName = `${owner?.firstName || ''} ${owner?.lastName || ''}`.trim()
        const haystack = [
          item.id,
          item.name,
          item.category,
          item.status,
          item.businessId,
          business?.name,
          ownerName,
          owner?.email,
        ]
          .filter(Boolean)
          .join(' ')
        return haystack.toLowerCase().includes(q)
      })
    }
    return list.sort((a, b) => {
      const pendingRank = (status) => (['pending_review', 'pending'].includes(status) ? 0 : 1)
      const rank = pendingRank(a.status) - pendingRank(b.status)
      if (rank !== 0) return rank
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    })
  }, [businesses, documents, query, statusFilter, users])

  function approve(item) {
    dispatch(
      updateBusinessDocumentStatus({
        id: item.id,
        status: 'verified',
        reviewedBy: adminId,
        reviewNote: '',
      }),
    )
  }

  function reject(item) {
    dispatch(
      updateBusinessDocumentStatus({
        id: item.id,
        status: 'rejected',
        reviewedBy: adminId,
        reviewNote: rejectReason,
      }),
    )
    setRejectId(null)
    setRejectReason('')
  }

  return (
    <div className={`${CARD} grid gap-4 p-5`}>
      <SectionTitle
        icon={FiFileText}
        label={adminText(t, 'admin.businessDocuments.title')}
        count={items.length}
        tone={items.some((item) => ['pending_review', 'pending'].includes(item.status)) ? 'warning' : 'success'}
      />
      <p className="text-sm text-[var(--app-text-muted)]">
        {adminText(t, 'admin.businessDocuments.description')}
      </p>

      {items.length ? (
        items.map((item) => {
          const business = businesses.find((entry) => entry.id === item.businessId)
          const pending = ['pending_review', 'pending'].includes(item.status)
          const typeLabel = businessDocumentTypeLabel(item.category, t)
          return (
            <div key={item.id} className={`${ITEM} grid min-w-0 gap-3 overflow-hidden`}>
              <div className="flex min-w-0 flex-wrap items-start gap-3">
                <button
                  type="button"
                  onClick={() => setSelected({ kind: 'businessDocument', item })}
                  className="min-w-0 flex-1 text-left hover:text-brand-700"
                >
                  <strong className="block truncate text-sm">
                    {business?.name || item.businessName || item.name}
                  </strong>
                  <p className="truncate text-xs text-[var(--app-text-muted)]">
                    {adminText(t, 'admin.businessDocuments.meta', {
                      type: typeLabel,
                      name: item.name,
                      date: formatDate(item.createdAt),
                    })}
                  </p>
                  {item.reviewNote ? (
                    <p className="mt-1 line-clamp-2 break-words text-xs text-rose-700 dark:text-rose-300">
                      {adminText(t, 'admin.businessDocuments.rejectNoteLabel', {
                        note: item.reviewNote,
                      })}
                    </p>
                  ) : null}
                </button>
                <Badge tone={statusTone(item.status)} className="shrink-0">
                  {item.status}
                </Badge>
              </div>

              {rejectId === item.id ? (
                <div className="grid gap-2 rounded-xl bg-[var(--app-surface)] p-3 ring-1 ring-[var(--app-border)]">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
                    {adminText(t, 'admin.businessDocuments.rejectReasonLabel')}
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    rows={3}
                    placeholder={adminText(t, 'admin.businessDocuments.rejectReasonPlaceholder')}
                    className="w-full rounded-xl bg-[var(--app-surface-muted)] p-3 text-sm outline-none ring-1 ring-[var(--app-border)] focus:ring-brand-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="danger" icon={FiX} onClick={() => reject(item)}>
                      {adminText(t, 'admin.businessDocuments.rejectConfirm')}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setRejectId(null)
                        setRejectReason('')
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid min-w-0 gap-3">
                  <AdminDocumentPreview documents={[item]} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setSelected({ kind: 'businessDocument', item })}
                    >
                      {adminText(t, 'admin.businessDocuments.examine')}
                    </Button>
                    {pending ? (
                      <>
                        <Button icon={FiCheckCircle} onClick={() => approve(item)}>
                          {adminText(t, 'admin.actions.approve')}
                        </Button>
                        <Button
                          variant="danger"
                          icon={FiX}
                          onClick={() => {
                            setRejectId(item.id)
                            setRejectReason('')
                          }}
                        >
                          {adminText(t, 'admin.actions.reject')}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )
        })
      ) : (
        <Empty label={adminText(t, 'admin.businessDocuments.empty')} icon={FiFileText} />
      )}
    </div>
  )
}
